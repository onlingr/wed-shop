import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderStatus } from '../types';
import Loading from '../components/Loading';

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // 即時監控功能
  useEffect(() => {
    // 建立 Query: 依照建立時間倒序排列
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    // 使用 onSnapshot 實作即時監聽 (Real-time updates)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(newOrders);
      setLoading(false);
    }, (error) => {
      console.error("監聽訂單失敗:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 更新訂單狀態
  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error("更新狀態失敗:", error);
      alert("操作失敗");
    }
  };

  // 刪除訂單
  const deleteOrder = async (orderId: string) => {
    if (!window.confirm("確定要刪除此訂單嗎？")) return;
    try {
      await deleteDoc(doc(db, "orders", orderId));
    } catch (error) {
      console.error("刪除失敗:", error);
    }
  };

  if (loading) return <Loading />;

  // 定義狀態顏色
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.PREPARING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">即時訂單管理</h1>
        <span className="text-sm text-gray-500">共 {orders.length} 筆訂單</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => (
          <div 
            key={order.id} 
            className={`bg-white rounded-lg border-2 shadow-sm overflow-hidden flex flex-col ${order.status === OrderStatus.PENDING ? 'border-brand-500 shadow-md ring-2 ring-brand-100' : 'border-gray-100'}`}
          >
            <div className="p-4 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getStatusColor(order.status)}`}>
                  {order.status === OrderStatus.PENDING ? '新訂單' : 
                   order.status === OrderStatus.PREPARING ? '製作中' :
                   order.status === OrderStatus.COMPLETED ? '已完成' : '已取消'}
                </span>
                <span className="text-xs text-gray-400">
                  {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleTimeString('zh-TW') : '剛剛'}
                </span>
              </div>

              {/* 顧客資訊區塊 - 新增 */}
              <div className="bg-gray-50 p-3 rounded mb-4 text-sm border border-gray-100">
                <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    <span className="font-medium text-gray-900">{order.customerName}</span>
                </div>
                <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    <span className="text-gray-600 font-mono">{order.customerPhone}</span>
                </div>
                {order.customerNote && (
                  <div className="mt-2 text-gray-500 italic bg-white p-2 rounded border border-gray-100 text-xs">
                    備註: {order.customerNote}
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      <span className="font-bold mr-2 text-gray-900">{item.quantity}x</span>
                      {item.name}
                    </span>
                    <span className="text-gray-500">${item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-900">總金額</span>
                <span className="text-xl font-bold text-brand-600">${order.totalAmount}</span>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 border-t border-gray-100 grid grid-cols-2 gap-2">
              {order.status === OrderStatus.PENDING && (
                <button
                  onClick={() => updateStatus(order.id!, OrderStatus.PREPARING)}
                  className="col-span-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
                >
                  開始製作
                </button>
              )}
              {order.status === OrderStatus.PREPARING && (
                <button
                  onClick={() => updateStatus(order.id!, OrderStatus.COMPLETED)}
                  className="col-span-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
                >
                  完成訂單
                </button>
              )}
              
              <button
                 onClick={() => updateStatus(order.id!, OrderStatus.CANCELLED)}
                 className="w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium py-1 px-2 rounded text-xs transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deleteOrder(order.id!)}
                className="w-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 font-medium py-1 px-2 rounded text-xs transition-colors"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
        
        {orders.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            目前沒有訂單
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;