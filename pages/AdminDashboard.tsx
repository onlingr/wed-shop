
import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderStatus, MenuItem } from '../types';
import Loading from '../components/Loading';
import { MENU_ITEMS } from '../constants';

type Tab = 'orders' | 'menu' | 'settings';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  
  // Orders State (全時監聽)
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Menu State
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null); // For Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Settings State
  const [storeOpen, setStoreOpen] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // --- Real-time Orders (Always Active) ---
  // 移除了 if (activeTab !== 'orders') 的限制，確保在任何分頁都能收到新訂單
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
  }, []); // Empty dependency array = run once on mount and stay active

  // 計算待處理訂單數量
  const pendingCount = useMemo(() => {
    return orders.filter(o => o.status === OrderStatus.PENDING).length;
  }, [orders]);

  // --- Browser Title Notification ---
  // 當有待處理訂單時，修改瀏覽器標題
  useEffect(() => {
    const originalTitle = document.title;
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) 美味點餐 - 管理後台`;
    } else {
      document.title = '美味點餐 - 管理後台';
    }
    return () => { document.title = '美味點餐 - 遠端點餐系統'; }; // Cleanup
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
      // 簡單排序：依分類再依名稱
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
        // 若文檔不存在，預設為開啟
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
        // Edit existing
        await updateDoc(doc(db, "products", editingProduct.id), productData);
      } else {
        // Add new
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
      // 簡單迴圈寫入，實際專案可用 batch
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
      case OrderStatus.PENDING: return 'bg-red-100 text-red-800 border-red-200'; // 改為紅色
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Tab Navigation */}
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
            {/* 訂單通知紅點 Badge */}
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">即時訂單監控</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {pendingCount > 0 && (
                 <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                   {pendingCount} 筆待處理
                 </span>
              )}
              <span>共 {orders.length} 筆</span>
            </div>
          </div>
          
          {ordersLoading ? <Loading /> : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {orders.map((order) => (
                <div 
                  key={order.id} 
                  className={`
                    bg-white rounded-lg border-2 shadow-sm overflow-hidden flex flex-col transition-all duration-300
                    ${order.status === OrderStatus.PENDING 
                      ? 'border-red-500 shadow-lg shadow-red-100 ring-1 ring-red-500' // 新訂單強化視覺：紅色邊框、陰影
                      : 'border-gray-100 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="p-4 flex-grow">
                    <div className="flex justify-between items-start mb-4">
                      {/* 顯示訂單編號 */}
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 mb-1 inline-block w-fit">
                          #{String(order.orderNumber || 0).padStart(3, '0')}
                        </span>
                        <span className="text-xs text-gray-400">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString('zh-TW') : '剛剛'}
                        </span>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                        {order.status === OrderStatus.PENDING ? '🔔 新訂單' : 
                         order.status === OrderStatus.PREPARING ? '製作中' :
                         order.status === OrderStatus.COMPLETED ? '已完成' : '已取消'}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded mb-4 text-sm border border-gray-100">
                      <div className="flex items-center mb-1">
                          <span className="font-medium text-gray-900 text-base">{order.customerName}</span>
                      </div>
                      <div className="flex items-center mb-1">
                          <span className="text-gray-600 font-mono tracking-wider">{order.customerPhone}</span>
                      </div>
                      {order.customerNote && (
                        <div className="mt-2 text-gray-700 bg-yellow-50 p-2 rounded border border-yellow-100 text-xs font-medium">
                          備註: {order.customerNote}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            <span className="font-bold mr-2 text-gray-900 text-base">{item.quantity}x</span>
                            {item.name}
                          </span>
                          <span className="text-gray-500">${item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-xs text-gray-500">總金額</span>
                        <span className="text-xl font-bold text-red-600">${order.totalAmount}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                    {order.status === OrderStatus.PENDING && (
                      <button onClick={() => updateOrderStatus(order.id!, OrderStatus.PREPARING)} className="col-span-2 w-full bg-red-600 text-white font-bold py-2.5 rounded text-sm hover:bg-red-700 shadow-md transition-colors animate-pulse">接單 / 開始製作</button>
                    )}
                    {order.status === OrderStatus.PREPARING && (
                      <button onClick={() => updateOrderStatus(order.id!, OrderStatus.COMPLETED)} className="col-span-2 w-full bg-green-600 text-white font-bold py-2.5 rounded text-sm hover:bg-green-700 shadow-md transition-colors">完成訂單</button>
                    )}
                    <button onClick={() => updateOrderStatus(order.id!, OrderStatus.CANCELLED)} className="w-full border bg-white text-gray-700 hover:bg-gray-50 py-1.5 rounded text-xs transition-colors">取消</button>
                    <button onClick={() => deleteOrder(order.id!)} className="w-full border border-gray-200 bg-white text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 py-1.5 rounded text-xs transition-colors">刪除</button>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 border-2 border-dashed rounded-lg">暫無訂單</div>}
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
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700"
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
                           className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
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
