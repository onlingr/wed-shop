import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';
import { CartProvider } from './contexts/CartContext';

// 安全防護 Layer 3: Code Splitting (程式碼拆分)
// 使用 React.lazy 動態載入 AdminDashboard
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

const App: React.FC = () => {
  return (
    // 使用 CartProvider 包覆，讓 Navbar 與 Pages 都能存取購物車
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
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
    </CartProvider>
  );
};

export default App;