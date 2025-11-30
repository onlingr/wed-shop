import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 使用 Vite 的環境變數 (Vercel 部署時的最佳實踐)
// 如果環境變數未設定，則使用字串中的預設值 (開發時方便)
// 為了解決 TypeScript 錯誤 "Property 'env' does not exist on type 'ImportMeta'"，將 import.meta 轉型為 any
const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: "AIzaSyCFE2djuA7G8zkHGgn7zkTjU1ASmSLM-7s",
  authDomain: "online-ordering-system-1.firebaseapp.com",
  projectId: "online-ordering-system-1",
  storageBucket: "online-ordering-system-1.firebasestorage.app",
  messagingSenderId: "864822287644",
  appId: "1:864822287644:web:da8743699e96c5c86beed9",
  measurementId: "G-PJP63TFBNP"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出 Auth 和 Firestore 實例供全域使用
export const auth = getAuth(app);
export const db = getFirestore(app);