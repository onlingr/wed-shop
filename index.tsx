import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* 改用 BrowserRouter 以獲得乾淨的網址 (需要伺服器 Rewrite 支援，如 Vercel) */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);