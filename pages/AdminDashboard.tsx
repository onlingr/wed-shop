
import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderStatus, MenuItem } from '../types';
import Loading from '../components/Loading';
import { MENU_ITEMS } from '../constants';

type Tab = 'orders' | 'menu' | 'settings';
// 新增：訂單篩選狀態類型 (加入 'all')
type OrderFilterType = 'all' | 'pending' | 'preparing' | 'completed' | 'history';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  
  // Orders State (全時監聽)
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  // 新增：訂單篩選狀態 (預設顯示待處理)
  const [orderFilter, setOrderFilter] = useState<OrderFilterType>('pending');
  
  // 新增：控制哪個訂單卡片開啟了管理選單
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Menu State
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null); // For Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Settings State
  const [storeOpen, setStoreOpen] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // --- Real-time Orders (Always Active) ---
  useEffect(() => {
    setOrdersLoading(true);
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(newOrders);
      setOrdersLoading(false);
    }, (error) => {
      console.error("讀取訂單失敗:", error);
      setOrdersLoading(false);
    });
    return () => unsubscribe();
  }, []); 

  // --- Computed Values for Badges & Filtering ---
  
  // 計算各狀態數量
  const counts = useMemo(() => {
    return {
      all: orders.length, // 所有訂單總數
      pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
      preparing: orders.filter(o => o.status === OrderStatus.PREPARING).length,
      completed: orders.filter(o => o.status === OrderStatus.COMPLETED).length,
      // 歷史包含: 已送餐 + 已取消
      history: orders.filter(o => o.status === OrderStatus.SERVED || o.status === OrderStatus.CANCELLED).length
    };
  }, [orders]);

  // 計算今日已完成 (COMPLETED + SERVED) 訂單總金額
  const todayRevenue = useMemo(() => {
    const todayStr = new Date().toDateString(); // 取得今日日期字串 (例如 "Sat Nov 30 2024")
    
    return orders.reduce((sum, order) => {
      // 確保訂單有時間戳記
      if (!order.createdAt?.toDate) return sum;
      
      const orderDate = order.createdAt.toDate();
      // 判斷是否為今天
      const isToday = orderDate.toDateString() === todayStr;
      
      // 判斷狀態：只計算「可取餐」與「已送餐」的金額，這代表訂單已實質完成
      const isRevenue = order.status === OrderStatus.COMPLETED || order.status === OrderStatus.SERVED;
      
      if (isToday && isRevenue) {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);
  }, [orders]);

  // 待處理總數 (用於瀏覽器標題與主分頁 Badge)
  const pendingCount = counts.pending;

  // 根據篩選器過濾訂單列表
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (orderFilter === 'all') return true; // 顯示全部
      if (orderFilter === 'pending') return order.status === OrderStatus.PENDING;
      if (orderFilter === 'preparing') return order.status === OrderStatus.PREPARING;
      if (orderFilter === 'completed') return order.status === OrderStatus.COMPLETED;
      if (orderFilter === 'history') return order.status === OrderStatus.SERVED || order.status === OrderStatus.CANCELLED;
      return true;
    });
  }, [orders, orderFilter]);


  // --- Browser Title Notification ---
  useEffect(() => {
    const originalTitle = document.title;
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) 美味點餐 - 管理後台`;
    } else {
      document.title = '美味點餐 - 管理後台';
    }
    return () => { document.title = '美味點餐 - 遠端點餐系統'; };
  }, [pendingCount]);

  // --- Real-time Products ---
  useEffect(() => {
    if (activeTab !== 'menu') return;

    setMenuLoading(true);
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem));
      items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      setProducts(items);
      setMenuLoading(false);
    }, (error) => {
      console.error("讀取商品失敗:", error);
      setMenuLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  // --- Real-time Settings ---
  useEffect(() => {
    if (activeTab !== 'settings') return;
    
    setSettingsLoading(true);
    const unsubscribe = onSnapshot(doc(db, "settings", "store"), (docSnap) => {
      if (docSnap.exists()) {
        setStoreOpen(docSnap.data().isOpen !== false);
      } else {
        setStoreOpen(true);
      }
      setSettingsLoading(false);
    }, (error) => {
      console.error("讀取設定失敗:", error);
      setSettingsLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);


  // --- Order Actions ---
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (e) { alert("更新失敗"); }
  };
  const deleteOrder = async (orderId: string) => {
    if(!window.confirm("確定刪除?")) return;
    try { await deleteDoc(doc(db, "orders", orderId)); } catch (e) { console.error(e); }
  };

  // --- Menu Actions ---
  const toggleProductAvailability = async (product: MenuItem) => {
    try {
      await updateDoc(doc(db, "products", product.id), {
        isAvailable: !product.isAvailable
      });
    } catch (e) { alert("更新失敗"); }
  };

  const handleDeleteProduct = async (id: string) => {
    if(!window.confirm("確定刪除此商品?")) return;
    try { await deleteDoc(doc(db, "products", id)); } catch(e) { alert("刪除失敗"); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const productData = {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        category: editingProduct.category,
        image: editingProduct.image,
        isAvailable: editingProduct.isAvailable ?? true
      };

      if (editingProduct.id) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
      } else {
        await addDoc(collection(db, "products"), productData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert("儲存失敗");
    }
  };

  // --- Settings Actions ---
  const toggleStoreStatus = async () => {
    try {
      await setDoc(doc(db, "settings", "store"), { isOpen: !storeOpen }, { merge: true });
    } catch(e) { alert("設定失敗"); }
  };

  const importDefaultMenu = async () => {
    if (!window.confirm("這將會把預設菜單資料寫入資料庫，確定執行？")) return;
    try {
      for (const item of MENU_ITEMS) {
        await addDoc(collection(db, "products"), {
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            isAvailable: true
        });
      }
      alert("匯入成功！請至「菜單管理」查看。");
    } catch (e) {
      console.error(e);
      alert("匯入失敗");
    }
  };

  // --- Helper for Status Color ---
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-red-100 text-red-800 border-red-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.SERVED: return 'bg-gray-100 text-gray-600 border-gray-200';
      case OrderStatus.CANCELLED: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Navigation */}
      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'orders' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            訂單管理
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`${activeTab === 'menu' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            菜單管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`${activeTab === 'settings' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            商店設定
          </button>
        </nav>
      </div>

      {/* --- TAB: ORDERS --- */}
      {activeTab === 'orders' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <h1 className="text-2xl font-bold text-gray-900">即時訂單監控</h1>
              {/* 今日營收顯示 */}
              <div className="bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 shadow-sm flex items-center gap-2">
                 <span className="text-sm text-green-800 font-medium">今日已完成營收:</span>
                 <span className="text-lg font-bold text-green-700">${todayRevenue}</span>
              </div>
            </div>
            
            {/* 訂單分類篩選按鈕 (Tabs) */}
            <div className="flex p-1 space-x-1 bg-gray-100 rounded-xl overflow-x-auto max-w-full">
              {[
                { id: 'all', label: '全部', count: counts.all, color: 'text-gray-800' },
                { id: 'pending', label: '新訂單', count: counts.pending, color: 'text-red-600' },
                { id: 'preparing', label: '製作中', count: counts.preparing, color: 'text-blue-600' },
                { id: 'completed', label: '可取餐', count: counts.completed, color: 'text-green-600' },
                { id: 'history', label: '歷史記錄', count: counts.history, color: 'text-gray-600' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOrderFilter(tab.id as OrderFilterType)}
                  className={`
                    w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                    ${orderFilter === tab.id 
                      ? 'bg-white shadow text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}
                  `}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold bg-white shadow-sm border ${tab.color.replace('text', 'border')} ${tab.color}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          
          {ordersLoading ? <Loading /> : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filteredOrders.map((order) => {
                const isMenuOpen = menuOpenId === order.id;
                
                return (
                  <div 
                    key={order.id} 
                    className={`
                      bg-white rounded-lg border-2 shadow-sm overflow-hidden flex flex-col transition-all duration-300 relative
                      ${order.status === OrderStatus.PENDING 
                        ? 'border-red-500 shadow-lg shadow-red-50 ring-2 ring-red-100' 
                        : order.status === OrderStatus.PREPARING 
                          ? 'border-blue-400 ring-1 ring-blue-50'
                          : order.status === OrderStatus.COMPLETED
                            ? 'border-green-400 ring-1 ring-green-50'
                            : 'border-gray-100 opacity-75'
                      }
                    `}
                  >
                    <div className="p-4 flex-grow">
                      {/* 卡片頂部資訊列 */}
                      <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 border-dashed">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-gray-800 font-mono bg-gray-100 px-2 py-1 rounded">
                              #{String(order.orderNumber || 0).padStart(3, '0')}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStatusColor(order.status)}`}>
                              {order.status === OrderStatus.PENDING ? '新訂單' : 
                              order.status === OrderStatus.PREPARING ? '製作中' :
                              order.status === OrderStatus.COMPLETED ? '可取餐' : 
                              order.status === OrderStatus.SERVED ? '已送餐' : '已取消'}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 mt-1 pl-1">
                            {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '剛剛'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600">${order.totalAmount}</div>
                        </div>
                      </div>

                      {/* 顧客資料 */}
                      <div className="bg-gray-50 p-3 rounded mb-4 text-sm border border-gray-100 flex flex-col gap-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-gray-800">{order.customerName}</span>
                          <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline font-mono">{order.customerPhone}</a>
                        </div>
                        {order.customerNote && (
                          <div className="mt-1 text-gray-700 bg-yellow-50 px-2 py-1 rounded border border-yellow-100 text-xs font-medium flex items-start gap-1">
                            <span className="shrink-0">📝</span> 
                            <span>{order.customerNote}</span>
                          </div>
                        )}
                      </div>

                      {/* 餐點清單 */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm items-center">
                            <span className="text-gray-700 flex items-center gap-2">
                              <span className="font-bold text-gray-900 bg-gray-200 px-1.5 rounded min-w-[24px] text-center">{item.quantity}</span>
                              <span>{item.name}</span>
                            </span>
                            <span className="text-gray-400 text-xs">${item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 底部操作按鈕區 - 兩段式設計防止誤觸 */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                      {isMenuOpen ? (
                        // --- 管理選單 (取消/刪除) ---
                        <div className="space-y-3 animate-fade-in">
                          <div className="flex items-center justify-between text-xs text-red-500 font-bold mb-1">
                            <span>⚠️ 管理選項</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            {/* 只有未結案的訂單才顯示取消 */}
                            {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.SERVED && (
                              <button 
                                onClick={() => { 
                                  if(window.confirm('確定要取消此訂單嗎？')) {
                                    updateOrderStatus(order.id!, OrderStatus.CANCELLED); 
                                    setMenuOpenId(null); 
                                  }
                                }}
                                className="col-span-1 bg-orange-50 text-orange-700 border border-orange-200 py-2 rounded-lg text-sm font-bold hover:bg-orange-100 transition-colors"
                              >
                                🚫 取消訂單
                              </button>
                            )}
                            
                            <button 
                              onClick={() => { deleteOrder(order.id!); setMenuOpenId(null); }}
                              className={`${(order.status === OrderStatus.CANCELLED || order.status === OrderStatus.SERVED) ? 'col-span-2' : 'col-span-1'} bg-white text-red-600 border border-red-200 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-colors`}
                            >
                              🗑️ 永久刪除
                            </button>
                          </div>

                          <button 
                            onClick={() => setMenuOpenId(null)}
                            className="w-full bg-gray-200 text-gray-600 py-2 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
                          >
                            ↩️ 返回
                          </button>
                        </div>
                      ) : (
                        // --- 主要操作區 ---
                        <div className="flex gap-2">
                          <div className="flex-1">
                            {order.status === OrderStatus.PENDING && (
                              <button onClick={() => updateOrderStatus(order.id!, OrderStatus.PREPARING)} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg text-sm hover:bg-red-700 shadow-sm active:scale-[0.98] animate-pulse">
                                🔥 接單 / 開始製作
                              </button>
                            )}
                            {order.status === OrderStatus.PREPARING && (
                              <button onClick={() => updateOrderStatus(order.id!, OrderStatus.COMPLETED)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg text-sm hover:bg-blue-700 shadow-sm active:scale-[0.98]">
                                ✅ 製作完成 / 通知取餐
                              </button>
                            )}
                            {order.status === OrderStatus.COMPLETED && (
                              <button onClick={() => updateOrderStatus(order.id!, OrderStatus.SERVED)} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg text-sm hover:bg-green-700 shadow-sm active:scale-[0.98]">
                                🎉 已送餐 / 結案
                              </button>
                            )}
                            
                            {/* 對於已結束的訂單，顯示靜態狀態條 */}
                            {(order.status === OrderStatus.SERVED || order.status === OrderStatus.CANCELLED) && (
                              <div className="w-full py-3 text-center text-gray-400 text-sm font-medium border border-gray-200 rounded-lg bg-gray-50">
                                {order.status === OrderStatus.SERVED ? '✅ 訂單已完成' : '🚫 訂單已取消'}
                              </div>
                            )}
                          </div>

                          {/* 更多選項按鈕 (齒輪) */}
                          <button 
                            onClick={() => setMenuOpenId(order.id!)}
                            className="w-12 flex items-center justify-center bg-white border border-gray-200 text-gray-400 rounded-lg hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300 transition-colors"
                            title="管理選項"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* 無訂單時的提示 */}
              {filteredOrders.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="font-medium text-lg">
                    {orderFilter === 'all' ? '目前沒有任何訂單' :
                     orderFilter === 'pending' ? '目前沒有新訂單' : 
                     orderFilter === 'preparing' ? '目前沒有製作中的餐點' :
                     orderFilter === 'completed' ? '目前沒有待取餐的訂單' : '沒有歷史記錄'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* --- TAB: MENU MANAGEMENT --- */}
      {activeTab === 'menu' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">菜單品項管理</h1>
            <button 
              onClick={() => { setEditingProduct({ id: '', name: '', price: 0, image: '', category: '', isAvailable: true }); setIsModalOpen(true); }}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 shadow-sm"
            >
              + 新增商品
            </button>
          </div>

          {menuLoading ? <Loading /> : (
            <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img className="h-10 w-10 rounded object-cover" src={product.image} alt="" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <button 
                           onClick={() => toggleProductAvailability(product)}
                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${product.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                         >
                           {product.isAvailable !== false ? '上架中' : '已下架'}
                         </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="text-brand-600 hover:text-brand-900">編輯</button>
                        <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900">刪除</button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">目前沒有商品，請新增或從設定匯入。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* --- TAB: SETTINGS --- */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
           <h1 className="text-2xl font-bold text-gray-900 mb-6">商店設定</h1>
           
           <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
             
             {/* 營業狀態切換 */}
             <div className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-lg font-medium text-gray-900">營業狀態</h3>
                   <p className="mt-1 text-sm text-gray-500">
                     目前狀態: <span className={storeOpen ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{storeOpen ? "營業中" : "休息中"}</span>
                   </p>
                   <p className="text-xs text-gray-400 mt-1">關閉時，顧客將無法送出新訂單。</p>
                 </div>
                 <button
                   onClick={toggleStoreStatus}
                   className={`
                     relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500
                     ${storeOpen ? 'bg-green-500' : 'bg-gray-200'}
                   `}
                 >
                   <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${storeOpen ? 'translate-x-5' : 'translate-x-0'}`} />
                 </button>
               </div>
             </div>

             {/* 資料匯入 */}
             <div className="p-6">
               <h3 className="text-lg font-medium text-gray-900">資料管理</h3>
               <div className="mt-4">
                 <button
                   onClick={importDefaultMenu}
                   className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                 >
                   匯入預設菜單資料
                 </button>
                 <p className="mt-2 text-xs text-gray-500">
                   若您的資料庫是空的，可點擊此按鈕寫入範例資料 (牛肉麵、珍奶等)。
                 </p>
               </div>
             </div>

           </div>
        </div>
      )}

      {/* --- Modal for Add/Edit Product --- */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-scale-up">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingProduct.id ? '編輯商品' : '新增商品'}</h3>
            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">商品名稱</label>
                <input type="text" required value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">價格</label>
                <input type="number" required value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">分類</label>
                <input type="text" required value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} list="categories" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500" />
                <datalist id="categories">
                   <option value="主食" />
                   <option value="飲品" />
                   <option value="小菜" />
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">圖片網址</label>
                <input type="text" required value={editingProduct.image} onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-brand-500 focus:border-brand-500" />
              </div>
              <div className="flex items-center mt-2">
                 <input id="isAvailable" type="checkbox" checked={editingProduct.isAvailable !== false} onChange={e => setEditingProduct({...editingProduct, isAvailable: e.target.checked})} className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded" />
                 <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">立即上架</label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700">儲存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
