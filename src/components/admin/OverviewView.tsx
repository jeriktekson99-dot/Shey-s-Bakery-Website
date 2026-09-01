import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  Store, 
  CheckCircle2, 
  Clock, 
  Search, 
  UtensilsCrossed, 
  Archive, 
  RefreshCw,
  Eye, 
  ArrowRight, 
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AdminOrder, AdminProduct, ArchivedItem, OrderStatus, PaymentStatus, getOrderStatusBadgeClass, normalizeOrderStatus } from './types';
import { AdminConfirmationModal } from './AdminConfirmationModal';

interface OverviewViewProps {
  orders: AdminOrder[];
  products?: AdminProduct[];
  archivedItems?: ArchivedItem[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: PaymentStatus) => void;
  onConfirmCashReceived: (orderId: string) => void;
  onNavigateToLiveOrders?: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToArchive?: () => void;
  onViewOrderDetails?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  orders,
  products = [],
  archivedItems = [],
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onConfirmCashReceived,
  onNavigateToLiveOrders,
  onNavigateToProducts,
  onNavigateToArchive,
  onViewOrderDetails,
  onDeleteOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [orderToDelete, setOrderToDelete] = useState<AdminOrder | null>(null);

  // Metrics computation for Live Orders, Current Product Stocks, Restock Vault, and Archive Vault
  const liveOrdersCount = orders.filter(
    (ord) => ord.status !== 'Completed' && ord.status !== 'Cancelled'
  ).length;

  const totalProductsCount = products.length;
  const inStockProductsCount = products.filter((prod) => prod.inStock).length;
  const soldOutProductsCount = products.filter((prod) => !prod.inStock).length;

  const totalArchivedCount = archivedItems.length;

  const filteredOrders = orders.filter((ord) => {
    return (
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerPhone.includes(searchQuery)
    );
  });

