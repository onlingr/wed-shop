// 定義菜單項目介面
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

// 定義購物車項目介面
export interface CartItem extends MenuItem {
  quantity: number;
}

// 定義訂單狀態列舉
export enum OrderStatus {
  PENDING = 'pending',     // 待處理
  PREPARING = 'preparing', // 製作中
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled'  // 已取消
}

// 定義 Firestore 中的訂單結構
export interface Order {
  id?: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: any; // Firestore Timestamp
  customerNote?: string;
}
