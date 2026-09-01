import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Truck, 
  Store, 
  CheckCircle2, 
  Clock, 
  Banknote, 
  Eye, 
  ArrowRight, 
  ShoppingBag, 
  Trash2, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Package 
} from 'lucide-react';
import { AdminOrder, OrderStatus, PaymentStatus, FulfillmentType, getOrderStatusBadgeClass, normalizeOrderStatus } from './types';
import { AdminConfirmationModal } from './AdminConfirmationModal';

interface LiveOrdersViewProps {
  orders: AdminOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: PaymentStatus) => void;
  onConfirmCashReceived: (orderId: string) => void;
  onViewOrderDetails: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

// Helper to ensure only the date is displayed without time slots
const formatDateOnly = (dateStr?: string): string => {
  if (!dateStr) return 'Scheduled';
  if (dateStr.includes(' • ')) return dateStr.split(' • ')[0].trim();
  if (dateStr.includes(', ')) {
    const parts = dateStr.split(', ');
    if (/PM|AM|Window|Dispatch|Pickup/i.test(parts[1])) {
      return parts[0].trim();
    }
  }
  return dateStr;
};

export const LiveOrdersView: React.FC<LiveOrdersViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onConfirmCashReceived,
  onViewOrderDetails,
  onDeleteOrder
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [orderToDelete, setOrderToDelete] = useState<AdminOrder | null>(null);
  const [isBulkCancelModalOpen, setIsBulkCancelModalOpen] = useState<boolean>(false);
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrderIds([]);
  }, [search, statusFilter, fulfillmentFilter, paymentFilter]);

  // Filter orders matching search and category/status/fulfillment/payment filter
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerPhone.includes(search) ||
      order.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'All' || 
      normalizeOrderStatus(order.status) === statusFilter;

    const matchesFulfillment =
      fulfillmentFilter === 'All' ||
      (fulfillmentFilter === 'Delivery' && order.type === 'Doorstep Delivery') ||
      (fulfillmentFilter === 'Pickup' && order.type === 'Store Pickup');

    const matchesPayment =
      paymentFilter === 'All' ||
      (paymentFilter === 'gcash' && order.paymentMethod === 'GCash (Paid)') ||
      (paymentFilter === 'cod_pending' && order.paymentMethod === 'COD (Pending COD)') ||
      (paymentFilter === 'cod_paid' && order.paymentMethod === 'COD (Paid)');

    return matchesSearch && matchesStatus && matchesFulfillment && matchesPayment;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startItemNumber = filteredOrders.length === 0 ? 0 : startIndex + 1;
  const endItemNumber = Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(paginatedOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedOrderIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = 
    paginatedOrders.length > 0 && 
    paginatedOrders.every((o) => selectedOrderIds.includes(o.id));

  // Bulk actions
  const handleBulkStatus = (status: OrderStatus) => {
    if (selectedOrderIds.length === 0) return;
    if (status === 'Cancelled') {
      setIsBulkCancelModalOpen(true);
      return;
    }

    const count = selectedOrderIds.length;
    selectedOrderIds.forEach((id) => {
      onUpdateOrderStatus(id, status);
    });
    setSelectedOrderIds([]);
    showFeedback(`Successfully marked ${count} ${count === 1 ? 'order' : 'orders'} as ${status}.`);
  };

  const confirmExecuteBulkCancel = () => {
    const count = selectedOrderIds.length;
    selectedOrderIds.forEach((id) => {
      onUpdateOrderStatus(id, 'Cancelled');
    });
    setSelectedOrderIds([]);
    setIsBulkCancelModalOpen(false);
    showFeedback(`Marked ${count} ${count === 1 ? 'order' : 'orders'} as Cancelled.`, 'info');
  };

  const handleBulkArchive = () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkArchiveModalOpen(true);
  };

  const confirmExecuteBulkArchive = () => {
    const count = selectedOrderIds.length;
    selectedOrderIds.forEach((id) => {
      if (onDeleteOrder) {
        onDeleteOrder(id);
      } else {
        onUpdateOrderStatus(id, 'Cancelled');
      }
    });
    setSelectedOrderIds([]);
    setIsBulkArchiveModalOpen(false);
    showFeedback(`Archived ${count} ${count === 1 ? 'order' : 'orders'} to the Archive Vault.`, 'info');
  };

  // Helper for quick next status step
  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'New':
        return 'Completed';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="admin-live-orders-catalog-view">
      
      {/* 1. Section Header (Matching Main Admin Pages) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight uppercase">
            Live Orders
          </h1>
          <p className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-stone-500 mt-1">
            Real-time kitchen bake pipeline, oven preparation queue, and live order fulfillment stream.
          </p>
        </div>
      </div>

      {/* Feedback Banner Notification */}
      {feedbackMessage && (
        <div 
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono transition-all animate-fadeIn ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
          role="status"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${feedbackMessage.type === 'success' ? 'text-emerald-600' : 'text-amber-600'}`} />
            <span className="font-bold">{feedbackMessage.text}</span>
          </div>
          <button 
            onClick={() => setFeedbackMessage(null)}
            className="text-stone-400 hover:text-stone-700 text-[11px] font-bold uppercase cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Main Structured Data Table Container (Directly combined with Search & Dropdown Boxes) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        
        {/* Top Filter Bar (Search Left + Segment/Type/Status/Payment Dropdowns Right in One Clean Line) */}
        <div className="p-4 sm:p-5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 sm:gap-4 border-b border-stone-100">
          
          {/* Search Box */}
          <div className="relative w-full xl:max-w-xs 2xl:max-w-sm shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search orders by ID, customer, phone, or items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#4a170a] focus:ring-1 focus:ring-[#4a170a] bg-stone-50/50 hover:bg-white transition-colors placeholder:text-stone-400 text-[#4a170a]"
            />
          </div>

          {/* Dropdown Filters on the Right (Single Line Row) */}
          <div className="flex flex-nowrap items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 xl:pb-0 w-full xl:w-auto justify-start xl:justify-end shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            
            {/* Status Dropdown Box */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <label className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-stone-500 shrink-0">
                STATUS:
              </label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 sm:pl-3.5 pr-8 py-2 rounded-xl border border-stone-200 bg-white hover:border-stone-400 text-xs font-mono font-semibold text-stone-800 focus:outline-none focus:border-[#4a170a] appearance-none cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                >
                  <option value="All">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Type / Fulfillment Dropdown Box */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <label className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-stone-500 shrink-0">
                TYPE:
              </label>
              <div className="relative">
                <select
                  value={fulfillmentFilter}
                  onChange={(e) => setFulfillmentFilter(e.target.value)}
                  className="pl-3 sm:pl-3.5 pr-8 py-2 rounded-xl border border-stone-200 bg-white hover:border-stone-400 text-xs font-mono font-semibold text-stone-800 focus:outline-none focus:border-[#4a170a] appearance-none cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                >
                  <option value="All">All Types</option>
                  <option value="Delivery">Doorstep Delivery</option>
                  <option value="Pickup">Store Pickup</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Payment Dropdown Box */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <label className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-stone-500 shrink-0">
                PAYMENT:
              </label>
              <div className="relative">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="pl-3 sm:pl-3.5 pr-8 py-2 rounded-xl border border-stone-200 bg-white hover:border-stone-400 text-xs font-mono font-semibold text-stone-800 focus:outline-none focus:border-[#4a170a] appearance-none cursor-pointer shadow-2xs transition-colors whitespace-nowrap"
                >
                  <option value="All">All Payments</option>
                  <option value="gcash">GCash (Paid)</option>
                  <option value="cod_pending">COD (Pending)</option>
                  <option value="cod_paid">COD (Paid)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

        </div>

        {/* Selected Items Status / Bulk Actions Bar (Matching Menu & Products Catalog) */}
        <div className="px-5 py-2.5 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-stone-600 font-bold uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full ${selectedOrderIds.length > 0 ? 'bg-[#d01617] animate-pulse' : 'bg-stone-300'}`} />
            <span>{selectedOrderIds.length} ITEMS SELECTED</span>
          </div>

          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStatus('Completed')}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Mark Completed
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatus('Cancelled')}
                className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Mark Cancelled
              </button>
              <button
                type="button"
                onClick={handleBulkArchive}
                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Archive ({selectedOrderIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="text-stone-400 hover:text-stone-600 underline text-[10px] cursor-pointer ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Table Body (Exact same columns and structure as Menu & Products Catalog) */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs sm:text-sm">
            <colgroup>
              <col className="w-12" />
              <col className="w-36" />
              <col className="w-auto" />
              <col className="w-48" />
              <col className="w-44" />
              <col className="w-36" />
              <col className="w-36" />
            </colgroup>
            
            {/* Table Header */}
            <thead className="bg-white border-b border-stone-200 text-stone-600 font-mono font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-4 px-4 sm:px-5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-stone-300 text-[#4a170a] focus:ring-0 accent-[#4a170a] cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4 whitespace-nowrap">
                  ORDER ID
                </th>
                <th className="py-4 px-4 min-w-[220px]">
                  CUSTOMER & ITEMS
                </th>
                <th className="py-4 px-4 whitespace-nowrap">
                  FULFILLMENT TYPE
                </th>
                <th className="py-4 px-4 whitespace-nowrap">
                  TOTAL & PAYMENT
                </th>
                <th className="py-4 px-4 whitespace-nowrap">
                  STATUS
                </th>
                <th className="py-4 px-4 text-center whitespace-nowrap">
                  CONTROL ACTIONS
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-500">
                    <p className="font-bold text-stone-700">No orders match your criteria</p>
                    <p className="text-xs text-stone-400 mt-1 font-mono">Try adjusting your search or dropdown filters</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const isCodPending = order.paymentMethod === 'COD (Pending COD)';

                  const itemsSummary = order.items
                    .map((item) => `${item.quantity}x ${item.name}`)
                    .join(', ');

                  return (
                    <tr 
                      key={order.id} 
                      className={`hover:bg-amber-50/30 transition-colors group ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      
                      {/* Checkbox */}
                      <td className="py-4 px-4 sm:px-5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(order.id)}
                          className="w-4 h-4 rounded border-stone-300 text-[#4a170a] focus:ring-0 accent-[#4a170a] cursor-pointer"
                        />
                      </td>

                      {/* Order ID */}
                      <td className="py-4 px-4 font-mono text-xs font-bold text-stone-700 whitespace-nowrap">
                        <div className="text-[#d01617]">{order.orderNumber}</div>
                        <div className="text-[10px] text-stone-400 font-normal">{order.createdAt}</div>
                      </td>

                      {/* Customer Display & Items Excerpt */}
                      <td className="py-4 px-4">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onViewOrderDetails(order.id)}
                            className="font-bold text-[#4a170a] hover:text-[#d01617] hover:underline transition-colors text-left cursor-pointer flex items-center gap-1.5 truncate max-w-sm"
                            title={`Open details for ${order.customerName}`}
                          >
                            <span className="truncate">{order.customerName}</span>
                          </button>
                          <p className="text-[11px] text-stone-500 truncate max-w-xs sm:max-w-sm mt-0.5 font-mono">
                            {order.customerPhone} • {itemsSummary}
                          </p>
                        </div>
                      </td>

                      {/* Fulfillment Type */}
                      <td className="py-4 px-4 font-medium text-stone-700 whitespace-nowrap">
                        {order.type === 'Doorstep Delivery' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                            <Truck className="w-3.5 h-3.5 text-purple-600" />
                            <span>Delivery</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200 font-mono">
                            <Store className="w-3.5 h-3.5 text-teal-600" />
                            <span>Store Pickup</span>
                          </span>
                        )}
                        <div className="text-[11px] text-stone-500 font-mono mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[170px]" title={formatDateOnly(order.deliveryDate || order.targetDate)}>
                            {formatDateOnly(order.deliveryDate || order.targetDate)}
                          </span>
                        </div>
                      </td>

                      {/* Total & Payment (Matching Base Price & Status pill from Products) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-extrabold text-[#4a170a]">
                            ₱{order.totalAmount.toLocaleString()}.00
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                              order.paymentMethod === 'GCash (Paid)' || order.paymentMethod === 'COD (Paid)'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-800 border border-amber-300'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                order.paymentMethod === 'GCash (Paid)' || order.paymentMethod === 'COD (Paid)'
                                  ? 'bg-emerald-600'
                                  : 'bg-amber-600'
                              }`} />
                              {order.paymentMethod === 'GCash (Paid)' ? 'GCash Paid' : order.paymentMethod === 'COD (Paid)' ? 'COD Settled' : 'Pending COD'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status Column (New: Blue, Completed: Green, Cancelled: Red) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="relative inline-block">
                          <select
                            value={normalizeOrderStatus(order.status)}
                            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
                            className={`pl-2.5 pr-6 py-1 rounded-xl text-xs font-mono font-bold border appearance-none cursor-pointer focus:outline-none transition-colors shadow-2xs ${getOrderStatusBadgeClass(
                              order.status
                            )}`}
                            title="Change order status"
                          >
                            <option value="New" className="bg-white text-blue-800">New</option>
                            <option value="Completed" className="bg-white text-emerald-800">Completed</option>
                            <option value="Cancelled" className="bg-white text-red-700">Cancelled</option>
                          </select>
                          <ChevronDown className="w-3 h-3 text-stone-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </td>

                      {/* Control Actions (Row of 3 rounded square icon buttons) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* 1. Quick View / Inspect Details */}
                          <button
                            type="button"
                            onClick={() => onViewOrderDetails(order.id)}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-stone-800 bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Inspect Order Details"
                            aria-label="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Confirm Cash / Settle Payment Toggle Button */}
                          {order.paymentMethod === 'GCash (Paid)' ? (
                            <div 
                              className="w-8 h-8 rounded-xl border border-stone-200/50 bg-stone-50 text-emerald-700 flex items-center justify-center shadow-2xs"
                              title="GCash Verified (Non-COD)"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                          ) : isCodPending ? (
                            <button
                              type="button"
                              onClick={() => onConfirmCashReceived(order.id)}
                              className="w-8 h-8 rounded-xl border border-amber-300 hover:border-emerald-500 bg-amber-50 hover:bg-emerald-50 text-amber-800 hover:text-emerald-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
                              title="Click to Mark COD as Settled"
                              aria-label="Confirm Cash Received"
                            >
                              <Banknote className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onConfirmCashReceived(order.id)}
                              className="w-8 h-8 rounded-xl border border-emerald-300 hover:border-amber-400 bg-emerald-50 hover:bg-amber-50 text-emerald-700 hover:text-amber-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
                              title="COD Settled - Click to Revert back to Pending COD"
                              aria-label="Toggle COD Settlement Status"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-amber-700 transition-colors" />
                            </button>
                          )}

                          {/* 4. Delete / Archive Button */}
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-red-300 bg-white hover:bg-red-50 text-stone-500 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Cancel / Archive Order"
                            aria-label="Archive Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

        {/* 5. Table Footer with Monospace Records Count & Pagination (Exact match to Products) */}
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

      {/* Confirmation Modal: Single Cancel / Archive Order */}
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
            showFeedback(`Order ${orderToDelete.orderNumber} was moved to the Archive Vault.`, 'info');
          }}
        />
      )}

      {/* Confirmation Modal: Bulk Cancel Orders */}
      {isBulkCancelModalOpen && (
        <AdminConfirmationModal
          isOpen={isBulkCancelModalOpen}
          portalName="KITCHEN ORDERS DISPATCH"
          title="CANCEL SELECTED ORDERS"
          message={
            <p>
              Are you sure you want to mark <strong className="font-mono font-bold text-[#4a170a]">{selectedOrderIds.length}</strong> selected {selectedOrderIds.length === 1 ? 'order' : 'orders'} as <strong>CANCELLED</strong>?
            </p>
          }
          cancelText="KEEP ACTIVE"
          confirmText={`YES, CANCEL ${selectedOrderIds.length} ${selectedOrderIds.length === 1 ? 'ORDER' : 'ORDERS'}`}
          confirmVariant="warning"
          onClose={() => setIsBulkCancelModalOpen(false)}
          onConfirm={confirmExecuteBulkCancel}
        />
      )}

      {/* Confirmation Modal: Bulk Archive Orders */}
      {isBulkArchiveModalOpen && (
        <AdminConfirmationModal
          isOpen={isBulkArchiveModalOpen}
          portalName="KITCHEN ORDERS DISPATCH"
          title="ARCHIVE SELECTED ORDERS"
          message={
            <p>
              Are you sure you want to archive <strong className="font-mono font-bold text-[#4a170a]">{selectedOrderIds.length}</strong> selected {selectedOrderIds.length === 1 ? 'order' : 'orders'}? All selected tickets will be moved to the <strong>ARCHIVE VAULT</strong>.
            </p>
          }
          cancelText="CANCEL"
          confirmText={`YES, ARCHIVE ${selectedOrderIds.length} ${selectedOrderIds.length === 1 ? 'ORDER' : 'ORDERS'}`}
          confirmVariant="danger"
          onClose={() => setIsBulkArchiveModalOpen(false)}
          onConfirm={confirmExecuteBulkArchive}
        />
      )}

    </div>
  );
};
