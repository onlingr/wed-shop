import React, { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MENU_ITEMS } from '../constants';
import { OrderStatus } from '../types';
import { useCart } from '../contexts/CartContext';

const Home: React.FC = () => {
  const { 
    cart, addToCart, removeFromCart, clearCart, totalAmount, totalItems,
    isCheckoutOpen, openCheckout, closeCheckout 
  } = useCart();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 顧客資料狀態
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // 搜尋與分類狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  // 自動從 MENU_ITEMS 提取所有分類，並加上 '全部'
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(MENU_ITEMS.map(item => item.category)));
    return ['全部', ...uniqueCategories];
  }, []);

  // 根據搜尋關鍵字與分類過濾商品
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  // 開啟結帳視窗
  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    openCheckout();
  };

  // 送出訂單到 Firestore
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "orders"), {
        items: cart,
        totalAmount,
        status: OrderStatus.PENDING,
        createdAt: serverTimestamp(),
        customerName,   // 必填
        customerPhone,  // 必填
        customerNote: customerNote || '',   // 選填
      });
      alert("訂單已送出！我們會盡快為您準備。");
      clearCart();
      closeCheckout();
      // 重置表單
      setCustomerName('');
      setCustomerPhone('');
      setCustomerNote('');
    } catch (error) {
      console.error("送出訂單失敗:", error);
      alert("送出失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              // 檢查此商品是否已在購物車中
              const cartItem = cart.find(c => c.id === item.id);
              const quantity = cartItem ? cartItem.quantity : 0;

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100 group">
                  <div className="relative overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold shadow-sm text-gray-700">
                      {item.category}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                      <span className="text-lg font-bold text-brand-600">${item.price}</span>
                    </div>
                    
                    {/* 根據數量顯示不同按鈕狀態 */}
                    {quantity > 0 ? (
                      <div className="mt-4 flex items-center justify-between bg-brand-50 rounded-lg p-1 border border-brand-100">
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="w-10 h-9 flex items-center justify-center bg-white rounded shadow-sm text-brand-600 font-bold hover:bg-gray-50 active:scale-95 transition-all"
                        >
                          -
                        </button>
                        <span className="font-bold text-brand-800 text-lg w-8 text-center">{quantity}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="w-10 h-9 flex items-center justify-center bg-brand-600 rounded shadow-sm text-white font-bold hover:bg-brand-700 active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="mt-4 w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <span>加入購物車</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="bg-gray-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">找不到相關餐點</h3>
            <p className="text-gray-500 mt-1">請嘗試不同的關鍵字或分類</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedCategory('全部');}}
              className="mt-4 text-brand-600 font-medium hover:text-brand-700"
            >
              清除所有條件
            </button>
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
                <span className="text-2xl font-extrabold text-brand-600">{totalAmount}</span>
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
                         <div className="text-sm text-gray-500">${item.price} / 份</div>
                       </div>
                       <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 px-2 py-1 ml-4 shadow-sm">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                          >
                            -
                          </button>
                          <span className="font-bold text-gray-800 w-4 text-center">{item.quantity}</span>
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
                   <span className="font-extrabold text-2xl text-brand-600">${totalAmount}</span>
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