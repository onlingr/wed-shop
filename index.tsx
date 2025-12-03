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
    {/* 改回 HashRouter 以確保在預覽環境與靜態主機(如 GitHub Pages)能正常運作 */}
    {/* 若之後確定部署環境(如 Vercel)支援 Rewrite，可再改回 BrowserRouter */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);