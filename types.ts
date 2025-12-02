
// 定義菜單項目介面
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description?: string; // 新增：商品說明
  isAvailable?: boolean; // 是否上架中
}

// 定義購物車項目介面
export interface CartItem extends MenuItem {
  quantity: number;
}

// 定義訂單狀態列舉
export enum OrderStatus {
  PENDING = 'pending',     // 待處理
  PREPARING = 'preparing', // 製作中
  COMPLETED = 'completed', // 已完成 (可取餐)
  SERVED = 'served',       // 已送餐 (結案)
  CANCELLED = 'cancelled'  // 已取消
}

// 定義 Firestore 中的訂單結構
export interface Order {
  id?: string;
  orderNumber?: number; // 每日流水號 (例如: 1, 2, 3...)
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: any; // Firestore Timestamp
  
  // 新增顧客資訊欄位
  customerName: string;  // 顧客姓名 (必填)
  customerPhone: string; // 顧客電話 (必填)
  customerNote?: string; // 備註 (選填)
}

// 公告設定
export interface BannerSettings {
  enabled: boolean;
  content: string;
}

// 商店全域設定
export interface Settings {
  isOpen: boolean; // 是否營業中
  storeName?: string;
  banner?: BannerSettings; // 首頁公告
}