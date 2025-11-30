import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* 使用 HashRouter 以確保在無後端配置的靜態伺服器上也能運作 */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
