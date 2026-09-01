import React, { useState } from 'react';
import { AdminViewTab, AdminOrder, OrderStatus, PaymentStatus, AdminProduct, BakeryHubLocation, BlackoutDate, ArchivedItem } from './types';
import { DEFAULT_BAKERY_HUBS, productToAdminProduct, generateUniqueId, deduplicateById, getInitialProducts } from '../../data/bakeryStore';
import { ADMIN_BRAND_LOGO } from '../../data/bakeryData';
import { AdminLogin } from './AdminLogin';
import { AdminSidebar } from './AdminSidebar';
import { OverviewView } from './OverviewView';
import { LiveOrdersView } from './LiveOrdersView';
import { ProductsView } from './ProductsView';
import { CapacityView } from './CapacityView';
import { ArchiveView } from './ArchiveView';
import { SettingsView } from './SettingsView';
import { OrderDetailsView } from './OrderDetailsView';
import { ProductDetailsAdminView } from './ProductDetailsAdminView';
import { NotificationBubble } from './NotificationBubble';
import { AdminGlobalSearch } from './AdminGlobalSearch';
import { Menu, X, Bell, Shield, Store, Search, CalendarDays } from 'lucide-react';

interface AdminPortalProps {
  onReturnToStore: () => void;
  onViewProductLivePage?: (productName: string) => void;
  isAuthenticated?: boolean;
  onLoginSuccess?: (email: string) => void;
  onLogout?: () => void;
  adminUser?: string | null;
  orders?: AdminOrder[];
  onUpdateOrderStatus?: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: PaymentStatus) => void;
  onConfirmCashReceived?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  products?: AdminProduct[];
  onToggleStock?: (productId: string) => void;
  onSetProductStock?: (productId: string, inStock: boolean) => void;
  onAddProduct?: (newProduct: AdminProduct) => void;
  onUpdateProduct?: (updatedProduct: AdminProduct) => void;
  onDeleteProduct?: (productId: string) => void;
  archivedItems?: ArchivedItem[];
  onRecoverItem?: (item: ArchivedItem) => void;
  onPermanentDelete?: (itemId: string) => void;
  onBulkRecover?: (itemIds: string[]) => void;
  onBulkPermanentDelete?: (itemIds: string[]) => void;
  onEmptyArchive?: () => void;
  hubs?: BakeryHubLocation[];
  onAddHub?: (newHub: BakeryHubLocation) => void;
  onRemoveHub?: (id: string) => void;
  onToggleHubActive?: (id: string) => void;
  blackoutDates?: BlackoutDate[];
  onAddBlackoutDate?: (date: string, reason: string) => void;
  onRemoveBlackoutDate?: (id: string) => void;
  onRefreshProducts?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ 
  onReturnToStore, 
  onViewProductLivePage,
  isAuthenticated: propIsAuthenticated,
  onLoginSuccess: propOnLoginSuccess,
  onLogout: propOnLogout,
  adminUser: propAdminUser,
  orders: propOrders,
  onUpdateOrderStatus: propUpdateOrderStatus,
  onUpdatePaymentStatus: propUpdatePaymentStatus,
  onConfirmCashReceived: propConfirmCashReceived,
  onDeleteOrder: propDeleteOrder,
  products: propProducts,
  onToggleStock: propToggleStock,
  onSetProductStock: propSetProductStock,
  onAddProduct: propAddProduct,
  onUpdateProduct: propUpdateProduct,
  onDeleteProduct: propDeleteProduct,
  archivedItems: propArchivedItems,
  onRecoverItem: propRecoverItem,
  onPermanentDelete: propPermanentDelete,
  onBulkRecover: propBulkRecover,
  onBulkPermanentDelete: propBulkPermanentDelete,
  onEmptyArchive: propEmptyArchive,
  hubs: propHubs,
  onAddHub: propAddHub,
  onRemoveHub: propRemoveHub,
  onToggleHubActive: propToggleHubActive,
  blackoutDates: propBlackoutDates,
  onAddBlackoutDate: propAddBlackoutDate,
  onRemoveBlackoutDate: propRemoveBlackoutDate,
  onRefreshProducts,
}) => {
  // Authentication State: View 1 (Login) vs View 2 (Dashboard)
  const [internalIsAuthenticated, setInternalIsAuthenticated] = useState<boolean>(false);
  const [internalAdminUser, setInternalAdminUser] = useState<string | null>(null);

  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : internalIsAuthenticated;
  const adminUser = propAdminUser !== undefined ? propAdminUser : internalAdminUser;

  // Current Dashboard Tab
  const [currentTab, setCurrentTab] = useState<AdminViewTab>('overview');

  // Active Order Detail Page (separate full page view)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Active Product Detail Page (separate full page view)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Notification bubble state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Internal Fallback State for Orders, Products, Hubs, Blackouts, and Archives
  const [internalOrders, setInternalOrders] = useState<AdminOrder[]>([]);
  const [internalProducts, setInternalProducts] = useState<AdminProduct[]>(() => getInitialProducts().map(productToAdminProduct));
  const [internalHubs, setInternalHubs] = useState<BakeryHubLocation[]>(DEFAULT_BAKERY_HUBS);
  const [internalBlackoutDates, setInternalBlackoutDates] = useState<BlackoutDate[]>([]);
  const [internalArchivedItems, setInternalArchivedItems] = useState<ArchivedItem[]>([]);

  // Use props if provided, else internal state
  const orders = propOrders ?? internalOrders;
  const products = propProducts ?? internalProducts;
  const hubs = propHubs ?? internalHubs;
  const blackoutDates = propBlackoutDates ?? internalBlackoutDates;
  const archivedItems = propArchivedItems ?? internalArchivedItems;

  // Auth Handlers
  const handleLoginSuccess = (email: string) => {
    if (propOnLoginSuccess) {
      propOnLoginSuccess(email);
    } else {
      setInternalIsAuthenticated(true);
      setInternalAdminUser(email);
    }
  };

  const handleLogout = () => {
    if (propOnLogout) {
      propOnLogout();
    } else {
      setInternalIsAuthenticated(false);
      setInternalAdminUser(null);
    }
  };

  // Order Handlers
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    if (propUpdateOrderStatus) {
      propUpdateOrderStatus(orderId, newStatus);
    } else {
      setInternalOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
      );
    }
  };

  const handleConfirmCashReceived = (orderId: string) => {
    if (propConfirmCashReceived) {
      propConfirmCashReceived(orderId);
    } else {
      setInternalOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord;
          const nextPayment: PaymentStatus = ord.paymentMethod === 'COD (Paid)'
            ? 'COD (Pending COD)'
            : 'COD (Paid)';
          return { ...ord, paymentMethod: nextPayment };
        })
      );
    }
  };

  const handleUpdatePaymentStatus = (orderId: string, newPaymentStatus: PaymentStatus) => {
    if (propUpdatePaymentStatus) {
      propUpdatePaymentStatus(orderId, newPaymentStatus);
    } else {
      setInternalOrders((prev) =>
        prev.map((ord) =>
          ord.id === orderId ? { ...ord, paymentMethod: newPaymentStatus } : ord
        )
      );
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (propDeleteOrder) {
      propDeleteOrder(orderId);
    } else {
      const ord = orders.find((o) => o.id === orderId);
      if (ord) {
        const newArchived: ArchivedItem = {
          id: generateUniqueId('arch'),
          originalId: ord.id,
          type: 'order',
          title: `Order ${ord.orderNumber} - ${ord.customerName}`,
          referenceNumber: ord.orderNumber,
          subtitle: `${ord.type} • ${ord.items.length} Items (₱${ord.totalAmount.toLocaleString()})`,
          categoryOrStatus: ord.status,
          archivedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          archivedBy: adminUser ? `Admin (${adminUser.split('@')[0]})` : 'Chef Reme (Admin)',
          reason: 'Archived / Deleted from Live Orders',
          priceOrAmount: ord.totalAmount,
          tags: [ord.type, ord.status, ord.paymentMethod],
          originalPayload: ord
        };
        setInternalArchivedItems((prev) => deduplicateById([newArchived, ...prev]));
      }
      setInternalOrders((prev) => prev.filter((ord) => ord.id !== orderId));
    }
    if (selectedOrderId === orderId) {
      setSelectedOrderId(null);
    }
  };

  // Product Handlers
  const handleToggleStock = (productId: string) => {
    if (propToggleStock) {
      propToggleStock(productId);
    } else {
      setInternalProducts((prev) =>
        prev.map((prod) => {
          if (prod.id === productId) {
            const newStock = !prod.inStock;
            return { ...prod, inStock: newStock };
          }
          return prod;
        })
      );
    }
  };

  const handleSetProductStock = (productId: string, inStock: boolean) => {
    if (propSetProductStock) {
      propSetProductStock(productId, inStock);
    } else {
      setInternalProducts((prev) =>
        prev.map((prod) => (prod.id === productId ? { ...prod, inStock } : prod))
      );
    }
  };

  const handleAddProduct = (newProduct: AdminProduct) => {
    if (propAddProduct) {
      propAddProduct(newProduct);
    } else {
      setInternalProducts((prev) => deduplicateById([newProduct, ...prev]));
    }
  };

  const handleUpdateProduct = (updatedProduct: AdminProduct) => {
    if (propUpdateProduct) {
      propUpdateProduct(updatedProduct);
    } else {
      setInternalProducts((prev) =>
        prev.map((prod) => (prod.id === updatedProduct.id ? updatedProduct : prod))
      );
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (propDeleteProduct) {
      propDeleteProduct(productId);
    } else {
      const prod = products.find((p) => p.id === productId);
      if (prod) {
        const newArchived: ArchivedItem = {
          id: generateUniqueId('arch'),
          originalId: prod.id,
          type: 'product',
          title: prod.name,
          referenceNumber: `SKU-${prod.name.substring(0, 4).toUpperCase()}`,
          subtitle: `${prod.category} • Base ₱${prod.basePrice.toLocaleString()}`,
          categoryOrStatus: prod.category,
          archivedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          archivedBy: adminUser ? `Admin (${adminUser.split('@')[0]})` : 'Chef Reme (Admin)',
          reason: 'Archived / Retired from Bakery Menu',
          priceOrAmount: prod.basePrice,
          tags: [prod.category, prod.leadTime],
          originalPayload: prod
        };
        setInternalArchivedItems((prev) => deduplicateById([newArchived, ...prev]));
      }
      setInternalProducts((prev) => prev.filter((p) => p.id !== productId));
    }
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  };

  // Archive & Recovery Handlers
  const handleRecoverItem = (item: ArchivedItem) => {
    if (propRecoverItem) {
      propRecoverItem(item);
    } else {
      if (item.type === 'order' && item.originalPayload) {
        setInternalOrders((prev) => {
          if (prev.some((o) => o.id === item.originalPayload.id)) {
            return deduplicateById([{ ...item.originalPayload, id: generateUniqueId('ord') }, ...prev]);
          }
          return deduplicateById([item.originalPayload, ...prev]);
        });
      } else if (item.type === 'product' && item.originalPayload) {
        setInternalProducts((prev) => {
          if (prev.some((p) => p.id === item.originalPayload.id)) {
            return deduplicateById([{ ...item.originalPayload, id: generateUniqueId('prod') }, ...prev]);
          }
          return deduplicateById([item.originalPayload, ...prev]);
        });
      } else if (item.type === 'hub' && item.originalPayload) {
        setInternalHubs((prev) => {
          if (prev.some((h) => h.id === item.originalPayload.id)) {
            return deduplicateById([{ ...item.originalPayload, id: generateUniqueId('hub') }, ...prev]);
          }
          return deduplicateById([item.originalPayload, ...prev]);
        });
      }
      setInternalArchivedItems((prev) => prev.filter((i) => i.id !== item.id));
    }
  };

  const handlePermanentDelete = (itemId: string) => {
    if (propPermanentDelete) {
      propPermanentDelete(itemId);
    } else {
      setInternalArchivedItems((prev) => prev.filter((i) => i.id !== itemId));
    }
  };

  const handleBulkRecover = (itemIds: string[]) => {
    if (propBulkRecover) {
      propBulkRecover(itemIds);
    } else {
      const itemsToRecover = archivedItems.filter((i) => itemIds.includes(i.id));
      itemsToRecover.forEach((item) => {
        if (item.type === 'order' && item.originalPayload) {
          setInternalOrders((prev) => deduplicateById([item.originalPayload, ...prev]));
        } else if (item.type === 'product' && item.originalPayload) {
          setInternalProducts((prev) => deduplicateById([item.originalPayload, ...prev]));
        } else if (item.type === 'hub' && item.originalPayload) {
          setInternalHubs((prev) => deduplicateById([item.originalPayload, ...prev]));
        }
      });
      setInternalArchivedItems((prev) => prev.filter((i) => !itemIds.includes(i.id)));
    }
  };

  const handleBulkPermanentDelete = (itemIds: string[]) => {
    if (propBulkPermanentDelete) {
      propBulkPermanentDelete(itemIds);
    } else {
      setInternalArchivedItems((prev) => prev.filter((i) => !itemIds.includes(i.id)));
    }
  };

  const handleEmptyArchive = () => {
    if (propEmptyArchive) {
      propEmptyArchive();
    } else {
      setInternalArchivedItems([]);
    }
  };

  // Blackout date handlers
  const handleAddBlackoutDate = (date: string, reason: string) => {
    if (propAddBlackoutDate) {
      propAddBlackoutDate(date, reason);
    } else {
      const newItem: BlackoutDate = {
        id: generateUniqueId('blk'),
        date,
        reason
      };
      setInternalBlackoutDates((prev) => deduplicateById([...prev, newItem]));
    }
  };

  const handleRemoveBlackoutDate = (id: string) => {
    if (propRemoveBlackoutDate) {
      propRemoveBlackoutDate(id);
    } else {
      setInternalBlackoutDates((prev) => prev.filter((b) => b.id !== id));
    }
  };

  // Hub handlers
  const handleAddHub = (newHub: BakeryHubLocation) => {
    if (propAddHub) {
      propAddHub(newHub);
    } else {
      setInternalHubs((prev) => [...prev, newHub]);
    }
  };

  const handleRemoveHub = (id: string) => {
    if (propRemoveHub) {
      propRemoveHub(id);
    } else {
      setInternalHubs((prev) => prev.filter((h) => h.id !== id));
    }
  };

  const handleToggleHubActive = (id: string) => {
    if (propToggleHubActive) {
      propToggleHubActive(id);
    } else {
      setInternalHubs((prev) =>
        prev.map((h) => (h.id === id ? { ...h, isActive: !h.isActive } : h))
      );
    }
  };

  // ----------------------------------------------------
  // VIEW 1: GATEKEEPER LOGIN SCREEN
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onReturnToStore={onReturnToStore}
      />
    );
  }

  // ----------------------------------------------------
  // VIEW 2: MAIN ADMIN DASHBOARD (RIGHT SIDEBAR LAYOUT)
  // ----------------------------------------------------
  const newOrders = orders.filter((o) => o.status === 'New');
  const newOrdersCount = newOrders.length;

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans flex flex-col">
      
      {/* Top Mobile Bar (only visible on mobile/tablet) */}
      <header className="lg:hidden bg-[#361007] text-amber-50 px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-amber-900/50 shadow-md">
        <button
          onClick={() => {
            setSelectedOrderId(null);
            setSelectedProductId(null);
            setCurrentTab('overview');
            setIsMobileSidebarOpen(false);
          }}
          className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none"
          title="Return to Dashboard Overview"
          aria-label="Return to Dashboard Overview"
        >
          <img
            src={ADMIN_BRAND_LOGO.src}
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (target.src !== ADMIN_BRAND_LOGO.fallbackSrc) {
                target.src = ADMIN_BRAND_LOGO.fallbackSrc;
              }
            }}
            alt={ADMIN_BRAND_LOGO.alt}
            referrerPolicy="no-referrer"
            className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <div>
            <div className="font-serif font-black text-sm text-amber-100 group-hover:text-white transition-colors">Shey's Bakery</div>
            <div className="text-[9px] font-bold text-[#d94d2f] uppercase tracking-wider group-hover:text-[#ff6b4a] transition-colors">Admin Portal</div>
          </div>
        </button>

        <div className="flex items-center">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="p-2 text-amber-100/90 hover:text-white rounded-lg cursor-pointer transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Two-Column Frame:
          LEFT: Sidebar Navigation (Positioned on the LEFT side of the screen)
          RIGHT: Main Workspace (75-80% width)
      */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        
        {/* 1. LEFT SIDEBAR (Desktop: sticky on the LEFT side) */}
        <div className="hidden lg:block shrink-0">
          <AdminSidebar
            currentTab={
              selectedOrderId
                ? 'orders'
                : selectedProductId
                ? 'products'
                : currentTab
            }
            onSelectTab={(tab) => {
              setSelectedOrderId(null);
              setSelectedProductId(null);
              setCurrentTab(tab);
            }}
            onLogout={handleLogout}
            onReturnToStore={onReturnToStore}
            newOrdersCount={newOrdersCount}
          />
        </div>

        {/* 2. RIGHT MAIN SECTION: Full-Width Top Header + Scrollable Workspace */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#faf7f2]">
          
          {/* Top Full-Width Header Bar (Aligned with sidebar logo section height) */}
          <header className="h-[85px] bg-[#faf7f2] border-b border-stone-200/90 px-6 lg:px-10 flex items-center justify-between gap-6 shrink-0 w-full" id="admin-top-action-bar">
            {/* Functional Global Search Bar */}
            <AdminGlobalSearch
              orders={orders}
              products={products}
              archivedItems={archivedItems}
              onSelectOrder={(orderId) => {
                setSelectedOrderId(orderId);
                setSelectedProductId(null);
              }}
              onSelectProduct={(productId) => {
                setSelectedProductId(productId);
                setSelectedOrderId(null);
              }}
              onNavigateTab={(tab) => {
                setSelectedOrderId(null);
                setSelectedProductId(null);
                setCurrentTab(tab);
              }}
            />

            {/* Far Right Graphic Buttons (No containers or background colors, pure buttons) */}
            <div className="flex items-center gap-5 shrink-0">
              {/* Notification Bell with New Orders Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen((prev) => !prev)}
                  title="New Live Orders"
                  aria-label="New Live Orders"
                  aria-expanded={isNotificationsOpen}
                  className={`transition-colors cursor-pointer relative p-2 rounded-xl flex items-center justify-center ${
                    isNotificationsOpen ? 'text-[#d94d2f] bg-stone-100' : 'text-stone-600 hover:text-[#542515]'
                  }`}
                  id="admin-notifications-bell-btn"
                >
                  <Bell className="w-5 h-5 stroke-[1.9]" />
                  {/* Numbered Notification Badge (like Add to Cart badge) */}
                  {newOrdersCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#d94d2f] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs transition-colors pointer-events-none">
                      {newOrdersCount}
                    </span>
                  )}
                </button>

                <NotificationBubble
                  isOpen={isNotificationsOpen}
                  onClose={() => setIsNotificationsOpen(false)}
                  newOrders={newOrders}
                  onSelectOrder={(orderId) => {
                    setSelectedOrderId(orderId);
                    setSelectedProductId(null);
                  }}
                  onNavigateTab={(tab) => {
                    setSelectedOrderId(null);
                    setSelectedProductId(null);
                    setCurrentTab(tab);
                  }}
                />
              </div>

              {/* Calendar Graphic Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId(null);
                  setSelectedProductId(null);
                  setCurrentTab('capacity');
                }}
                title="Calendar & Capacity"
                aria-label="Calendar & Capacity"
                className={`transition-colors cursor-pointer ${
                  currentTab === 'capacity' && !selectedOrderId && !selectedProductId ? 'text-[#d94d2f]' : 'text-stone-600 hover:text-[#542515]'
                }`}
                id="admin-calendar-graphic-btn"
              >
                <CalendarDays className="w-5 h-5 stroke-[1.9]" />
              </button>

              {/* Return to Storefront Graphic Button */}
              <button
                type="button"
                onClick={onReturnToStore}
                title="Return to Storefront"
                aria-label="Return to Storefront"
                className="text-stone-600 hover:text-[#542515] transition-colors cursor-pointer"
                id="admin-return-storefront-graphic-btn"
              >
                <Store className="w-5 h-5 stroke-[1.9]" />
              </button>
            </div>
          </header>

          {/* Main Content Workspace */}
          <main className="flex-1 p-6 lg:p-10 xl:p-12 overflow-y-auto max-w-7xl w-full">
            {/* Active Tab / Order Details View / Product Details View Rendering */}
            {selectedOrderId ? (
              (() => {
                const activeOrder = orders.find((o) => o.id === selectedOrderId);
                if (!activeOrder) {
                  return (
                    <div className="p-8 text-center text-stone-500">
                      <p className="font-bold">Order not found.</p>
                      <button
                        onClick={() => setSelectedOrderId(null)}
                        className="mt-4 px-4 py-2 bg-[#4a170a] text-amber-100 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Return to Orders
                      </button>
                    </div>
                  );
                }
                return (
                  <OrderDetailsView
                    order={activeOrder}
                    onBack={() => setSelectedOrderId(null)}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                    onConfirmCashReceived={handleConfirmCashReceived}
                    onDeleteOrder={handleDeleteOrder}
                  />
                );
              })()
            ) : selectedProductId ? (
              (() => {
                const activeProduct = products.find((p) => p.id === selectedProductId);
                if (!activeProduct) {
                  return (
                    <div className="p-8 text-center text-stone-500">
                      <p className="font-bold">Product not found.</p>
                      <button
                        onClick={() => setSelectedProductId(null)}
                        className="mt-4 px-4 py-2 bg-[#4a170a] text-amber-100 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Return to Products
                      </button>
                    </div>
                  );
                }
                return (
                  <ProductDetailsAdminView
                    product={activeProduct}
                    onBack={() => setSelectedProductId(null)}
                    onToggleStock={handleToggleStock}
                    onSetProductStock={handleSetProductStock}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                  />
                );
              })()
            ) : (
              <>
                {currentTab === 'overview' && (
                  <OverviewView
                    orders={orders}
                    products={products}
                    archivedItems={archivedItems}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                    onConfirmCashReceived={handleConfirmCashReceived}
                    onNavigateToLiveOrders={() => {
                      setSelectedOrderId(null);
                      setSelectedProductId(null);
                      setCurrentTab('orders');
                    }}
                    onNavigateToProducts={() => {
                      setSelectedOrderId(null);
                      setSelectedProductId(null);
                      setCurrentTab('products');
                    }}
                    onNavigateToArchive={() => {
                      setSelectedOrderId(null);
                      setSelectedProductId(null);
                      setCurrentTab('archive');
                    }}
                    onViewOrderDetails={(orderId) => setSelectedOrderId(orderId)}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}

                {currentTab === 'orders' && (
                  <LiveOrdersView
                    orders={orders}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onUpdatePaymentStatus={handleUpdatePaymentStatus}
                    onConfirmCashReceived={handleConfirmCashReceived}
                    onViewOrderDetails={(orderId) => setSelectedOrderId(orderId)}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}

                {currentTab === 'products' && (
                  <ProductsView
                    products={products}
                    onToggleStock={handleToggleStock}
                    onSetProductStock={handleSetProductStock}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onViewProductDetails={(productId) => setSelectedProductId(productId)}
                    onViewLivePage={(prod) => {
                      if (onViewProductLivePage) {
                        onViewProductLivePage(prod.name);
                      } else {
                        onReturnToStore();
                      }
                    }}
                  />
                )}

                {currentTab === 'capacity' && (
                  <CapacityView
                    orders={orders}
                    blackoutDates={blackoutDates}
                    onAddBlackoutDate={handleAddBlackoutDate}
                    onRemoveBlackoutDate={handleRemoveBlackoutDate}
                    onViewOrderDetails={(orderId) => setSelectedOrderId(orderId)}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onDeleteOrder={handleDeleteOrder}
                  />
                )}

                {currentTab === 'archive' && (
                  <ArchiveView
                    archivedItems={archivedItems}
                    onRecoverItem={handleRecoverItem}
                    onPermanentDelete={handlePermanentDelete}
                    onBulkRecover={handleBulkRecover}
                    onBulkPermanentDelete={handleBulkPermanentDelete}
                  />
                )}

                {currentTab === 'settings' && (
                  <SettingsView
                    hubs={hubs}
                    onAddHub={handleAddHub}
                    onRemoveHub={handleRemoveHub}
                    onToggleHubActive={handleToggleHubActive}
                    onRefreshProducts={onRefreshProducts}
                  />
                )}
              </>
            )}
          </main>

        </div>

        {/* Mobile Slide-in Drawer (from Left) */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-start">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slideRight">
              <AdminSidebar
                currentTab={
                  selectedOrderId
                    ? 'orders'
                    : selectedProductId
                    ? 'products'
                    : currentTab
                }
                onSelectTab={(tab) => {
                  setSelectedOrderId(null);
                  setSelectedProductId(null);
                  setCurrentTab(tab);
                  setIsMobileSidebarOpen(false);
                }}
                onLogout={() => {
                  setIsMobileSidebarOpen(false);
                  handleLogout();
                }}
                onReturnToStore={onReturnToStore}
                newOrdersCount={newOrdersCount}
              />
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
