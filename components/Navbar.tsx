import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';

const Navbar: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

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

  return (
    <nav className="bg-brand-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold tracking-wider">
              美味點餐
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link to="/" className="hover:bg-brand-700 px-3 py-2 rounded-md text-sm font-medium">
              點餐首頁
            </Link>
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
