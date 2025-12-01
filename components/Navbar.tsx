import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../contexts/CartContext';

const Navbar: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation(); // 取得當前路徑
  const { totalItems, openCheckout } = useCart();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if(!window.confirm("確定要登出嗎？")) return;
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("登出失敗", error);
    }
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (totalItems > 0) {
      // 確保在首頁開啟結帳
      if (location.pathname !== '/') {
        navigate('/');
        // 稍微延遲以確保頁面跳轉後開啟 Modal
        setTimeout(() => openCheckout(), 100);
      } else {
        openCheckout();
      }
    } else {
      navigate('/');
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <nav className="bg-brand-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* 左側：品牌名稱 */}
          <div className="flex items-center">
            <Link to="/" className="text-xl md:text-2xl font-black tracking-wider hover:opacity-90 transition-opacity">
              雞排本色-竹東店
            </Link>
          </div>

          {/* 右側：功能按鈕區 */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {/* 購物車圖示 */}
            {/* 顯示條件：未登入 OR (已登入且在首頁 - POS模式) */}
            {(!user || (user && isHomePage)) && (
               <div className="relative group cursor-pointer mr-1">
                 <a href="#" onClick={handleCartClick} className="p-2 block hover:bg-brand-700 rounded-full transition-colors relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full border-2 border-brand-600">
                        {totalItems}
                      </span>
                    )}
                 </a>
               </div>
            )}

            {/* 管理員功能區 */}
            {user ? (
              <div className="flex items-center gap-2">
                {isHomePage ? (
                  // 在首頁時 -> 顯示「進入後台」
                  <Link 
                    to="/admin" 
                    className="bg-brand-700 hover:bg-brand-800 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="hidden md:inline">進入後台</span>
                    <span className="md:hidden">後台</span>
                  </Link>
                ) : (
                  // 在後台時 -> 顯示「點餐模式」
                  <Link 
                    to="/" 
                    className="bg-white text-brand-600 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-bold shadow-sm transition-all flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="hidden md:inline">點餐模式</span>
                    <span className="md:hidden">點餐</span>
                  </Link>
                )}

                {/* 登出按鈕 (簡化為圖示) */}
                <button
                  onClick={handleLogout}
                  className="bg-brand-800/50 hover:bg-brand-800 p-2 rounded-lg text-white/80 hover:text-white transition-colors ml-1"
                  title="登出"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              // 未登入 -> 顯示店長登入
              <Link to="/login" className="hover:bg-brand-700 px-3 py-2 rounded-md text-sm font-bold">
                店長登入
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;