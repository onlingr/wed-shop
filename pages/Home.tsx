import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MENU_ITEMS } from '../constants';
import { MenuItem, CartItem, OrderStatus } from '../types';

const Home: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加入購物車邏輯
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // 移除或減少項目
  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.id !== itemId);
    });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 送出訂單到 Firestore
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "orders"), {
        items: cart,
        totalAmount,
        status: OrderStatus.PENDING,
        createdAt: serverTimestamp(), // 使用伺服器時間
      });
      alert("訂單已送出！我們會盡快為您準備。");
      setCart([]);
    } catch (error) {
      console.error("送出訂單失敗:", error);
      alert("送出失敗，請稍後再試。");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      <div className="bg-brand-50 py-8 mb-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800">歡迎光臨，今天想吃點什麼？</h1>
          <p className="text-gray-600 mt-2">線上點餐，美味直達</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MENU_ITEMS.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mb-2">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                  </div>
                  <span className="text-lg font-bold text-brand-600">${item.price}</span>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="mt-4 w-full bg-brand-600 text-white py-2 px-4 rounded hover:bg-brand-700 transition-colors"
                >
                  加入購物車
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部固定購物車 */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 z-40">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full sm:w-auto">
              <h3 className="font-bold text-gray-800 mb-2 sm:mb-0">
                購物車 ({cart.reduce((c, i) => c + i.quantity, 0)} 項)
              </h3>
              <div className="flex gap-2 overflow-x-auto py-1">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm whitespace-nowrap">
                    <button onClick={() => removeFromCart(item.id)} className="mr-2 text-red-500 font-bold">-</button>
                    <span>{item.name} x {item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="ml-2 text-green-600 font-bold">+</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0">
              <div className="text-xl font-bold text-gray-800">
                總計: <span className="text-brand-600">${totalAmount}</span>
              </div>
              <button
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                className="bg-brand-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-700 disabled:opacity-50 min-w-[120px]"
              >
                {isSubmitting ? '處理中...' : '送出訂單'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