  // Pagination calculations: 6 display per page
  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );
  const startItemNumber = filteredOrders.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItemNumber = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredOrders.length);

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  return (
    <div className="space-y-8" id="dashboard-overview-view">
      
      {/* 1. Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight uppercase">
            Dashboard Overview
          </h1>
          <p className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-stone-500 mt-1">
            Real-time bakery operations, product catalog availability, and restock vault.
          </p>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Live Orders */}
        <div 
          onClick={onNavigateToLiveOrders}
          className={`bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3.5 transition-all ${
            onNavigateToLiveOrders ? 'cursor-pointer hover:border-[#4a170a] hover:shadow-md' : ''
          }`}
          id="overview-live-orders-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Live Orders
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-[#4a170a] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-800" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight">
              {liveOrdersCount} <span className="text-sm font-bold text-stone-500 font-mono">Active Orders</span>
            </div>
          </div>
        </div>

        {/* Card 2: Current Product Stocks */}
        <div 
          onClick={onNavigateToProducts}
          className={`bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3.5 transition-all ${
            onNavigateToProducts ? 'cursor-pointer hover:border-[#4a170a] hover:shadow-md' : ''
          }`}
          id="overview-product-stocks-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Current Product Stocks
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight">
              {inStockProductsCount} <span className="text-sm font-bold text-stone-500 font-mono">/ {totalProductsCount} In Stock</span>
            </div>
          </div>
        </div>

        {/* Card 3: Restock Vault / Restock Queue */}
        <div 
          onClick={onNavigateToProducts}
          className={`bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3.5 transition-all ${
            onNavigateToProducts ? 'cursor-pointer hover:border-[#4a170a] hover:shadow-md' : ''
          }`}
          id="overview-restock-vault-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Restock Vault
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight">
              {soldOutProductsCount} <span className="text-sm font-bold text-stone-500 font-mono">Items to Restock</span>
            </div>
          </div>
        </div>

        {/* Card 4: Archive Vault */}
        <div 
          onClick={onNavigateToArchive}
          className={`bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-xs space-y-3.5 transition-all ${
            onNavigateToArchive ? 'cursor-pointer hover:border-[#4a170a] hover:shadow-md' : ''
          }`}
          id="overview-archive-vault-card"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Archive Vault
            </span>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Archive className="w-5 h-5 text-stone-700" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight">
              {totalArchivedCount} <span className="text-sm font-bold text-stone-500 font-mono">Vault Records</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Orders Data Table Overview */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h2 className="font-serif font-bold text-lg text-[#4a170a]">
            Recent Orders Stream
          </h2>
          
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search overview orders..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs font-medium focus:outline-none focus:border-[#d01617]"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-xs sm:text-sm">
              <thead className="bg-[#faf8f5] border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-4 px-4 sm:px-6 w-[150px]">Order ID & Time</th>
                  <th className="py-4 px-4 w-[200px]">Customer</th>
                  <th className="py-4 px-4 w-[150px]">Type</th>
                  <th className="py-4 px-4 w-[160px]">Payment</th>
                  <th className="py-4 px-4 w-[120px] text-right">Total</th>
                  <th className="py-4 px-4 sm:px-6 w-[170px] text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-500 font-bold">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isCodPending = order.paymentMethod === 'COD (Pending COD)';

                    return (
                      <tr key={order.id} className="hover:bg-amber-50/40 transition-colors group">
                        <td className="py-4 px-4 sm:px-6 align-top font-bold text-[#4a170a]">
                          {onViewOrderDetails ? (
                            <button
                              type="button"
                              onClick={() => onViewOrderDetails(order.id)}
                              className="font-mono text-sm text-[#d01617] hover:underline font-black whitespace-nowrap cursor-pointer text-left"
                            >
                              {order.orderNumber}
                            </button>
                          ) : (
                            <div className="font-mono text-sm text-[#d01617] whitespace-nowrap">{order.orderNumber}</div>
                          )}
                          <div className="text-[11px] text-stone-500 font-normal whitespace-nowrap">{order.createdAt}</div>
                        </td>

                        <td className="py-4 px-4 align-top">
                          {onViewOrderDetails ? (
                            <button
                              type="button"
                              onClick={() => onViewOrderDetails(order.id)}
                              className="font-bold text-[#4a170a] hover:text-[#d01617] hover:underline transition-colors text-left cursor-pointer flex items-center gap-1 group-hover:text-[#d01617]"
                              title={`Open details for ${order.customerName}`}
                            >
                              <span>{order.customerName}</span>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#d01617]" />
                            </button>
                          ) : (
                            <div className="font-bold text-[#4a170a]">{order.customerName}</div>
                          )}
                          <div className="text-[11px] text-stone-500 whitespace-nowrap">{order.customerPhone}</div>
                        </td>

                        <td className="py-4 px-4 align-top">
                          {order.type === 'Doorstep Delivery' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              <Truck className="w-3.5 h-3.5 text-purple-600" />
                              <span>Delivery</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              <Store className="w-3.5 h-3.5 text-teal-600" />
                              <span>Pickup</span>
                            </span>
                          )}
                        </td>

                        {/* Payment Method Dropdown (Pending vs Paid with Graphic Icons) */}
                        <td className="py-4 px-4 align-top">
                          {order.paymentMethod === 'GCash (Paid)' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>GCash (Paid)</span>
                            </span>
                          ) : (
                            <div className="relative inline-flex items-center">
                              {order.paymentMethod === 'COD (Pending COD)' ? (
                                <Clock className="w-3.5 h-3.5 text-amber-600 absolute left-2.5 pointer-events-none" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 pointer-events-none" />
                              )}
                              <select
                                value={order.paymentMethod}
                                onChange={(e) => {
                                  const newPayment = e.target.value as PaymentStatus;
                                  if (onUpdatePaymentStatus) {
                                    onUpdatePaymentStatus(order.id, newPayment);
                                  } else if (newPayment === 'COD (Paid)') {
                                    onConfirmCashReceived(order.id);
                                  }
                                }}
                                className={`pl-7 pr-6 py-1 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer appearance-none whitespace-nowrap transition-colors ${
                                  order.paymentMethod === 'COD (Pending COD)'
                                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                }`}
                                title="Update Payment Settlement Status"
                              >
                                <option value="COD (Pending COD)" className="bg-white text-amber-900 font-medium">Pending COD</option>
                                <option value="COD (Paid)" className="bg-white text-emerald-800 font-medium">COD (Paid)</option>
                              </select>
                              <ChevronDown className={`w-3 h-3 absolute right-2 pointer-events-none ${
                                order.paymentMethod === 'COD (Pending COD)' ? 'text-amber-600' : 'text-emerald-600'
                              }`} />
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 align-top text-right font-extrabold text-[#4a170a] whitespace-nowrap">
                          ₱{order.totalAmount.toLocaleString()}.00
                        </td>

                        <td className="py-4 px-4 sm:px-6 align-top text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                            {onViewOrderDetails && (
                              <button
                                type="button"
                                onClick={() => onViewOrderDetails(order.id)}
                                className="p-2 rounded-xl bg-stone-100 hover:bg-[#4a170a] text-stone-700 hover:text-amber-100 transition-all cursor-pointer shadow-xs hover:shadow-md group/btn"
                                title="View Full Order Details"
                                aria-label="View Order Details"
                              >
                                <Eye className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setOrderToDelete(order)}
                              className="p-2 rounded-xl bg-stone-100 hover:bg-red-600 text-stone-500 hover:text-white transition-all cursor-pointer shadow-xs hover:shadow-md group/btn"
                              title="Cancel / Delete Order"
                              aria-label="Delete Order"
                            >
                              <Trash2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="p-4 sm:px-6 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="font-mono text-stone-600 font-medium">
              Showing <span className="font-bold text-[#4a170a]">{startItemNumber}</span> to{' '}
              <span className="font-bold text-[#4a170a]">{endItemNumber}</span> of{' '}
              <span className="font-bold text-[#4a170a]">{filteredOrders.length}</span> records
            </div>

            <div className="flex items-center gap-1.5">
              {/* Previous Page Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Number Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                const isActive = pageNum === safeCurrentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#4a170a] text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Page Button */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Next Page"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Delete / Cancel Order */}
      {orderToDelete && (
        <AdminConfirmationModal
          isOpen={!!orderToDelete}
          portalName="KITCHEN ORDERS DISPATCH"
          title="CANCEL & ARCHIVE ORDER"
          message={
            <p>
              Are you sure you want to cancel and archive order <strong className="font-mono font-bold text-[#4a170a]">{orderToDelete.orderNumber}</strong> for <strong className="font-bold text-stone-800">{orderToDelete.customerName}</strong> (₱{orderToDelete.totalAmount.toLocaleString()}.00)? This order will be moved to the <strong>ARCHIVE VAULT</strong>.
            </p>
          }
          cancelText="CANCEL"
          confirmText="YES, ARCHIVE ORDER"
          confirmVariant="danger"
          onClose={() => setOrderToDelete(null)}
          onConfirm={() => {
            if (onDeleteOrder) {
              onDeleteOrder(orderToDelete.id);
            } else {
              onUpdateOrderStatus(orderToDelete.id, 'Cancelled');
            }
            setOrderToDelete(null);
          }}
        />
      )}

    </div>
  );
};
