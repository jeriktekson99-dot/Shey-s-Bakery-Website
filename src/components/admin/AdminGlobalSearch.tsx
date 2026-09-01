import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  X, 
  ShoppingBag, 
  Package, 
  User, 
  Archive, 
  ArrowRight,
  Sparkles,
  CornerDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  AdminOrder, 
  AdminProduct, 
  ArchivedItem, 
  AdminViewTab, 
  getOrderStatusBadgeClass, 
  normalizeOrderStatus 
} from './types';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';

interface AdminGlobalSearchProps {
  orders: AdminOrder[];
  products: AdminProduct[];
  archivedItems: ArchivedItem[];
  onSelectOrder: (orderId: string) => void;
  onSelectProduct: (productId: string) => void;
  onNavigateTab: (tab: AdminViewTab) => void;
}

type SearchCategory = 'all' | 'orders' | 'products' | 'customers' | 'archive';

interface CustomerResult {
  id: string;
  name: string;
  phone: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  latestOrderId: string;
  latestOrderDate: string;
}

export const AdminGlobalSearch: React.FC<AdminGlobalSearchProps> = ({
  orders,
  products,
  archivedItems,
  onSelectOrder,
  onSelectProduct,
  onNavigateTab
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut ('/' to focus search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract distinct customers from orders
  const customersList = useMemo<CustomerResult[]>(() => {
    const map = new Map<string, CustomerResult>();
    orders.forEach((ord) => {
      const key = (ord.customerPhone || ord.customerName).toLowerCase().trim();
      if (!key) return;
      const existing = map.get(key);
      if (existing) {
        existing.ordersCount += 1;
        existing.totalSpent += ord.totalAmount;
      } else {
        map.set(key, {
          id: `cust-${key}`,
          name: ord.customerName,
          phone: ord.customerPhone,
          email: ord.customerEmail,
          ordersCount: 1,
          totalSpent: ord.totalAmount,
          latestOrderId: ord.id,
          latestOrderDate: ord.createdAt || ord.deliveryDate || ''
        });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  // Clean trimmed search term
  const cleanQuery = query.trim().toLowerCase();

  // Search Results Memoization
  const matchedOrders = useMemo(() => {
    if (!cleanQuery) return [];
    return orders.filter((ord) => {
      const matchOrderNum = ord.orderNumber.toLowerCase().includes(cleanQuery);
      const matchCustName = ord.customerName.toLowerCase().includes(cleanQuery);
      const matchPhone = ord.customerPhone.includes(cleanQuery);
      const matchEmail = ord.customerEmail.toLowerCase().includes(cleanQuery);
      const matchStatus = ord.status.toLowerCase().includes(cleanQuery);
      const matchType = ord.type.toLowerCase().includes(cleanQuery);
      const matchPayment = ord.paymentMethod.toLowerCase().includes(cleanQuery);
      const matchItems = ord.items.some((item) => item.name.toLowerCase().includes(cleanQuery));
      const matchAddress = ord.deliveryAddress?.toLowerCase().includes(cleanQuery);

      return (
        matchOrderNum ||
        matchCustName ||
        matchPhone ||
        matchEmail ||
        matchStatus ||
        matchType ||
        matchPayment ||
        matchItems ||
        matchAddress
      );
    });
  }, [orders, cleanQuery]);

  const matchedProducts = useMemo(() => {
    if (!cleanQuery) return [];
    return products.filter((prod) => {
      const matchName = prod.name.toLowerCase().includes(cleanQuery);
      const matchCategory = prod.category.toLowerCase().includes(cleanQuery);
      const matchDesc = prod.description?.toLowerCase().includes(cleanQuery);
      const matchSku = prod.id.toLowerCase().includes(cleanQuery);
      return matchName || matchCategory || matchDesc || matchSku;
    });
  }, [products, cleanQuery]);

  const matchedCustomers = useMemo(() => {
    if (!cleanQuery) return [];
    return customersList.filter((cust) => {
      const matchName = cust.name.toLowerCase().includes(cleanQuery);
      const matchPhone = cust.phone.includes(cleanQuery);
      const matchEmail = cust.email.toLowerCase().includes(cleanQuery);
      return matchName || matchPhone || matchEmail;
    });
  }, [customersList, cleanQuery]);

  const matchedArchive = useMemo(() => {
    if (!cleanQuery) return [];
    return archivedItems.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(cleanQuery);
      const matchRef = item.referenceNumber?.toLowerCase().includes(cleanQuery);
      const matchSub = item.subtitle.toLowerCase().includes(cleanQuery);
      return matchTitle || matchRef || matchSub;
    });
  }, [archivedItems, cleanQuery]);

  // Combined Results for keyboard navigation and rendering
  interface FlattenedResult {
    type: 'order' | 'product' | 'customer' | 'archive';
    id: string;
    action: () => void;
  }

  const flattenedResults = useMemo<FlattenedResult[]>(() => {
    const list: FlattenedResult[] = [];

    if (activeCategory === 'all' || activeCategory === 'orders') {
      matchedOrders.forEach((o) =>
        list.push({
          type: 'order',
          id: o.id,
          action: () => {
            onSelectOrder(o.id);
            setIsOpen(false);
            setQuery('');
          }
        })
      );
    }

    if (activeCategory === 'all' || activeCategory === 'products') {
      matchedProducts.forEach((p) =>
        list.push({
          type: 'product',
          id: p.id,
          action: () => {
            onSelectProduct(p.id);
            setIsOpen(false);
            setQuery('');
          }
        })
      );
    }

    if (activeCategory === 'all' || activeCategory === 'customers') {
      matchedCustomers.forEach((c) =>
        list.push({
          type: 'customer',
          id: c.id,
          action: () => {
            onSelectOrder(c.latestOrderId);
            setIsOpen(false);
            setQuery('');
          }
        })
      );
    }

    if (activeCategory === 'all' || activeCategory === 'archive') {
      matchedArchive.forEach((a) =>
        list.push({
          type: 'archive',
          id: a.id,
          action: () => {
            onNavigateTab('archive');
            setIsOpen(false);
            setQuery('');
          }
        })
      );
    }

    return list;
  }, [
    activeCategory,
    matchedOrders,
    matchedProducts,
    matchedCustomers,
    matchedArchive,
    onSelectOrder,
    onSelectProduct,
    onNavigateTab
  ]);

  const totalResultsCount =
    matchedOrders.length +
    matchedProducts.length +
    matchedCustomers.length +
    matchedArchive.length;

  // Keyboard navigation inside search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && e.key === 'ArrowDown') {
      setIsOpen(true);
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flattenedResults.length > 0) {
        setSelectedIndex((prev) => (prev < flattenedResults.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flattenedResults.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flattenedResults.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flattenedResults.length) {
        flattenedResults[selectedIndex].action();
      } else if (flattenedResults.length > 0) {
        flattenedResults[0].action();
      } else if (cleanQuery) {
        // Fallback: switch to orders tab
        onNavigateTab('orders');
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md w-full">
      {/* Search Input Box */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search orders, products, customers..."
          className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-stone-300/90 bg-white text-sm text-[#4a170a] placeholder:text-stone-400 focus:outline-none focus:border-[#d94d2f] focus:ring-2 focus:ring-[#d94d2f]/15 transition-all shadow-2xs"
          id="admin-global-search-input"
          autoComplete="off"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(-1);
                inputRef.current?.focus();
              }}
              className="text-stone-400 hover:text-stone-700 cursor-pointer p-1 rounded-md transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-stone-400 bg-stone-100 border border-stone-200 rounded">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Live Search Results Popup Dropdown */}
      {isOpen && (
        <div 
          className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-stone-200/90 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {cleanQuery ? (
            <div>
              {/* Category Filter Pills Header */}
              <div className="flex items-center gap-1.5 px-3 py-2.5 bg-stone-50/80 border-b border-stone-100 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-[#4a170a] text-amber-100 shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200/70'
                  }`}
                >
                  All ({totalResultsCount})
                </button>
                {matchedOrders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory('orders')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === 'orders'
                        ? 'bg-[#4a170a] text-amber-100 shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/70'
                    }`}
                  >
                    Orders ({matchedOrders.length})
                  </button>
                )}
                {matchedProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory('products')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === 'products'
                        ? 'bg-[#4a170a] text-amber-100 shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/70'
                    }`}
                  >
                    Products ({matchedProducts.length})
                  </button>
                )}
                {matchedCustomers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory('customers')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === 'customers'
                        ? 'bg-[#4a170a] text-amber-100 shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/70'
                    }`}
                  >
                    Customers ({matchedCustomers.length})
                  </button>
                )}
                {matchedArchive.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory('archive')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      activeCategory === 'archive'
                        ? 'bg-[#4a170a] text-amber-100 shadow-xs'
                        : 'text-stone-600 hover:bg-stone-200/70'
                    }`}
                  >
                    Archive ({matchedArchive.length})
                  </button>
                )}
              </div>

              {/* Results List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-stone-100 p-1">
                {totalResultsCount === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-[#d94d2f] flex items-center justify-center mx-auto mb-2.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#4a170a]">No records found for "{query}"</p>
                    <p className="text-[11px] text-stone-500 mt-1">Try searching by order number, customer name, phone, or pastry name.</p>
                  </div>
                ) : (
                  <>
                    {/* 1. MATCHED ORDERS */}
                    {(activeCategory === 'all' || activeCategory === 'orders') && matchedOrders.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Live & Recent Orders</span>
                          <span>{matchedOrders.length} match{matchedOrders.length > 1 ? 'es' : ''}</span>
                        </div>
                        {matchedOrders.slice(0, 5).map((ord) => {
                          const isSelected =
                            selectedIndex >= 0 &&
                            flattenedResults[selectedIndex]?.id === ord.id;
                          return (
                            <button
                              key={ord.id}
                              type="button"
                              onClick={() => {
                                onSelectOrder(ord.id);
                                setIsOpen(false);
                                setQuery('');
                              }}
                              className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                                isSelected ? 'bg-amber-50/90' : 'hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-[#4a170a] flex items-center justify-center shrink-0">
                                  <ShoppingBag className="w-4 h-4 text-[#d94d2f]" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-black text-[#4a170a] group-hover:text-[#d94d2f] transition-colors">
                                      {ord.orderNumber}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase border ${getOrderStatusBadgeClass(
                                      ord.status
                                    )}`}>
                                      {normalizeOrderStatus(ord.status)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-stone-600 font-medium truncate mt-0.5">
                                    {ord.customerName} • <span className="text-stone-400">{ord.customerPhone}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs font-black text-[#4a170a]">
                                  ₱{ord.totalAmount.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-stone-400 block font-mono">
                                  {ord.items.length} item{ord.items.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 2. MATCHED PRODUCTS */}
                    {(activeCategory === 'all' || activeCategory === 'products') && matchedProducts.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Bakery Catalog Products</span>
                          <span>{matchedProducts.length} match{matchedProducts.length > 1 ? 'es' : ''}</span>
                        </div>
                        {matchedProducts.slice(0, 5).map((prod) => {
                          const isSelected =
                            selectedIndex >= 0 &&
                            flattenedResults[selectedIndex]?.id === prod.id;
                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => {
                                onSelectProduct(prod.id);
                                setIsOpen(false);
                                setQuery('');
                              }}
                              className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                                isSelected ? 'bg-amber-50/90' : 'hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={getOptimizedImageUrl(prod.image, { width: 100, quality: 75 })}
                                  alt={prod.name}
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-stone-200"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#4a170a] truncate group-hover:text-[#d94d2f] transition-colors">
                                      {prod.name}
                                    </span>
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase border ${
                                      prod.inStock
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : 'bg-red-50 text-red-800 border-red-200'
                                    }`}>
                                      {prod.inStock ? 'In Stock' : 'Sold Out'}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-stone-500 font-medium truncate mt-0.5">
                                    Category: {prod.category}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-mono text-xs font-black text-[#4a170a]">
                                  ₱{prod.basePrice.toLocaleString()}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. MATCHED CUSTOMERS */}
                    {(activeCategory === 'all' || activeCategory === 'customers') && matchedCustomers.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Customers</span>
                          <span>{matchedCustomers.length} match{matchedCustomers.length > 1 ? 'es' : ''}</span>
                        </div>
                        {matchedCustomers.slice(0, 4).map((cust) => {
                          const isSelected =
                            selectedIndex >= 0 &&
                            flattenedResults[selectedIndex]?.id === cust.id;
                          return (
                            <button
                              key={cust.id}
                              type="button"
                              onClick={() => {
                                onSelectOrder(cust.latestOrderId);
                                setIsOpen(false);
                                setQuery('');
                              }}
                              className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                                isSelected ? 'bg-amber-50/90' : 'hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-stone-100 text-[#4a170a] flex items-center justify-center font-bold text-xs shrink-0">
                                  {cust.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#4a170a] group-hover:text-[#d94d2f] transition-colors truncate">
                                    {cust.name}
                                  </div>
                                  <p className="text-[11px] text-stone-500 truncate mt-0.5">
                                    {cust.phone} {cust.email ? `• ${cust.email}` : ''}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-mono font-bold">
                                  {cust.ordersCount} order{cust.ordersCount > 1 ? 's' : ''}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 4. MATCHED ARCHIVE */}
                    {(activeCategory === 'all' || activeCategory === 'archive') && matchedArchive.length > 0 && (
                      <div className="py-1">
                        <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
                          <span>Archive / Bin</span>
                          <span>{matchedArchive.length} match{matchedArchive.length > 1 ? 'es' : ''}</span>
                        </div>
                        {matchedArchive.slice(0, 3).map((item) => {
                          const isSelected =
                            selectedIndex >= 0 &&
                            flattenedResults[selectedIndex]?.id === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                onNavigateTab('archive');
                                setIsOpen(false);
                                setQuery('');
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                                isSelected ? 'bg-amber-50/90' : 'hover:bg-stone-50'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <Archive className="w-4 h-4 text-stone-400 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-stone-700 truncate">
                                    {item.title}
                                  </p>
                                  <p className="text-[10px] text-stone-400 truncate">
                                    {item.subtitle}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold uppercase text-stone-400 shrink-0">
                                Archived
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bottom Actions Bar */}
              <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="flex items-center gap-2">
                  <span className="font-medium">Press</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-[10px] font-mono font-bold text-stone-600 shadow-2xs">
                    ↵ Enter
                  </kbd>
                  <span>to open</span>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('orders');
                    setIsOpen(false);
                  }}
                  className="font-bold text-[#d94d2f] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open in Orders View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            /* Empty Query / Quick Suggestions State */
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400">
                <span>Quick Navigation</span>
                <span className="text-[10px]">Esc to close</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('orders');
                    setIsOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition-colors cursor-pointer flex items-center gap-2.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#4a170a] group-hover:text-[#d94d2f]">Live Orders</div>
                    <div className="text-[10px] text-stone-400">{orders.length} total orders</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('products');
                    setIsOpen(false);
                  }}
                  className="p-2.5 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 text-left transition-colors cursor-pointer flex items-center gap-2.5 group"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#4a170a] group-hover:text-[#d94d2f]">Products</div>
                    <div className="text-[10px] text-stone-400">{products.length} bakery items</div>
                  </div>
                </button>
              </div>

              {/* Recent Orders Quick Pick */}
              {orders.slice(0, 3).length > 0 && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                    Recent Orders
                  </span>
                  <div className="space-y-1">
                    {orders.slice(0, 3).map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => {
                          onSelectOrder(ord.id);
                          setIsOpen(false);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <span className="font-mono font-bold text-[#4a170a]">{ord.orderNumber} • {ord.customerName}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase border ${getOrderStatusBadgeClass(
                          ord.status
                        )}`}>
                          {normalizeOrderStatus(ord.status)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
