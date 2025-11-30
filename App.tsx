import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';

// 安全防護 Layer 3: Code Splitting (程式碼拆分)
// 使用 React.lazy 動態載入 AdminDashboard
// 這樣一般使用者在瀏覽 Home 時，瀏覽器不會下載管理後台的程式碼，減少 JS 體積並增加安全性
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        {/* Suspense 用於處理 Lazy Component 載入中的狀態 */}
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* 公開路由：首頁與登入 */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* 受保護路由：管理後台 */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default App;
