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
