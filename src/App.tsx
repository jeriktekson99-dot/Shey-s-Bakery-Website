import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem } from './types';
import { 
  getInitialProducts, 
  getInitialOrders, 
  getInitialArchivedItems, 
  getInitialHubs, 
  getInitialBlackoutDates,
  loadInitialMasterDataFromSupabase,
  saveProductsToStorage,
  saveOrdersToStorage,
  saveArchiveToStorage,
  saveHubsToStorage,
  saveBlackoutsToStorage,
  productToAdminProduct,
  adminProductToProduct,
  generateUniqueId,
  deduplicateById
} from './data/bakeryStore';
import { 
  fetchSupabaseProducts,
  createSupabaseOrder, 
  updateSupabaseOrderStatus, 
  updateSupabaseOrderPayment, 
  deleteSupabaseOrder, 
  createSupabaseProduct, 
  updateSupabaseProduct, 
  deleteSupabaseProduct, 
  toggleSupabaseProductStock,
  createSupabaseHub,
  deleteSupabaseHub,
  toggleSupabaseHubActive,
  createSupabaseBlackout,
  deleteSupabaseBlackout,
  createSupabaseArchivedItem,
  deleteSupabaseArchivedItem,
  bulkDeleteSupabaseArchivedItems
} from './services/supabaseService';
import { isSupabaseConfigured } from './lib/supabase';
import { AdminOrder, AdminProduct, BakeryHubLocation, BlackoutDate, ArchivedItem, OrderStatus, PaymentStatus, normalizeOrderStatus } from './components/admin/types';
import { getBundleDetails } from './utils/bundlePricing';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { WhatsNew } from './components/WhatsNew';
import { FeaturedCollections } from './components/FeaturedCollections';
import { CatalogPage } from './components/CatalogPage';
import { ProductDetailsPage } from './components/ProductDetailsPage';
import { FaqSection } from './components/FaqSection';
import { FaqPage } from './components/FaqPage';
import { HowToOrderPage } from './components/HowToOrderPage';
import { AboutUsPage } from './components/AboutUsPage';
import { CheckoutPage } from './components/CheckoutPage';
import { CartPage } from './components/CartPage';
import { Footer } from './components/Footer';

import { CartDrawer } from './components/CartDrawer';
import { SearchModal } from './components/SearchModal';
import { QuickViewModal } from './components/QuickViewModal';
import { HowToOrderModal } from './components/HowToOrderModal';
import { AboutUsModal } from './components/AboutUsModal';
import { AdminPortal } from './components/admin/AdminPortal';

