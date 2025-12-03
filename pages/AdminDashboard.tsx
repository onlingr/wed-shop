import React, { useEffect, useState, useMemo, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc, writeBatch, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Order, OrderStatus, MenuItem } from '../types';
import { MENU_ITEMS } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { OrderSkeleton, MenuSkeleton } from '../components/Skeletons';

const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAABAFRYWFQAAAASAAADbWFqb3JfYnJhbmQAZGFzaABUWFhUAAAAEQAAA21pbm9yX3ZlcnNpb24AMABUWFhUAAAAHAAAA2NvbXBhdGlibZVfYnJhbmRzAGlzbzZtcDQxAFRTU0UAAAAOAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//uQZAAAAAAAALAAAADXAAAAMAAAAA1wAAAzJ4AAAAAFT/4zAAABdwAAAGwAAAAAAAAA0TGRlbABpbmZvAAAADwAAABIAAACFAAAhISEhMTExMTFhYWVhYWZmZmZxcXFxcnJycnt7e3t7hISEhISEjIyMjJSUlJScnJycnKSkpKSktLS0tLy8vLzExMTExNTU1NTU3Nzc3OTk5OTl7e3t7e3//////////////////////////////////////////////////////////////////wAAAAAATGF2YzU5LjM3AAAAAAAAAAAAAAAAJAVAAAAAAAAAAhUjIu9ZAAAAAAAAAAAAAAAA//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////uQZAAABiE3U/0kAAJupvp/pIAAFUzdU+w8AAKjm6p9h4AAAASAAIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABiU3U/08AAKmm6p9h4AAWQN1T7DwaQqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABi03U/08AAKnm6p9h4AAWNN1T7Dwaxqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABi03U/08AAKnm6p9h4AAWNN1T7Dwaxqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABiU3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABi03U/08AAKnm6p9h4AAWNN1T7Dwaxqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//uQZAAABjE3U/08AAKnm6p9h4AAWQN1T7Dwawqebqn2Hgqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';

type Tab = 'orders' | 'menu' | 'settings';
type OrderFilterType = 'all' | 'pending' | 'preparing' | 'completed' | 'history';

