import React from 'react';

// 首頁商品骨架屏
export const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-row md:flex-col h-28 md:h-auto animate-pulse">
      {/* 圖片區塊 */}
      <div className="w-28 md:w-full h-full md:h-48 bg-gray-200 shrink-0"></div>
      
      {/* 內容區塊 */}
      <div className="p-2 md:p-4 flex-1 flex flex-col justify-between">
         <div className="space-y-2">
            <div className="flex justify-between items-start gap-2">
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                <div className="h-5 bg-gray-200 rounded w-10"></div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
         </div>
         <div className="mt-1 md:mt-3 h-8 md:h-9 bg-gray-200 rounded-lg w-full"></div>
      </div>
    </div>
  );
};

// 後台訂單骨架屏 (票據樣式)
export const OrderSkeleton: React.FC = () => {
   return (
     <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-pulse h-[280px]">
        {/* Header */}
        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center h-12">
           <div className="flex items-center gap-2 w-1/2">
                <div className="h-6 bg-gray-200 rounded w-12"></div>
                <div className="h-5 bg-gray-200 rounded-full w-16"></div>
           </div>
           <div className="h-4 bg-gray-200 rounded w-10"></div>
        </div>

        {/* Content */}
        <div className="p-3 flex-grow space-y-4">
           {/* 顧客資料 */}
           <div className="space-y-2 pb-2 border-b border-gray-100 border-dashed">
               <div className="h-4 bg-gray-200 rounded w-1/3"></div>
               <div className="h-4 bg-gray-200 rounded w-1/2"></div>
           </div>
           {/* 餐點清單 */}
           <div className="space-y-2">
               {[1, 2].map((i) => (
                   <div key={i} className="flex gap-2">
                       <div className="h-5 w-5 bg-gray-200 rounded"></div>
                       <div className="flex-1 h-5 bg-gray-200 rounded"></div>
                       <div className="h-5 w-8 bg-gray-200 rounded"></div>
                   </div>
               ))}
           </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-2 border-t border-gray-200">
             <div className="flex justify-between mb-2 px-1">
                 <div className="h-4 bg-gray-200 rounded w-10"></div>
                 <div className="h-6 bg-gray-200 rounded w-16"></div>
             </div>
             <div className="h-9 bg-gray-200 rounded w-full"></div>
        </div>
     </div>
   );
};

// 後台菜單列表骨架屏 (手機版卡片)
export const MenuSkeleton: React.FC = () => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4 animate-pulse">
            <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between">
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-5 bg-gray-200 rounded w-10"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mt-2"></div>
                </div>
                <div className="flex justify-between items-end mt-2">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="flex gap-2">
                         <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                         <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}