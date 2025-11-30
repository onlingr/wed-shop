import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// 安全防護 Layer 2: 身分驗證路由保護
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 監聽 Firebase Auth 狀態變化
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Loading />;
  }

  // 如果使用者未登入，強制導向登入頁面
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 如果已登入，渲染受保護的內容 (Admin Dashboard)
  return <>{children}</>;
};

export default ProtectedRoute;
