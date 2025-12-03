import * as firebaseApp from "firebase/app";
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
// 使用 getApps 防止重複初始化 (React Strict Mode 或 Hot Reload 可能導致重複執行)
// 使用 namespace import 解決 initializeApp 可能無法解析的問題
const app = firebaseApp.getApps().length === 0 ? firebaseApp.initializeApp(firebaseConfig) : firebaseApp.getApps()[0];

// 匯出 Auth 和 Firestore 實例供全域使用
export const auth = getAuth(app);
export const db = getFirestore(app);