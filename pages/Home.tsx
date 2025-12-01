
import React, { useState, useMemo, useEffect } from 'react';
import { collection, serverTimestamp, onSnapshot, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { MenuItem, OrderStatus } from '../types';
import { useCart } from '../contexts/CartContext';
import Loading from '../components/Loading';

const Home: React.FC = () => {
  const { 
    cart, addToCart, removeFromCart, clearCart, totalAmount, totalItems,
    isCheckoutOpen, openCheckout, closeCheckout 
  } = useCart();
  
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // 新增錯誤狀態
  const [storeOpen, setStoreOpen] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 顧客資料狀態
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // 搜尋與分類狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  // 初始化：監聽商品與商店設定
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // 1. 監聽商品列表
    const unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem));
      // 只顯示上架中的商品
      setProducts(items.filter(item => item.isAvailable !== false));
      setLoading(false);
    }, (err) => {
      console.error("讀取商品失敗:", err);
      // 若是權限錯誤，顯示特定訊息
      if (err.code === 'permission-denied') {
        setError("無法讀取菜單：權限不足。請確認 Firebase Security Rules 設定是否正確。");
      } else {
        setError("讀取菜單失敗，請檢查網路連線。");
      }
      setLoading(false);
    });

    // 2. 監聽商店營業狀態 (settings/store)
    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'store'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStoreOpen(data.isOpen !== false); // 預設 true
      }
    }, (err) => {
      console.error("讀取商店設定失敗:", err);
      // 設定讀取失敗不影響主畫面，但記錄錯誤
    });

    return () => {
      unsubscribeProducts();
      unsubscribeSettings();
    };
  }, []);

  // 自動從 products 提取所有分類，並加上 '全部'
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(products.map(item => item.category)));
    return ['全部', ...uniqueCategories];
  }, [products]);

  // 根據搜尋關鍵字與分類過濾商品
  const filteredItems = useMemo(() => {
    return products.filter(item => {
      const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory, products]);

  // 開啟結帳視窗
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    openCheckout();
  };

  // 送出訂單到 Firestore (使用 Transaction 確保流水號)
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    if (!storeOpen) {
      alert("抱歉，目前商店休息中，無法接收新訂單。");
      return;
    }

    setIsSubmitting(true);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. 取得今日日期字串 (YYYY-MM-DD)，作為 counter 的 ID
        // 使用當地時間，避免時區問題導致隔天還沒重置
        const today = new Date();
        const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        
        const counterRef = doc(db, 'counters', dateStr);
        const counterDoc = await transaction.get(counterRef);
        
        let newOrderNumber = 1;
        if (counterDoc.exists()) {
          const currentCount = counterDoc.data().count || 0;
          newOrderNumber = currentCount + 1;
          transaction.update(counterRef, { count: newOrderNumber });
        } else {
          // 今天第一筆
          transaction.set(counterRef, { count: 1 });
        }

        // 2. 建立新訂單
        const newOrderRef = doc(collection(db, "orders"));
        transaction.set(newOrderRef, {
          orderNumber: newOrderNumber, // 寫入流水號
          items: cart,
          totalAmount,
          status: OrderStatus.PENDING,
          createdAt: serverTimestamp(),
          customerName,   // 必填
          customerPhone,  // 必填
          customerNote: customerNote || '',   // 選填
        });
      });

      alert("訂單已送出！我們會盡快為您準備。");
      clearCart();
      closeCheckout();
      // 重置表單
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNote('');
    } catch (error: any) {
      console.error("送出訂單失敗:", error);
      if (error.code === 'permission-denied') {
        alert("送出失敗：權限不足。請確認 Firestore Rules 是否允許寫入 'counters' 與 'orders'。");
      } else {
        alert("送出失敗，請稍後再試。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  // 錯誤顯示畫面
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">發生錯誤</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            重新整理
          </button>
        </div>
      </div>
    );
  }

  // 商店休息中畫面
  if (!storeOpen) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">本店休息中</h2>
          <p className="text-gray-500">抱歉，目前暫停接單。<br/>請稍後再回來查看。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 relative min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-white shadow-sm py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-800">歡迎光臨</h1>
          <p className="text-gray-500 mt-1 text-sm">點選下方餐點加入購物車</p>
        </div>
      </div>

      {/* 搜尋與分類過濾區塊 (Sticky) */}
      <div className="sticky top-16 z-30 bg-gray-50/95 backdrop-blur-sm shadow-sm pt-4 pb-4 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          
          {/* 搜尋欄 */}
          <div className="relative">
            <input
              type="text"
              placeholder="搜尋餐點..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-brand-500 bg-white text-gray-800 placeholder-gray-400 transition-shadow"
            />
            <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 分類標籤 (可橫向捲動) */}
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${selectedCategory === category 
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-200 scale-105' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {filteredItems.length > 0 ? (
          /* 修改: 改為 grid-cols-1 (單排顯示) 配合 Flex 排版 */
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredItems.map((item) => {
              // 檢查此商品是否已在購物車中
              const cartItem = cart.find(c => c.id === item.id);
              const quantity = cartItem ? cartItem.quantity : 0;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100 group flex flex-row md:flex-col h-28 md:h-auto">
                  {/* Image Section - Mobile: Compact Fixed width (112px), Desktop: Full width */}
                  <div className="relative overflow-hidden w-28 md:w-full h-full md:h-48 shrink-0">
                    {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-300 group-hover:bg-gray-200 transition-colors">
                           <svg className="w-6 h-6 md:w-10 md:h-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                           </svg>
                           <span className="text-[10px] md:text-xs font-medium">無圖片</span>
                        </div>
                    )}
                    <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[10px] md:text-xs font-bold shadow-sm text-gray-700 hidden md:block">
                      {item.category}
                    </div>
                  </div>
                  
                  {/* Content Section - Compact Padding */}
                  <div className="p-2 md:p-4 flex-1 flex flex-col justify-between md:block">
                    <div>
                        <div className="flex justify-between items-start md:mb-1 gap-2">
                          <h3 className="text-sm md:text-lg font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                          {/* 價格改為紅色 */}
                          <span className="text-sm md:text-lg font-bold text-red-600 shrink-0">${item.price}</span>
                        </div>
                        {/* 商品說明 (新增) */}
                        <p className="text-[10px] md:text-xs text-gray-500 line-clamp-2 mt-0.5 md:mt-0 md:mb-2 md:h-8 leading-tight">
                            {item.description}
                        </p>
                    </div>
                    
                    {/* 操作按鈕 (置底) */}
                    <div className="mt-1 md:mt-3">
                        {quantity > 0 ? (
                        <div className="flex items-center justify-between bg-brand-50 rounded-lg p-0.5 md:p-1 border border-brand-100">
                            <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 md:w-10 md:h-9 flex items-center justify-center bg-white rounded shadow-sm text-brand-600 font-bold hover:bg-gray-50 active:scale-95 transition-all"
                            >
                            -
                            </button>
                            {/* 數量改為紅色 */}
                            <span className="font-bold text-red-600 text-sm md:text-lg w-6 md:w-8 text-center">{quantity}</span>
                            <button 
                            onClick={() => addToCart(item)}
                            className="w-8 h-8 md:w-10 md:h-9 flex items-center justify-center bg-brand-600 rounded shadow-sm text-white font-bold hover:bg-brand-700 active:scale-95 transition-all"
                            >
                            +
                            </button>
                        </div>
                        ) : (
                        <button
                            onClick={() => addToCart(item)}
                            className="w-full bg-gray-900 text-white py-2 md:py-2.5 px-3 md:px-4 rounded-lg font-medium hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm"
                        >
                            <span>加入</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              {products.length === 0 ? (
                // 若商品列表為空，提示店長去後台設定
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {products.length === 0 ? "目前尚未建立菜單" : "找不到相關餐點"}
            </h3>
            <p className="text-gray-500 mt-1">
               {products.length === 0 ? "請聯絡管理員至後台新增商品" : "請嘗試不同的關鍵字或分類"}
            </p>
            {products.length > 0 && (
              <button 
                onClick={() => {setSearchTerm(''); setSelectedCategory('全部');}}
                className="mt-4 text-brand-600 font-medium hover:text-brand-700"
              >
                清除所有條件
              </button>
            )}
          </div>
        )}
      </div>

      {/* 底部 Compact 購物車列 */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] p-4 z-40 animate-slide-up">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-gray-500 text-xs font-medium">總計 {totalItems} 項餐點</span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-gray-900">NT$</span>
                {/* 總金額改為紅色 */}
                <span className="text-2xl font-extrabold text-red-600">{totalAmount}</span>
              </div>
            </div>
            
            <button
              onClick={handleOpenCheckout}
              className="flex-1 max-w-[200px] bg-brand-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200 flex items-center justify-center gap-2"
            >
              <span>去買單</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 結帳 Modal (包含詳細清單管理) */}
      {isCheckoutOpen && cart.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] sm:rounded-2xl shadow-2xl flex flex-col animate-scale-up">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sm:rounded-t-2xl">
              <h3 className="text-lg font-bold text-gray-800">結帳確認</h3>
              <button 
                onClick={closeCheckout}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* 訂單詳細清單 */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">餐點明細</h4>
                <div className="space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                       <div className="flex-1">
                         <div className="font-bold text-gray-800">{item.name}</div>
                         <div className="text-sm text-gray-500">
                           {/* 列表價格改為紅色 */}
                           <span className="text-red-600 font-bold">${item.price}</span> / 份
                         </div>
                       </div>
                       <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-2 py-1 ml-4 shadow-sm">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                          >
                            -
                          </button>
                          {/* 列表數量改為紅色 */}
                          <span className="font-bold text-red-600 w-4 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => addToCart(item)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors"
                          >
                            +
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
                {/* 總結列 */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                   <span className="font-bold text-gray-600">總金額</span>
                   {/* Modal 總金額改為紅色 */}
                   <span className="font-extrabold text-2xl text-red-600">${totalAmount}</span>
                </div>
              </div>

              {/* 分隔線 */}
              <div className="h-2 bg-gray-100 -mx-6 mb-6"></div>

              {/* 顧客資料表單 */}
              <form id="order-form" onSubmit={handleSubmitOrder} className="space-y-4">
                <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">聯絡資訊</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">您的稱呼 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="王小明"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all text-black"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手機號碼 <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="0912345678"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all text-black"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">備註需求 (選填)</label>
                  <textarea
                    placeholder="例如：不要香菜、飲料去冰..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all text-black"
                    rows={2}
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white sm:rounded-b-2xl">
              <button
                type="button"
                onClick={closeCheckout}
                className="flex-1 py-3 px-4 rounded-xl text-gray-700 font-bold hover:bg-gray-100 transition-colors"
              >
                再看看
              </button>
              <button
                type="submit"
                form="order-form"
                disabled={isSubmitting}
                className="flex-[2] py-3 px-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-200 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? '處理中...' : '確認送出訂單'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