const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  
  // Orders State (Active / Real-time)
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState<OrderFilterType>('pending');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // History Orders State (Search)
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  // Default to today
  const todayStr = new Date().toISOString().split('T')[0];
  const [searchDateStart, setSearchDateStart] = useState(todayStr);
  const [searchDateEnd, setSearchDateEnd] = useState(todayStr);
  const [hasSearched, setHasSearched] = useState(false);

  // Audio Notification State
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevPendingCountRef = useRef(0);

  // Menu State
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('全部');
  const [useImage, setUseImage] = useState(true);

  // Settings State
  const [storeOpen, setStoreOpen] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [bannerSettings, setBannerSettings] = useState({
    enabled: false,
    content: ''
  });

  // Initialize Audio Object
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND);
  }, []);

  // --- Real-time Orders (Active Only) ---
  // 優化：只監聽「未完成」的訂單，減少讀取量
  useEffect(() => {
    setOrdersLoading(true);
    // 查詢非歷史訂單 (新訂單、製作中、可取餐)
    const q = query(
        collection(db, "orders"), 
        where("status", "in", [OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.COMPLETED]),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setActiveOrders(newOrders);
      setOrdersLoading(false);
    }, (error) => {
      // 處理索引錯誤：如果因為複合查詢導致錯誤，則退回到查詢所有訂單 (相容性)
      console.error("讀取訂單失敗 (可能缺索引):", error);
      // Fallback: 讀取所有並前端過濾
      const fallbackQ = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const fallbackUnsubscribe = onSnapshot(fallbackQ, (snap) => {
         const allOrders = snap.docs.map(d => ({id: d.id, ...d.data()} as Order));
         // Filter active ones
         setActiveOrders(allOrders.filter(o => 
             o.status === OrderStatus.PENDING || 
             o.status === OrderStatus.PREPARING || 
             o.status === OrderStatus.COMPLETED
         ));
         setOrdersLoading(false);
      });
      return () => fallbackUnsubscribe();
    });
    
    return () => unsubscribe();
  }, [showToast]); 

  // --- Computed Values ---
  const counts = useMemo(() => {
    return {
      all: activeOrders.length,
      pending: activeOrders.filter(o => o.status === OrderStatus.PENDING).length,
      preparing: activeOrders.filter(o => o.status === OrderStatus.PREPARING).length,
      completed: activeOrders.filter(o => o.status === OrderStatus.COMPLETED).length,
      history: historyOrders.length // Display count of fetched history
    };
  }, [activeOrders, historyOrders]);

  // 計算歷史搜尋結果中的已結案總金額
  const historyRevenue = useMemo(() => {
    return historyOrders
        .filter(o => o.status === OrderStatus.SERVED)
        .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [historyOrders]);

  const pendingCount = counts.pending;

  // --- Notification Logic ---
  useEffect(() => {
    if (pendingCount > prevPendingCountRef.current) {
        const diff = pendingCount - prevPendingCountRef.current;
        showToast(`🔔 收到 ${diff} 筆新訂單！`, 'info');
        if (isSoundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.error("音效播放失敗", e));
        }
    }
    prevPendingCountRef.current = pendingCount;
  }, [pendingCount, isSoundEnabled, showToast]);

  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
    if (!isSoundEnabled && audioRef.current) {
        audioRef.current.play().catch(() => {}).then(() => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        });
        showToast("🔔 音效通知已啟用", "success");
    } else {
        showToast("🔕 音效通知已關閉", "info");
    }
  };

  // --- History Search Logic ---
  const handleSearchHistory = async () => {
      if (!searchDateStart || !searchDateEnd) {
          showToast("請選擇開始與結束日期", "info");
          return;
      }
      
      setIsHistoryLoading(true);
      setHistoryOrders([]);
      setHasSearched(true);

      try {
          // 設定日期範圍 (00:00:00 ~ 23:59:59)
          const start = new Date(searchDateStart);
          start.setHours(0, 0, 0, 0);
          
          const end = new Date(searchDateEnd);
          end.setHours(23, 59, 59, 999);

          // 查詢 Firestore (依日期範圍)
          // 註：這需要 createdAt 索引，但單純的範圍查詢通常不需要複合索引
          const q = query(
              collection(db, "orders"),
              where("createdAt", ">=", Timestamp.fromDate(start)),
              where("createdAt", "<=", Timestamp.fromDate(end)),
              orderBy("createdAt", "desc")
          );

          const querySnapshot = await getDocs(q);
          const results = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
          } as Order));

          // 前端過濾：只顯示「已送餐」或「已取消」
          // (這樣可以避免在 Firestore 建立複雜的複合索引)
          const filteredHistory = results.filter(o => 
              o.status === OrderStatus.SERVED || 
              o.status === OrderStatus.CANCELLED
          );

          setHistoryOrders(filteredHistory);
          
          if (filteredHistory.length === 0) {
              showToast("此日期區間無歷史紀錄", "info");
          } else {
              showToast(`找到 ${filteredHistory.length} 筆歷史紀錄`, "success");
          }

      } catch (error) {
          console.error("搜尋歷史失敗:", error);
          showToast("搜尋失敗，請檢查網路或索引設定", "error");
      } finally {
          setIsHistoryLoading(false);
      }
  };

  // --- Display Logic ---
  // 根據當前 Filter 決定要顯示「活躍訂單」還是「歷史搜尋結果」
  const displayedOrders = useMemo(() => {
    if (orderFilter === 'history') {
        return historyOrders;
    }
    
    // 活躍訂單過濾
    return activeOrders.filter(order => {
      if (orderFilter === 'all') return true; // 這裡的 All 指的是所有「活躍」訂單
      if (orderFilter === 'pending') return order.status === OrderStatus.PENDING;
      if (orderFilter === 'preparing') return order.status === OrderStatus.PREPARING;
      if (orderFilter === 'completed') return order.status === OrderStatus.COMPLETED;
      return true;
    });
  }, [activeOrders, historyOrders, orderFilter]);

  useEffect(() => {
    const originalTitle = document.title;
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) 雞排本色-竹東店 - 管理後台`;
    } else {
      document.title = '雞排本色-竹東店 - 管理後台';
    }
    return () => { document.title = '雞排本色-竹東店 - 遠端點餐系統'; };
  }, [pendingCount]);

  // --- Real-time Products ---
  useEffect(() => {
    if (activeTab !== 'menu') return;

    setMenuLoading(true);
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as MenuItem));
      items.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      setProducts(items);
      setMenuLoading(false);
    }, (error) => {
      console.error("讀取商品失敗:", error);
      showToast("讀取商品失敗", "error");
      setMenuLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab, showToast]);

  const menuCategories = useMemo(() => {
    const unique = Array.from(new Set(products.map(p => p.category)));
    return ['全部', ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => selectedMenuCategory === '全部' || p.category === selectedMenuCategory);
  }, [products, selectedMenuCategory]);

  // --- Real-time Settings ---
  useEffect(() => {
    if (activeTab !== 'settings') return;
    
    setSettingsLoading(true);
    const unsubscribeStore = onSnapshot(doc(db, "settings", "store"), (docSnap) => {
      if (docSnap.exists()) {
        setStoreOpen(docSnap.data().isOpen !== false);
      } else {
        setStoreOpen(true);
      }
    });

    const unsubscribeBanner = onSnapshot(doc(db, "settings", "banner"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBannerSettings({
          enabled: data.enabled ?? false,
          content: data.content ?? ''
        });
      }
    });

    setSettingsLoading(false);
    return () => {
      unsubscribeStore();
      unsubscribeBanner();
    };
  }, [activeTab]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      showToast(`訂單狀態已更新`, "success");
      // 注意：如果狀態變為 SERVED/CANCELLED，它會從 activeOrders 消失
    } catch (e) { 
        showToast("更新失敗", "error"); 
    }
  };
  const deleteOrder = async (orderId: string) => {
    if(!window.confirm("確定刪除?")) return;
    try { 
        await deleteDoc(doc(db, "orders", orderId)); 
        showToast("訂單已刪除", "info");
        // 更新 historyOrders (如果是在歷史頁面刪除)
        setHistoryOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (e) { 
        console.error(e); 
        showToast("刪除失敗", "error");
    }
  };

  const toggleProductAvailability = async (product: MenuItem) => {
    try {
      await updateDoc(doc(db, "products", product.id), {
        isAvailable: !product.isAvailable
      });
      showToast(product.isAvailable ? "商品已下架" : "商品已上架", "info");
    } catch (e) { showToast("更新失敗", "error"); }
  };

  const handleDeleteProduct = async (id: string) => {
    if(!window.confirm("確定刪除此商品?")) return;
    try { 
        await deleteDoc(doc(db, "products", id));
        showToast("商品已刪除", "success");
    } catch(e) { showToast("刪除失敗", "error"); }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const productData = {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        category: editingProduct.category,
        image: useImage ? editingProduct.image : '',
        description: editingProduct.description || '',
        isAvailable: editingProduct.isAvailable ?? true
      };

      if (editingProduct.id) {
        await updateDoc(doc(db, "products", editingProduct.id), productData);
        showToast("商品更新成功", "success");
      } else {
        await addDoc(collection(db, "products"), productData);
        showToast("商品新增成功", "success");
      }
      setIsModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      showToast("儲存失敗", "error");
    }
  };

  const toggleStoreStatus = async () => {
    try {
      await setDoc(doc(db, "settings", "store"), { isOpen: !storeOpen }, { merge: true });
      showToast(storeOpen ? "商店已設為休息中" : "商店已設為營業中", storeOpen ? "info" : "success");
    } catch(e) { showToast("設定失敗", "error"); }
  };
  
  const saveBannerSettings = async () => {
    try {
      await setDoc(doc(db, "settings", "banner"), bannerSettings, { merge: true });
      showToast("公告設定已儲存", "success");
    } catch(e) { showToast("儲存失敗", "error"); }
  };

  const importDefaultMenu = async () => {
    if (!window.confirm("這將會把預設菜單資料寫入資料庫，確定執行？")) return;
    try {
      for (const item of MENU_ITEMS) {
        await addDoc(collection(db, "products"), {
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            description: '',
            isAvailable: true
        });
      }
      showToast("匯入成功！請至「菜單管理」查看。", "success");
    } catch (e) {
      console.error(e);
      showToast("匯入失敗", "error");
    }
  };
  
  const clearHistoryOrders = async () => {
    // 這裡清除的是資料庫中所有的歷史訂單，與當前搜尋無關
    // 為了安全，我們還是需要執行查詢來確定有哪些要刪
    // 這裡只簡單實作：清除「所有」已結案/已取消 (不論日期)
    // 但這需要全表掃描，成本高。
    // 建議：只清除「當前搜尋結果」中的訂單？
    // 使用者需求是「清除所有歷史訂單」。
    
    if (!window.confirm(`即將永久刪除「所有」歷史訂單 (已結案/已取消)。\n此動作無法復原，確定要執行嗎？`)) {
      return;
    }
    const confirmCode = window.prompt("為了確認您的操作，請輸入 'clear' 以執行刪除：");
    if (confirmCode !== 'clear') {
      showToast("驗證碼錯誤，已取消操作。", "error");
      return;
    }
    
    try {
      // 這裡需要查詢所有歷史訂單 (可能需要分批)
      // 簡單起見，我們只查詢最近 500 筆歷史來刪除，避免超時
      const q = query(
          collection(db, "orders"), 
          where("status", "in", [OrderStatus.SERVED, OrderStatus.CANCELLED]),
          orderBy("createdAt", "desc")
          // limit(500) // Optional
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
          showToast("沒有可刪除的歷史訂單", "info");
          return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
      });
      await batch.commit();
      
      showToast(`已清除 ${snapshot.size} 筆歷史訂單`, "success");
      setHistoryOrders([]); // 清空當前顯示
    } catch (e) {
      console.error("清除失敗:", e);
      showToast("清除失敗 (可能需要索引或資料量過大)", "error");
    }
  };

  const handleClearAllOrders = async () => {
    if (activeOrders.length === 0 && historyOrders.length === 0) {
      showToast("目前列表中沒有訂單。", "info");
      return;
    }
    if (!window.confirm(`【危險警告】\n您即將刪除資料庫中的訂單。\n這通常用於測試後清空資料，或每日結算後的歸零。`)) {
        return;
    }
    
    const confirmCode = window.prompt("請輸入 'delete' 以確認刪除操作：");
    if (confirmCode !== 'delete') {
        showToast("驗證碼錯誤，取消操作。", "error");
        return;
    }

    try {
        const batch = writeBatch(db);
        // 清除活躍訂單
        activeOrders.forEach(order => {
            if (order.id) batch.delete(doc(db, 'orders', order.id));
        });
        // 清除當前顯示的歷史訂單
        historyOrders.forEach(order => {
            if (order.id) batch.delete(doc(db, 'orders', order.id));
        });
        
        await batch.commit();
        showToast("訂單已清空！", "success");
        // 本地狀態會因 onSnapshot 自動更新 activeOrders，但 history 需要手動清
        setHistoryOrders([]);
    } catch (error) {
        console.error("清空訂單失敗:", error);
        showToast("清空失敗，請檢查網路連線。", "error");
    }
  };

  const getStatusConfig = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return {
          label: '新訂單',
          color: 'bg-red-500 text-white',
          text: 'text-red-600',
          bg: 'bg-red-50',
          borderColor: 'border-red-500',
          borderLeft: 'border-l-red-500',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )
        };
      case OrderStatus.PREPARING:
        return {
          label: '製作中',
          color: 'bg-blue-500 text-white',
          text: 'text-blue-600',
          bg: 'bg-blue-50',
          borderColor: 'border-blue-400',
          borderLeft: 'border-l-blue-500',
          icon: (
             <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
            </svg>
          )
        };
      case OrderStatus.COMPLETED:
        return {
          label: '可取餐',
          color: 'bg-green-500 text-white',
          text: 'text-green-600',
          bg: 'bg-green-50',
          borderColor: 'border-green-400',
          borderLeft: 'border-l-green-500',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case OrderStatus.SERVED:
        return {
          label: '已送餐',
          color: 'bg-gray-500 text-white',
          text: 'text-gray-600',
          bg: 'bg-gray-50',
          borderColor: 'border-gray-200',
          borderLeft: 'border-l-gray-400',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )
        };
      case OrderStatus.CANCELLED:
        return {
          label: '已取消',
          color: 'bg-gray-400 text-white',
          text: 'text-gray-500',
          bg: 'bg-gray-50',
          borderColor: 'border-gray-200',
          borderLeft: 'border-l-gray-400',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      default:
        return { label: '未知', color: 'bg-gray-400 text-white', text: 'text-gray-500', bg: 'bg-gray-50', borderColor: 'border-gray-200', borderLeft: 'border-l-gray-300', icon: null };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      
      {/* Top Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('orders')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'orders' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            訂單管理
            {pendingCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`${activeTab === 'menu' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            菜單管理
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`${activeTab === 'settings' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            商店設定
          </button>
        </nav>
      </div>

      {/* --- TAB: ORDERS --- */}
      {activeTab === 'orders' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                即時訂單監控
                <button 
                    onClick={toggleSound}
                    className={`text-sm px-2 py-1 rounded-md border flex items-center gap-1 transition-colors ${isSoundEnabled ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                    title={isSoundEnabled ? "點擊關閉音效" : "點擊開啟新訂單通知音效"}
                >
                    {isSoundEnabled ? '🔔 音效已開' : '🔕 音效已關'}
                </button>
              </h1>
            </div>
            
            <div className="flex p-1 space-x-1 bg-gray-100 rounded-xl overflow-x-auto max-w-full">
              {[
                { id: 'all', label: '全部(活躍)', count: counts.all, color: 'text-gray-800' },
                { id: 'pending', label: '新訂單', count: counts.pending, color: 'text-red-600' },
                { id: 'preparing', label: '製作中', count: counts.preparing, color: 'text-blue-600' },
                { id: 'completed', label: '可取餐', count: counts.completed, color: 'text-green-600' },
                { id: 'history', label: '歷史查詢', count: counts.history, color: 'text-gray-600' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOrderFilter(tab.id as OrderFilterType)}
                  className={`
                    w-full sm:w-auto flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap
                    ${orderFilter === tab.id 
                      ? 'bg-white shadow text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'}
                  `}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-bold bg-white shadow-sm border ${tab.color.replace('text', 'border')} ${tab.color}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Picker for History */}
          {orderFilter === 'history' && (
            <>
             <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                 <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <label className="text-xs font-bold text-gray-500 uppercase">開始日期</label>
                    <input 
                        type="date" 
                        value={searchDateStart}
                        onChange={(e) => setSearchDateStart(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                    />
                 </div>
                 <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <label className="text-xs font-bold text-gray-500 uppercase">結束日期</label>
                    <input 
                        type="date" 
                        value={searchDateEnd}
                        onChange={(e) => setSearchDateEnd(e.target.value)}
                        className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
                    />
                 </div>
                 <button 
                    onClick={handleSearchHistory}
                    disabled={isHistoryLoading}
                    className="w-full sm:w-auto bg-brand-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm hover:bg-brand-700 disabled:opacity-50 transition-all"
                 >
                    {isHistoryLoading ? '搜尋中...' : '🔍 查詢歷史'}
                 </button>
             </div>
             {hasSearched && (
                 <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded-lg flex justify-between items-center shadow-sm">
                    <span className="text-green-800 font-bold">查詢範圍已結案總金額</span>
                    <span className="text-2xl font-bold text-green-700">${historyRevenue}</span>
                 </div>
             )}
            </>
          )}
          
          {(ordersLoading || isHistoryLoading) ? (
             /* 使用 OrderSkeleton 顯示載入狀態 */
             <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                 {[1,2,3,4,5,6].map(i => <OrderSkeleton key={i} />)}
             </div>
          ) : (
            <>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {displayedOrders.map((order) => {
                const isMenuOpen = menuOpenId === order.id;
                const statusConfig = getStatusConfig(order.status);
                
                return (
                  <div 
                    key={order.id} 
                    className={`
                      bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col transition-all duration-200 relative
                      border-l-4 ${statusConfig.borderLeft}
                      ${order.status === OrderStatus.PENDING ? 'ring-2 ring-red-100' : ''}
                    `}
                  >
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                             <span className="text-xl font-black text-gray-800 font-mono tracking-tight">
                                #{String(order.orderNumber || 0).padStart(3, '0')}
                             </span>
                             <div className={`px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] sm:text-xs font-bold ${statusConfig.color}`}>
                                {statusConfig.icon}
                                <span>{statusConfig.label}</span>
                             </div>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                           {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit', month: '2-digit', day: '2-digit' }) : '--:--'}
                        </span>
                    </div>

                    <div className="p-3 flex-grow flex flex-col gap-2">
                      <div className="flex flex-col gap-1 pb-2 border-b border-gray-100 border-dashed text-sm text-gray-600">
                         <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            <span className="font-bold text-gray-800">{order.customerName}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline font-mono tracking-wide">{order.customerPhone}</a>
                         </div>
                      </div>

                      <div className="space-y-2 flex-grow">
                        {order.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 text-sm">
                            <span className="font-bold text-gray-800 bg-gray-100 border border-gray-200 w-6 h-6 flex items-center justify-center rounded-md text-xs">
                                {item.quantity}
                            </span>
                            <div className="flex flex-col">
                                <span className="text-gray-800 font-medium leading-tight">{item.name}</span>
                            </div>
                            <span className="text-gray-400 text-xs font-mono pt-0.5">${item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {order.customerNote && (
                         <div className="mt-1 bg-yellow-50 text-yellow-800 text-xs p-2 rounded border border-yellow-100 flex items-start gap-2">
                            <span className="shrink-0 font-bold">備註:</span>
                            <span className="break-all">{order.customerNote}</span>
                         </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-2 border-t border-gray-200">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">總金額</span>
                            <span className="text-xl font-bold text-red-600">${order.totalAmount}</span>
                        </div>

                        <div>
                        {isMenuOpen ? (
                            <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.SERVED && (
                                    <button onClick={() => { if(window.confirm('確定取消?')) { updateOrderStatus(order.id!, OrderStatus.CANCELLED); setMenuOpenId(null); } }} className="col-span-1 bg-white text-orange-600 border border-orange-200 py-1.5 rounded font-bold text-sm hover:bg-orange-50">🚫 取消</button>
                                )}
                                <button onClick={() => { if(window.confirm('確定刪除?')) { deleteOrder(order.id!); setMenuOpenId(null); } }} className={`${(order.status === OrderStatus.CANCELLED || order.status === OrderStatus.SERVED) ? 'col-span-2' : 'col-span-1'} bg-white text-red-600 border border-red-200 py-1.5 rounded font-bold text-sm hover:bg-red-50`}>🗑️ 刪除</button>
                                <button onClick={() => setMenuOpenId(null)} className="col-span-2 bg-gray-200 text-gray-600 py-1.5 rounded font-bold text-sm hover:bg-gray-300">↩️ 返回</button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    {order.status === OrderStatus.PENDING && (
                                        <button onClick={() => updateOrderStatus(order.id!, OrderStatus.PREPARING)} className="w-full bg-red-600 text-white font-bold py-2 rounded text-sm hover:bg-red-700 shadow-sm animate-pulse">🔥 接單</button>
                                    )}
                                    {order.status === OrderStatus.PREPARING && (
                                        <button onClick={() => updateOrderStatus(order.id!, OrderStatus.COMPLETED)} className="w-full bg-blue-600 text-white font-bold py-2 rounded text-sm hover:bg-blue-700 shadow-sm">✅ 製作完成</button>
                                    )}
                                    {order.status === OrderStatus.COMPLETED && (
                                        <button onClick={() => updateOrderStatus(order.id!, OrderStatus.SERVED)} className="w-full bg-green-600 text-white font-bold py-2 rounded text-sm hover:bg-green-700 shadow-sm">🎉 結案/已送餐</button>
                                    )}
                                    {(order.status === OrderStatus.SERVED || order.status === OrderStatus.CANCELLED) && (
                                        <div className="w-full py-2 text-center text-gray-400 text-xs font-bold border border-gray-200 rounded bg-white">
                                            {order.status === OrderStatus.SERVED ? '✅ 已結案' : '🚫 已取消'}
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setMenuOpenId(order.id!)} className="w-8 flex items-center justify-center bg-white border border-gray-300 text-gray-400 rounded hover:bg-gray-50 hover:text-gray-600">⚙️</button>
                            </div>
                        )}
                        </div>
                    </div>
                  </div>
                );
              })}
              
              {displayedOrders.length === 0 && (
                <div className="col-span-full py-16 flex flex-col items-center justify-center text-gray-400 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl">
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="font-medium text-lg">
                    {orderFilter === 'history' && !hasSearched ? '請選擇日期並點擊查詢' :
                     orderFilter === 'history' ? '查無資料' :
                     orderFilter === 'all' ? '目前沒有任何訂單' :
                     orderFilter === 'pending' ? '目前沒有新訂單' : 
                     orderFilter === 'preparing' ? '目前沒有製作中的餐點' :
                     '目前沒有待取餐的訂單'}
                  </p>
                </div>
              )}
            </div>

            {displayedOrders.length > 0 && orderFilter === 'all' && (
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <button 
                        onClick={handleClearAllOrders}
                        className="w-full sm:w-auto bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 px-4 py-2 rounded-lg text-sm transition-colors border border-transparent hover:border-red-200"
                    >
                        🗑️ 清除所有訂單 (危險操作)
                    </button>
                </div>
            )}
            </>
          )}
        </>
      )}

      {/* --- TAB: MENU MANAGEMENT --- */}
      {activeTab === 'menu' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">菜單品項管理</h1>
            <button 
              onClick={() => { 
                setEditingProduct({ id: '', name: '', price: 0, image: '', category: '', description: '', isAvailable: true }); 
                setUseImage(true); 
                setIsModalOpen(true); 
              }}
              className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 shadow-sm"
            >
              + 新增商品
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-2 hide-scrollbar">
            {menuCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedMenuCategory(category)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                  ${selectedMenuCategory === category 
                    ? 'bg-brand-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'}
                `}
              >
                {category}
              </button>
            ))}
          </div>

          {menuLoading ? (
            /* 骨架屏載入效果 */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {[1,2,3,4].map(i => <MenuSkeleton key={i} />)}
            </div>
          ) : (
            <>
              {/* Mobile View: Cards (Visible on small screens) */}
              <div className="block sm:hidden space-y-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex gap-4">
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                       {product.image ? (
                          <img className="w-full h-full object-cover" src={product.image} alt={product.name} />
                       ) : (
                          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                       )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                           <h3 className="text-lg font-bold text-gray-900 truncate">{product.name}</h3>
                           <span className="text-red-600 font-bold">${product.price}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{product.category}</p>
                      </div>
                      
                      <div className="flex justify-between items-end mt-3">
                         <button 
                           onClick={() => toggleProductAvailability(product)}
                           className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${product.isAvailable !== false ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                         >
                           {product.isAvailable !== false ? '上架中' : '已下架'}
                         </button>
                         <div className="flex gap-3">
                            <button onClick={() => { setEditingProduct(product); setUseImage(!!product.image); setIsModalOpen(true); }} className="p-1 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="p-1 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredProducts.length === 0 && (
                   <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      {products.length === 0 ? "目前沒有商品，請點擊上方按鈕新增。" : "此分類下沒有商品。"}
                   </div>
                )}
              </div>

              {/* Desktop View: Table (Hidden on small screens) */}
              <div className="hidden sm:block bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">商品</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分類</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                              {product.image ? (
                                <img className="h-10 w-10 object-cover" src={product.image} alt="" />
                              ) : (
                                <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              {product.description && <div className="text-xs text-gray-500 max-w-[200px] truncate">{product.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <button 
                             onClick={() => toggleProductAvailability(product)}
                             className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors ${product.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                           >
                             {product.isAvailable !== false ? '上架中' : '已下架'}
                           </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button onClick={() => { setEditingProduct(product); setUseImage(!!product.image); setIsModalOpen(true); }} className="text-brand-600 hover:text-brand-900">編輯</button>
                          <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900">刪除</button>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">{products.length === 0 ? "目前沒有商品，請新增或從設定匯入。" : "此分類下沒有商品。"}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* --- TAB: SETTINGS --- */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl">
           <h1 className="text-2xl font-bold text-gray-900 mb-6">商店設定</h1>
           
           <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
             
             {/* 營業狀態切換 */}
             <div className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <h3 className="text-lg font-medium text-gray-900">營業狀態</h3>
                   <p className="mt-1 text-sm text-gray-500">
                     目前狀態: <span className={storeOpen ? "text-green-600 font-bold" : "text-red-600 font-bold"}>{storeOpen ? "營業中" : "休息中"}</span>
                   </p>
                   <p className="text-xs text-gray-400 mt-1">關閉時，顧客將無法送出新訂單。</p>
                 </div>
                 <button
                   onClick={toggleStoreStatus}
                   className={`
                     relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500
                     ${storeOpen ? 'bg-green-500' : 'bg-gray-200'}
                   `}
                 >
                   <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${storeOpen ? 'translate-x-5' : 'translate-x-0'}`} />
                 </button>
               </div>
             </div>

             {/* 首頁廣告/公告設定 */}
             <div className="p-6">
               <h3 className="text-lg font-medium text-gray-900 mb-4">首頁公告設定</h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-gray-700">啟用首頁公告欄</span>
                     <button
                        onClick={() => setBannerSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`
                        relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500
                        ${bannerSettings.enabled ? 'bg-brand-600' : 'bg-gray-200'}
                        `}
                     >
                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${bannerSettings.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                     </button>
                  </div>
                  {bannerSettings.enabled && (
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">公告內容</label>
                        <textarea
                           value={bannerSettings.content}
                           onChange={(e) => setBannerSettings(prev => ({ ...prev, content: e.target.value }))}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                           placeholder="例如：今日雞排買一送一！"
                           rows={3}
                        />
                     </div>
                  )}
                  <div className="flex justify-end">
                     <button
                        onClick={saveBannerSettings}
                        className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors"
                     >
                        儲存公告設定
                     </button>
                  </div>
               </div>
             </div>

             {/* 資料匯入 */}
             <div className="p-6">
               <h3 className="text-lg font-medium text-gray-900">資料管理</h3>
               <div className="mt-4">
                 <button
                   onClick={importDefaultMenu}
                   className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                 >
                   匯入預設菜單資料
                 </button>
                 <p className="mt-2 text-xs text-gray-500">
                   若您的資料庫是空的，可點擊此按鈕寫入範例資料 (牛肉麵、珍奶等)。
                 </p>
               </div>
             </div>

             {/* 危險專區: 清除歷史訂單 */}
             <div className="p-6 bg-red-50 border-t border-red-100 rounded-b-lg">
                <h3 className="text-lg font-bold text-red-800">危險專區</h3>
                <p className="text-sm text-red-600 mt-1 mb-4">
                    此處的操作將永久刪除資料，請謹慎使用。
                </p>
                
                <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-red-200">
                    <div>
                        <h4 className="font-bold text-gray-800">清除歷史訂單</h4>
                        <p className="text-xs text-gray-500">
                            將刪除所有狀態為「已送餐」或「已取消」的訂單。
                        </p>
                    </div>
                    <button
                        onClick={clearHistoryOrders}
                        className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors"
                    >
                        清除歷史資料
                    </button>
                </div>
             </div>

           </div>
        </div>
      )}

      {/* --- Modal for Add/Edit Product (Redesigned) --- */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 animate-scale-up overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">
              {editingProduct.id ? '編輯商品' : '新增商品'}
            </h3>
            
            <form onSubmit={handleSaveProduct} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">商品名稱 <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      value={editingProduct.name} 
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                      placeholder="例如：紅燒牛肉麵"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">價格 <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input 
                              type="number" 
                              required 
                              min="0"
                              value={editingProduct.price} 
                              onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} 
                              className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">分類 <span className="text-red-500">*</span></label>
                        <input 
                          type="text" 
                          required 
                          value={editingProduct.category} 
                          onChange={e => setEditingProduct({...editingProduct, category: e.target.value})} 
                          list="categories" 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                          placeholder="例如：主食"
                        />
                        <datalist id="categories">
                           <option value="主食" />
                           <option value="飲品" />
                           <option value="小菜" />
                        </datalist>
                      </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <label className="block text-sm font-bold text-gray-700">商品圖片</label>
                    <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setUseImage(!useImage)}
                          className={`
                            relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500
                            ${useImage ? 'bg-brand-600' : 'bg-gray-200'}
                          `}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${useImage ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="ml-2 text-xs text-gray-500">{useImage ? '啟用' : '停用'}</span>
                    </div>
                  </div>

                  {useImage && (
                    <div className="animate-fade-in">
                        <label className="block text-sm font-bold text-gray-700 mb-1">圖片網址 <span className="text-red-500">*</span></label>
                        <input 
                            type="url" 
                            required={useImage} 
                            value={editingProduct.image} 
                            onChange={e => setEditingProduct({...editingProduct, image: e.target.value})} 
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                            placeholder="https://example.com/image.jpg"
                        />
                        <p className="text-xs text-gray-500 mt-1">請輸入公開的圖片連結 (建議比例 4:3)</p>
                    </div>
                  )}
                </div>

                {/* Right Column: Image Preview */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">圖片預覽</label>
                  {useImage ? (
                    <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group animate-fade-in">
                        {editingProduct.image ? (
                            <img 
                                src={editingProduct.image} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Invalid+Image'; }}
                            />
                        ) : (
                            <div className="text-gray-400 text-center p-4">
                                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm mt-2 block">輸入網址後自動預覽</span>
                            </div>
                        )}
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 animate-fade-in">
                        <div className="text-center">
                            <svg className="mx-auto h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            <span className="text-sm mt-1 block">未啟用圖片</span>
                        </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Section */}
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">商品說明 (選填)</label>
                  <textarea 
                      rows={3}
                      value={editingProduct.description || ''} 
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                      placeholder="介紹一下這道餐點的特色，或標註過敏原資訊..."
                  />
              </div>

              <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                 <input 
                  id="isAvailable" 
                  type="checkbox" 
                  checked={editingProduct.isAvailable !== false} 
                  onChange={e => setEditingProduct({...editingProduct, isAvailable: e.target.checked})} 
                  className="h-5 w-5 text-brand-600 focus:ring-brand-500 border-gray-300 rounded cursor-pointer" 
                 />
                 <div className="ml-3">
                   <label htmlFor="isAvailable" className="text-sm font-bold text-gray-900 cursor-pointer">立即上架販售</label>
                   <p className="text-xs text-gray-500">若取消勾選，此商品將不會顯示在前台菜單中。</p>
                 </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 shadow-md shadow-brand-200 transition-all active:scale-[0.98]"
                >
                  儲存變更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;