import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 安全地取得環境變數
// 某些預覽環境可能不完全支援 import.meta，使用 try-catch 防止崩潰
const getEnv = () => {
  try {
    return (import.meta as any).env || {};
  } catch (e) {
    console.warn("無法讀取環境變數，將使用預設值");
    return {};
  }
};

const env = getEnv();

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 匯出 Auth 和 Firestore 實例供全域使用
export const auth = getAuth(app);
export const db = getFirestore(app);