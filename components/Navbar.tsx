import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useCart } from '../contexts/CartContext';

const Navbar: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { totalItems, openCheckout } = useCart(); // 從 Context 取得控制函式

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
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
      navigate('/');
      openCheckout();
    } else {
      // 若購物車是空的，只導向首頁
      navigate('/');
    }
  };

  return (
    <nav className="bg-brand-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold tracking-wider">
              美味點餐
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="hover:bg-brand-700 px-3 py-2 rounded-md text-sm font-medium">
              點餐首頁
            </Link>
            
            {/* 購物車圖示 - 僅在未登入或一般頁面顯示 */}
            {!user && (
               <div className="relative group cursor-pointer">
                 <a href="#" onClick={handleCartClick} className="p-2 block">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {totalItems > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {totalItems}
                      </span>
                    )}
                 </a>
               </div>
            )}

            {user ? (
              <>
                <Link to="/admin" className="hover:bg-brand-700 px-3 py-2 rounded-md text-sm font-medium">
                  管理後台
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-brand-700 hover:bg-brand-800 px-3 py-2 rounded-md text-sm font-medium"
                >
                  登出
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:bg-brand-700 px-3 py-2 rounded-md text-sm font-medium">
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