export default function App() {
  // Navigation State - defaults to 'home'
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'faqs' | 'product' | 'how-to-order' | 'about-us' | 'checkout' | 'cart' | 'admin'>('home');
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('All Products');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');

  // Shared Master State for Storefront & Admin Portal
  const [products, setProducts] = useState<Product[]>(getInitialProducts);
  const [orders, setOrders] = useState<AdminOrder[]>(getInitialOrders);
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>(getInitialArchivedItems);
  const [hubs, setHubs] = useState<BakeryHubLocation[]>(getInitialHubs);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>(getInitialBlackoutDates);

  // Selected product for product details view
  const [selectedProduct, setSelectedProduct] = useState<Product>(() => products[0] || getInitialProducts()[0]);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutDate, setCheckoutDate] = useState<string>('');
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHowToOrderOpen, setIsHowToOrderOpen] = useState(false);
  const [isAboutUsOpen, setIsAboutUsOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Admin Authentication Session State (persists across storefront navigation until explicit Logout)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sheys_admin_authenticated') === 'true';
    } catch {
      return false;
    }
  });
  const [adminUser, setAdminUser] = useState<string | null>(() => {
    try {
      return localStorage.getItem('sheys_admin_user') || null;
    } catch {
      return null;
    }
  });

  const handleAdminLoginSuccess = (email: string) => {
    setIsAdminAuthenticated(true);
    setAdminUser(email);
    try {
      localStorage.setItem('sheys_admin_authenticated', 'true');
      localStorage.setItem('sheys_admin_user', email);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    try {
      localStorage.removeItem('sheys_admin_authenticated');
      localStorage.removeItem('sheys_admin_user');
    } catch (e) {
      console.error(e);
    }
  };

  // Sync with Supabase on initial app load and whenever configuration is updated
  useEffect(() => {
    let isMounted = true;

    const loadData = (force = false) => {
      // 1. FAST-TRACK PRODUCT CATALOG (Renders storefront in milliseconds from Supabase)
      fetchSupabaseProducts(force).then((prods) => {
        if (!isMounted || prods === null) return;
        const cleanProds = deduplicateById(prods);
        setProducts(cleanProds);
        saveProductsToStorage(cleanProds);
        setSelectedProduct((prev) => {
          if (!prev) return cleanProds[0] || null;
          const match = cleanProds.find((p) => p.id === prev.id);
          return match || cleanProds[0] || null;
        });
      });

      // 2. LOAD REMAINING MASTER DATA (Orders, Hubs, Blackouts, Archives)
      loadInitialMasterDataFromSupabase(force).then((data) => {
        if (!isMounted) return;
        if (data.products !== undefined && data.products !== null) {
          const cleanProds = deduplicateById(data.products);
          setProducts(cleanProds);
          setSelectedProduct((prev) => {
            if (!prev) return cleanProds[0] || null;
            const match = cleanProds.find((p) => p.id === prev.id);
            return match || cleanProds[0] || null;
          });
        }
        if (data.orders !== undefined) {
          setOrders(deduplicateById(data.orders));
        }
        if (data.hubs !== undefined) {
          setHubs(deduplicateById(data.hubs));
        }
        if (data.blackouts !== undefined) {
          setBlackoutDates(deduplicateById(data.blackouts));
        }
        if (data.archives !== undefined) {
          setArchivedItems(deduplicateById(data.archives));
        }
      });
    };

    loadData(false);

    const handleConfigChange = () => {
      loadData(true);
    };

    window.addEventListener('sheys_supabase_config_updated', handleConfigChange);

    return () => {
      isMounted = false;
      window.removeEventListener('sheys_supabase_config_updated', handleConfigChange);
    };
  }, []);

  // Save to localStorage whenever master data changes
  useEffect(() => {
    saveProductsToStorage(products);
  }, [products]);

  useEffect(() => {
    saveOrdersToStorage(orders);
  }, [orders]);

  useEffect(() => {
    saveArchiveToStorage(archivedItems);
  }, [archivedItems]);

  useEffect(() => {
    saveHubsToStorage(hubs);
  }, [hubs]);

  useEffect(() => {
    saveBlackoutsToStorage(blackoutDates);
  }, [blackoutDates]);

  // Map products to AdminProduct format for AdminPortal
  const adminProducts = useMemo(() => {
    return products.map(productToAdminProduct);
  }, [products]);

  // Handle Return from PayMongo Checkout (success / cancel)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const orderRef = urlParams.get('ref');

    if (paymentStatus === 'success') {
      try {
        const storedOrderStr = localStorage.getItem('sheys_pending_order');
        if (storedOrderStr) {
          const storedOrder: AdminOrder = JSON.parse(storedOrderStr);
          storedOrder.paymentMethod = 'GCash (Paid)';
          if (orderRef) {
            storedOrder.referenceNumber = orderRef;
          }

          // Add to orders if not already added
          setOrders((prev) => {
            if (prev.some((o) => o.orderNumber === storedOrder.orderNumber || o.referenceNumber === storedOrder.referenceNumber)) {
              return prev;
            }
            return [storedOrder, ...prev];
          });

          // Clear cart
          setCartItems([]);
          localStorage.removeItem('sheys_pending_order');

          if (isSupabaseConfigured()) {
            createSupabaseOrder(storedOrder).catch((err) => {
              console.warn('Background Supabase order insert failed:', err);
            });
          }
        }
      } catch (err) {
        console.error('Error restoring paid PayMongo order:', err);
      }

      // Clean up URL query params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled') {
      localStorage.removeItem('sheys_pending_order');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Order Placement Handler (from Storefront Checkout)
  const handlePlaceOrder = (newOrder: AdminOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCartItems([]);
    if (isSupabaseConfigured()) {
      createSupabaseOrder(newOrder).catch((err) => {
        console.warn('Background Supabase order insert failed:', err);
      });
    }
  };

  // Admin Order Actions
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const normalized = normalizeOrderStatus(newStatus);
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: normalized } : ord))
    );
    if (isSupabaseConfigured()) {
      updateSupabaseOrderStatus(orderId, normalized).catch((err) => {
        console.warn('Background Supabase status update failed:', err);
      });
    }
  };

  const handleConfirmCashReceived = (orderId: string) => {
    let nextPayment: PaymentStatus = 'COD (Paid)';
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        nextPayment = ord.paymentMethod === 'COD (Paid)' 
          ? 'COD (Pending COD)' 
          : 'COD (Paid)';
        return { ...ord, paymentMethod: nextPayment };
      })
    );
    if (isSupabaseConfigured()) {
      updateSupabaseOrderPayment(orderId, nextPayment).catch((err) => {
        console.warn('Background Supabase payment update failed:', err);
      });
    }
  };

  const handleUpdatePaymentStatus = (orderId: string, newPaymentStatus: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId ? { ...ord, paymentMethod: newPaymentStatus } : ord
      )
    );
    if (isSupabaseConfigured()) {
      updateSupabaseOrderPayment(orderId, newPaymentStatus).catch((err) => {
        console.warn('Background Supabase payment update failed:', err);
      });
    }
  };

  const handleDeleteOrder = (orderId: string) => {
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
        archivedBy: 'Chef Reme (Admin)',
        reason: 'Archived / Deleted from Live Orders',
        priceOrAmount: ord.totalAmount,
        tags: [ord.type, ord.status, ord.paymentMethod],
        originalPayload: ord
      };
      setArchivedItems((prev) => deduplicateById([newArchived, ...prev]));
      if (isSupabaseConfigured()) {
        createSupabaseArchivedItem(newArchived).catch(() => {});
        deleteSupabaseOrder(orderId).catch(() => {});
      }
    }
    setOrders((prev) => prev.filter((ord) => ord.id !== orderId));
  };

  // Admin Product Actions (Instant Front End Reflection)
  const handleToggleStock = (productId: string) => {
    let newInStock = false;
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === productId) {
          newInStock = prod.inStock !== undefined ? !prod.inStock : false;
          return {
            ...prod,
            inStock: newInStock,
            availability: newInStock ? 'In Stock' : 'Sold Out'
          };
        }
        return prod;
      })
    );
    if (isSupabaseConfigured()) {
      toggleSupabaseProductStock(productId, newInStock).catch(() => {});
    }
  };

  const handleSetProductStock = (productId: string, inStock: boolean) => {
    setProducts((prev) =>
      prev.map((prod) =>
        prod.id === productId
          ? {
              ...prod,
              inStock,
              availability: inStock ? 'In Stock' : 'Sold Out'
            }
          : prod
      )
    );
    if (isSupabaseConfigured()) {
      toggleSupabaseProductStock(productId, inStock).catch(() => {});
    }
  };

  const handleAddProduct = (newAdminProd: AdminProduct) => {
    const newStorefrontProd = adminProductToProduct(newAdminProd);
    setProducts((prev) => [newStorefrontProd, ...prev]);
    if (isSupabaseConfigured()) {
      createSupabaseProduct(newStorefrontProd).catch(() => {});
    }
  };

  const handleUpdateProduct = (updatedAdminProd: AdminProduct) => {
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === updatedAdminProd.id) {
          return adminProductToProduct(updatedAdminProd, prod);
        }
        return prod;
      })
    );
    if (isSupabaseConfigured()) {
      updateSupabaseProduct(updatedAdminProd.id, updatedAdminProd).catch(() => {});
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const adminProd = productToAdminProduct(prod);
      const newArchived: ArchivedItem = {
        id: generateUniqueId('arch'),
        originalId: prod.id,
        type: 'product',
        title: prod.name,
        referenceNumber: `SKU-${prod.name.substring(0, 4).toUpperCase()}`,
        subtitle: `${prod.category} • Base ₱${prod.price.toLocaleString()}`,
        categoryOrStatus: prod.category || 'Pastries',
        archivedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        archivedBy: 'Chef Reme (Admin)',
        reason: 'Archived / Retired from Bakery Menu',
        priceOrAmount: prod.price,
        tags: [prod.category || 'Pastries', prod.leadTime || '24 hrs'],
        originalPayload: adminProd
      };
      setArchivedItems((prev) => deduplicateById([newArchived, ...prev]));
      if (isSupabaseConfigured()) {
        createSupabaseArchivedItem(newArchived).catch(() => {});
        deleteSupabaseProduct(productId).catch(() => {});
      }
    }
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  // Archive Vault & Recovery Actions
  const handleRecoverItem = (item: ArchivedItem) => {
    if (item.type === 'order' && item.originalPayload) {
      setOrders((prev) => {
        if (prev.some((o) => o.id === item.originalPayload.id)) {
          const restoredOrder = { ...item.originalPayload, id: generateUniqueId('ord') };
          if (isSupabaseConfigured()) createSupabaseOrder(restoredOrder).catch(() => {});
          return deduplicateById([restoredOrder, ...prev]);
        }
        if (isSupabaseConfigured()) createSupabaseOrder(item.originalPayload).catch(() => {});
        return deduplicateById([item.originalPayload, ...prev]);
      });
    } else if (item.type === 'product' && item.originalPayload) {
      const restored = adminProductToProduct(item.originalPayload);
      setProducts((prev) => {
        if (prev.some((p) => p.id === restored.id)) {
          const restoredProduct = { ...restored, id: generateUniqueId('prod') };
          if (isSupabaseConfigured()) createSupabaseProduct(restoredProduct).catch(() => {});
          return deduplicateById([restoredProduct, ...prev]);
        }
        if (isSupabaseConfigured()) createSupabaseProduct(restored).catch(() => {});
        return deduplicateById([restored, ...prev]);
      });
    } else if (item.type === 'hub' && item.originalPayload) {
      setHubs((prev) => {
        if (prev.some((h) => h.id === item.originalPayload.id)) {
          const restoredHub = { ...item.originalPayload, id: generateUniqueId('hub') };
          if (isSupabaseConfigured()) createSupabaseHub(restoredHub).catch(() => {});
          return deduplicateById([restoredHub, ...prev]);
        }
        if (isSupabaseConfigured()) createSupabaseHub(item.originalPayload).catch(() => {});
        return deduplicateById([item.originalPayload, ...prev]);
      });
    }
    setArchivedItems((prev) => prev.filter((i) => i.id !== item.id));
    if (isSupabaseConfigured()) {
      deleteSupabaseArchivedItem(item.id).catch(() => {});
    }
  };

  const handlePermanentDelete = (itemId: string) => {
    setArchivedItems((prev) => prev.filter((i) => i.id !== itemId));
    if (isSupabaseConfigured()) {
      deleteSupabaseArchivedItem(itemId).catch(() => {});
    }
  };

  const handleBulkRecover = (itemIds: string[]) => {
    const itemsToRecover = archivedItems.filter((i) => itemIds.includes(i.id));
    itemsToRecover.forEach((item) => {
      if (item.type === 'order' && item.originalPayload) {
        setOrders((prev) => [item.originalPayload, ...prev]);
        if (isSupabaseConfigured()) createSupabaseOrder(item.originalPayload).catch(() => {});
      } else if (item.type === 'product' && item.originalPayload) {
        const restored = adminProductToProduct(item.originalPayload);
        setProducts((prev) => [restored, ...prev]);
        if (isSupabaseConfigured()) createSupabaseProduct(restored).catch(() => {});
      } else if (item.type === 'hub' && item.originalPayload) {
        setHubs((prev) => [item.originalPayload, ...prev]);
        if (isSupabaseConfigured()) createSupabaseHub(item.originalPayload).catch(() => {});
      }
    });
    setArchivedItems((prev) => prev.filter((i) => !itemIds.includes(i.id)));
    if (isSupabaseConfigured()) {
      bulkDeleteSupabaseArchivedItems(itemIds).catch(() => {});
    }
  };

  const handleBulkPermanentDelete = (itemIds: string[]) => {
    setArchivedItems((prev) => prev.filter((i) => !itemIds.includes(i.id)));
    if (isSupabaseConfigured()) {
      bulkDeleteSupabaseArchivedItems(itemIds).catch(() => {});
    }
  };

  const handleEmptyArchive = () => {
    const allIds = archivedItems.map((i) => i.id);
    setArchivedItems([]);
    if (isSupabaseConfigured() && allIds.length > 0) {
      bulkDeleteSupabaseArchivedItems(allIds).catch(() => {});
    }
  };

  // Blackout date handlers
  const handleAddBlackoutDate = (date: string, reason: string) => {
    const newItem: BlackoutDate = {
      id: generateUniqueId('blk'),
      date,
      reason
    };
    setBlackoutDates((prev) => deduplicateById([...prev, newItem]));
    if (isSupabaseConfigured()) {
      createSupabaseBlackout(date, reason).catch(() => {});
    }
  };

  const handleRemoveBlackoutDate = (id: string) => {
    setBlackoutDates((prev) => prev.filter((b) => b.id !== id));
    if (isSupabaseConfigured()) {
      deleteSupabaseBlackout(id).catch(() => {});
    }
  };

  // Hub handlers
  const handleAddHub = (newHub: BakeryHubLocation) => {
    setHubs((prev) => [...prev, newHub]);
    if (isSupabaseConfigured()) {
      createSupabaseHub(newHub).catch(() => {});
    }
  };

  const handleRemoveHub = (id: string) => {
    setHubs((prev) => prev.filter((h) => h.id !== id));
    if (isSupabaseConfigured()) {
      deleteSupabaseHub(id).catch(() => {});
    }
  };

  const handleToggleHubActive = (id: string) => {
    let nextState = false;
    setHubs((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          nextState = !h.isActive;
          return { ...h, isActive: nextState };
        }
        return h;
      })
    );
    if (isSupabaseConfigured()) {
      toggleSupabaseHubActive(id, nextState).catch(() => {});
    }
  };

  // Cart Handlers
  const handleAddToCart = (product: Product, quantityToAdd: number = 1, variant?: string) => {
    const basePrice = product.basePrice || product.price;
    const bundleInfo = getBundleDetails(basePrice, variant);
    const optionNote = variant ? `Option: ${variant}` : undefined;
    const itemKey = variant ? `${product.id}-${variant}` : `${product.id}-single`;

    const productWithPricing: Product = {
      ...product,
      price: bundleInfo.bundlePrice,
      basePrice: basePrice,
    };

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.notes === optionNote
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: item.quantity + quantityToAdd,
                unitPrice: bundleInfo.bundlePrice,
                rawPrice: bundleInfo.rawMultipliedPrice,
                savings: bundleInfo.savings
              }
            : item
        );
      }

      return [
        ...prev,
        {
          id: itemKey,
          product: productWithPricing,
          quantity: quantityToAdd,
          variant,
          notes: optionNote,
          unitPrice: bundleInfo.bundlePrice,
          rawPrice: bundleInfo.rawMultipliedPrice,
          savings: bundleInfo.savings
        },
      ];
    });
  };

  const handleBuyNow = (product: Product, quantityToAdd: number = 1, variant?: string) => {
    handleAddToCart(product, quantityToAdd, variant);
    setCurrentView('cart');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateQuantity = (productId: string, delta: number, notes?: string) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          const matches = item.product.id === productId && (notes === undefined || item.notes === notes);
          if (matches) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string, notes?: string) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && (notes === undefined || item.notes === notes))
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'faqs') {
      setCurrentView('faqs');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavigateToCatalogCategory = (categoryName: string = 'All Products', searchQuery: string = '') => {
    setSelectedCatalogCategory(categoryName);
    setCatalogSearchQuery(searchQuery);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (currentView === 'checkout') {
    return (
      <div className="min-h-screen bg-white text-[#4a170a] font-sans selection:bg-[#d01617] selection:text-white">
        <CheckoutPage
          cartItems={cartItems}
          initialDate={checkoutDate}
          initialNotes={checkoutNotes}
          hubs={hubs}
          blackoutDates={blackoutDates}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onNavigateHome={() => setCurrentView('home')}
          onNavigateCatalog={() => handleNavigateToCatalogCategory('All Products')}
          onOpenCart={() => {
            setCurrentView('cart');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onPlaceOrder={handlePlaceOrder}
        />
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onProceedToCheckout={() => {
            setCurrentView('checkout');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      </div>
    );
  }

  if (currentView === 'admin') {
    return (
      <AdminPortal
        isAuthenticated={isAdminAuthenticated}
        adminUser={adminUser}
        onLoginSuccess={handleAdminLoginSuccess}
        onLogout={handleAdminLogout}
        onReturnToStore={() => {
          setCurrentView('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onViewProductLivePage={(productName) => {
          const matched = products.find((p) => 
            p.name.toLowerCase().includes(productName.toLowerCase()) || 
            productName.toLowerCase().includes(p.name.toLowerCase())
          );
          if (matched) {
            setSelectedProduct(matched);
            setCurrentView('product');
          } else if (products.length > 0) {
            setSelectedProduct(products[0]);
            setCurrentView('product');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
        onConfirmCashReceived={handleConfirmCashReceived}
        onDeleteOrder={handleDeleteOrder}
        products={adminProducts}
        onToggleStock={handleToggleStock}
        onSetProductStock={handleSetProductStock}
        onAddProduct={handleAddProduct}
        onUpdateProduct={handleUpdateProduct}
        onDeleteProduct={handleDeleteProduct}
        archivedItems={archivedItems}
        onRecoverItem={handleRecoverItem}
        onPermanentDelete={handlePermanentDelete}
        onBulkRecover={handleBulkRecover}
        onBulkPermanentDelete={handleBulkPermanentDelete}
        onEmptyArchive={handleEmptyArchive}
        hubs={hubs}
        onAddHub={handleAddHub}
        onRemoveHub={handleRemoveHub}
        onToggleHubActive={handleToggleHubActive}
        blackoutDates={blackoutDates}
        onAddBlackoutDate={handleAddBlackoutDate}
        onRemoveBlackoutDate={handleRemoveBlackoutDate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#faf5ea] text-[#4a170a] flex flex-col font-sans selection:bg-[#d01617] selection:text-white">
      
      {/* 1 & 2: Top Announcement Bar + Header & Navigation */}
      <Header
        cartCount={totalCartCount}
        products={products}
        onSelectProduct={handleSelectProduct}
        onOpenCart={() => {
          setCurrentView('cart');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenHowToOrder={() => {
          setCurrentView('how-to-order');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAboutUs={() => {
          setCurrentView('about-us');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToSection={scrollToSection}
        activeView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          if (view === 'catalog') setSelectedCatalogCategory('All Products');
        }}
        onSelectCategory={handleNavigateToCatalogCategory}
      />

      {/* Main View Switcher */}
      <main className="flex-1">
        {currentView === 'cart' ? (
          <CartPage
            cartItems={cartItems}
            allProducts={products}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onNavigateHome={() => setCurrentView('home')}
            onNavigateCatalog={handleNavigateToCatalogCategory}
            onSelectProduct={handleSelectProduct}
            onProceedToCheckout={(orderNotes, selectedDate) => {
              if (orderNotes !== undefined) setCheckoutNotes(orderNotes);
              if (selectedDate) setCheckoutDate(selectedDate);
              setCurrentView('checkout');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : currentView === 'about-us' ? (
          <AboutUsPage
            onExploreBakes={() => handleNavigateToCatalogCategory('All Products')}
            onNavigateHome={() => setCurrentView('home')}
          />
        ) : currentView === 'how-to-order' ? (
          <HowToOrderPage
            onStartShopping={() => handleNavigateToCatalogCategory('All Products')}
            onNavigateHome={() => setCurrentView('home')}
            onNavigateFaqs={() => {
              setCurrentView('faqs');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : currentView === 'product' ? (
          <ProductDetailsPage
            product={selectedProduct}
            allProducts={products}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onSelectProduct={handleSelectProduct}
            onNavigateHome={() => setCurrentView('home')}
            onNavigateCatalog={handleNavigateToCatalogCategory}
            onOpenHowToOrder={() => {
              setCurrentView('how-to-order');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : currentView === 'faqs' ? (
          <FaqPage
            onOpenHowToOrder={() => {
              setCurrentView('how-to-order');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigateHome={() => setCurrentView('home')}
          />
        ) : currentView === 'catalog' ? (
          <CatalogPage
            products={products}
            onAddToCart={handleAddToCart}
            onQuickView={(product) => handleSelectProduct(product)}
            initialCategory={selectedCatalogCategory}
            initialSearchQuery={catalogSearchQuery}
            onClearSearchQuery={() => setCatalogSearchQuery('')}
          />
        ) : (
          <>
            {/* Hero Section */}
            <Hero
              onShopNow={() => handleNavigateToCatalogCategory('All Products')}
              onOpenHowToOrder={() => {
                setCurrentView('how-to-order');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* "What's New" Grid Section */}
            <WhatsNew
              products={products}
              onSelectProduct={(product) => handleSelectProduct(product)}
              onQuickView={(product) => handleSelectProduct(product)}
              onViewAllProducts={() => handleNavigateToCatalogCategory('All Products')}
            />

            {/* "Featured Collections" Section */}
            <FeaturedCollections
              onSelectCollection={(categoryName) => {
                handleNavigateToCatalogCategory(categoryName);
              }}
            />

            {/* Frequently Asked Questions Section on Home */}
            <FaqSection />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigateToSection={scrollToSection}
        onNavigateToCatalog={handleNavigateToCatalogCategory}
        onNavigateToFaqs={() => {
          setCurrentView('faqs');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToHowToOrder={() => {
          setCurrentView('how-to-order');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToAboutUs={() => {
          setCurrentView('about-us');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenHowToOrder={() => {
          setCurrentView('how-to-order');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAboutUs={() => {
          setCurrentView('about-us');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToAdmin={() => {
          setCurrentView('admin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Interactive Drawers & Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setCurrentView('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
        onSelectProduct={(product) => {
          setIsSearchOpen(false);
          handleSelectProduct(product);
        }}
      />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <HowToOrderModal
        isOpen={isHowToOrderOpen}
        onClose={() => setIsHowToOrderOpen(false)}
        onStartOrdering={() => handleNavigateToCatalogCategory('All Products')}
      />

      <AboutUsModal
        isOpen={isAboutUsOpen}
        onClose={() => setIsAboutUsOpen(false)}
      />

    </div>
  );
}
