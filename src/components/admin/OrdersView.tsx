import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Truck, 
  Store, 
  CheckCircle2, 
  Clock, 
  Search, 
  Banknote, 
  CreditCard,
  Filter,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User,
  Eye,
  X,
  Phone,
  MapPin,
  Calendar,
  ArrowRight,
  Package,
  Check,
  XCircle
} from 'lucide-react';
import { AdminOrder, OrderStatus, PaymentStatus, FulfillmentType, getOrderStatusBadgeClass, normalizeOrderStatus } from './types';
import { AdminConfirmationModal } from './AdminConfirmationModal';

interface OrdersViewProps {
  orders: AdminOrder[];
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onConfirmCashReceived: (orderId: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onUpdateOrderStatus,
  onConfirmCashReceived
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [fulfillmentFilter, setFulfillmentFilter] = useState<string>('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [inspectingOrder, setInspectingOrder] = useState<AdminOrder | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<AdminOrder | null>(null);
  const [isBulkCancelModalOpen, setIsBulkCancelModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedOrderIds([]);
  }, [searchQuery, statusFilter, paymentFilter, fulfillmentFilter]);

  // Compute Metrics
  const totalSales = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);
  const totalOrdersCount = orders.length;

  const gcashPaidTotal = orders
    .filter((ord) => ord.paymentMethod === 'GCash (Paid)')
    .reduce((sum, ord) => sum + ord.totalAmount, 0);

  const pendingCodTotal = orders
    .filter((ord) => ord.paymentMethod === 'COD (Pending COD)')
    .reduce((sum, ord) => sum + ord.totalAmount, 0);

  const pendingCodCount = orders.filter((ord) => ord.paymentMethod === 'COD (Pending COD)').length;
  const gcashPaidCount = orders.filter((ord) => ord.paymentMethod === 'GCash (Paid)').length;

  // Filter Orders
  const filteredOrders = orders.filter((ord) => {
    const matchesSearch = 
      ord.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerPhone.includes(searchQuery) ||
      ord.items.some((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || normalizeOrderStatus(ord.status) === statusFilter;
    
    const matchesPayment = 
      paymentFilter === 'all' || 
      (paymentFilter === 'gcash' && ord.paymentMethod === 'GCash (Paid)') ||
      (paymentFilter === 'paymaya' && ord.paymentMethod === 'PayMaya (Paid)') ||
      (paymentFilter === 'qrph' && ord.paymentMethod === 'QR Ph (Paid)') ||
      (paymentFilter === 'card' && ord.paymentMethod === 'Card (Paid)') ||
      (paymentFilter === 'online_paid' && (ord.paymentMethod.includes('Paid') && !ord.paymentMethod.includes('COD'))) ||
      (paymentFilter === 'cod_pending' && ord.paymentMethod === 'COD (Pending COD)') ||
      (paymentFilter === 'cod_paid' && ord.paymentMethod === 'COD (Paid)');

    const matchesFulfillment = 
      fulfillmentFilter === 'all' ||
      (fulfillmentFilter === 'delivery' && ord.type === 'Doorstep Delivery') ||
      (fulfillmentFilter === 'pickup' && ord.type === 'Store Pickup');

    return matchesSearch && matchesStatus && matchesPayment && matchesFulfillment;
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

  // Bulk status update
  const handleBulkStatusUpdate = (status: OrderStatus) => {
    selectedOrderIds.forEach((id) => {
      onUpdateOrderStatus(id, status);
    });
    setSelectedOrderIds([]);
  };

  // Quick next-stage helper
  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'New':
        return 'Completed';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" id="admin-orders-dispatch-view">
      
      {/* 1. Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight uppercase">
            Kitchen Dispatch & Orders
          </h1>
          <p className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-stone-500 mt-1">
            Real-time live queue, COD settlement, and custom bakery delivery fulfillment.
          </p>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Card 1: Daily Sales */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
              DAILY SALES
            </span>
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#d01617] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight">
              ₱{totalSales.toLocaleString()}.00
            </div>
            <div className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <span>↑ +18.4% vs yesterday</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
              ACTIVE QUEUE
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-[#4a170a] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-700" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight">
              {totalOrdersCount} <span className="text-sm font-semibold text-stone-500 font-sans">Orders</span>
            </div>
            <div className="text-[11px] font-bold text-stone-500 mt-1">
              Live kitchen tickets
            </div>
          </div>
        </div>

        {/* Card 3: GCash Paid Total */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
              GCASH SETTLED
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 tracking-tight">
              ₱{gcashPaidTotal.toLocaleString()}.00
            </div>
            <div className="text-[11px] font-bold text-blue-600 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{gcashPaidCount} Paid via e-Wallet/Cards</span>
            </div>
          </div>
        </div>

        {/* Card 4: Pending COD Total */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider">
              PENDING COD
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-100/60 text-amber-800 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">
              ₱{pendingCodTotal.toLocaleString()}.00
            </div>
            <div className="text-[11px] font-bold text-amber-700 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingCodCount} Pending Cash Collect</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Main Structured Data Table Container (Matching Menu & Products Catalog) */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        
        {/* Top Filter Bar (Search Left + Segment/Status Filters Right) */}
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-stone-100">
          
          {/* Search Box */}
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search orders by ID, customer name, phone or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-8 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#4a170a] focus:ring-1 focus:ring-[#4a170a] bg-stone-50/50 hover:bg-white transition-colors placeholder:text-stone-400 text-[#4a170a]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Segment Filters on Right (Single Line Row) */}
          <div className="flex flex-nowrap items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 lg:pb-0 w-full lg:w-auto justify-start lg:justify-end shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {/* Type Filter */}
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
                  <option value="all">All Types</option>
                  <option value="delivery">Delivery</option>
                  <option value="pickup">Store Pickup</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Payment Filter */}
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
                  <option value="all">All Payments</option>
                  <option value="online_paid">All Online Paid (PayMongo)</option>
                  <option value="gcash">GCash (Paid)</option>
                  <option value="paymaya">Maya (Paid)</option>
                  <option value="qrph">QR Ph (Paid)</option>
                  <option value="card">Card (Paid)</option>
                  <option value="cod_pending">COD (Pending)</option>
                  <option value="cod_paid">COD (Settled)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

        </div>

        {/* Selected Items Status / Bulk Actions Bar */}
        <div className="px-5 py-2.5 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-stone-600 font-bold uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full ${selectedOrderIds.length > 0 ? 'bg-[#d01617] animate-pulse' : 'bg-stone-300'}`} />
            <span>{selectedOrderIds.length} ITEMS SELECTED</span>
          </div>

          {selectedOrderIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStatusUpdate('Completed')}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Mark Completed
              </button>
              <button
                type="button"
                onClick={() => setIsBulkCancelModalOpen(true)}
                className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Mark Cancelled
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

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs sm:text-sm">
            <colgroup>
              <col className="w-12" />
              <col className="w-36" />
              <col className="w-auto" />
              <col className="w-56" />
              <col className="w-52" />
              <col className="w-44" />
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
                <th className="py-4 px-4 text-center whitespace-nowrap">
                  CONTROL ACTIONS
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    <p className="font-bold text-stone-700">No orders match your criteria</p>
                    <p className="text-xs text-stone-400 mt-1 font-mono">Try adjusting your search or filter settings</p>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  const isCodPending = order.paymentMethod === 'COD (Pending COD)';
                  const nextStatus = getNextStatus(order.status);

                  // Formatting items summary
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

                      {/* Customer & Order Items */}
                      <td className="py-4 px-4">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => setInspectingOrder(order)}
                            className="font-bold text-[#4a170a] hover:text-[#d01617] hover:underline transition-colors text-left cursor-pointer flex items-center gap-1.5 truncate max-w-sm"
                            title={`Inspect order for ${order.customerName}`}
                          >
                            <span className="truncate">{order.customerName}</span>
                          </button>
                          <p className="text-[11px] text-stone-500 truncate max-w-xs sm:max-w-sm mt-0.5 font-mono">
                            {order.customerPhone} • {itemsSummary}
                          </p>
                        </div>
                      </td>

                      {/* Fulfillment Type */}
                      <td className="py-4 px-4 whitespace-nowrap">
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
                      </td>

                      {/* Total & Payment (Matching Base Price & Status pill style from Products) */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-extrabold text-[#4a170a]">
                            ₱{order.totalAmount.toLocaleString()}.00
                          </div>
                          <div>
                            {(() => {
                              const isPaid = order.paymentMethod.includes('Paid');
                              const isGcash = order.paymentMethod === 'GCash (Paid)';
                              const isMaya = order.paymentMethod === 'PayMaya (Paid)';
                              const isQrPh = order.paymentMethod === 'QR Ph (Paid)';
                              const isCard = order.paymentMethod === 'Card (Paid)';
                              const isCodSettled = order.paymentMethod === 'COD (Paid)';

                              let badgeText = order.paymentMethod;
                              if (isGcash) badgeText = 'GCash Paid';
                              else if (isMaya) badgeText = 'Maya Paid';
                              else if (isQrPh) badgeText = 'QR Ph Paid';
                              else if (isCard) badgeText = 'Card Paid';
                              else if (isCodSettled) badgeText = 'COD Settled';
                              else if (isCodPending) badgeText = 'Pending COD';

                              return (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    isPaid ? 'bg-emerald-600' : 'bg-amber-600'
                                  }`} />
                                  {badgeText}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* Control Actions (Row of icon buttons matching Menu & Products) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* 1. Quick View / Inspect Details */}
                          <button
                            type="button"
                            onClick={() => setInspectingOrder(order)}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-stone-800 bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Inspect Order Ticket"
                            aria-label="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Confirm Cash / Settle Payment Toggle Button */}
                          {order.paymentMethod.includes('Paid') && !order.paymentMethod.includes('COD') ? (
                            <div 
                              className="w-8 h-8 rounded-xl border border-stone-200/50 bg-stone-50 text-emerald-700 flex items-center justify-center shadow-2xs"
                              title={`${order.paymentMethod} Verified via PayMongo`}
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

                          {/* 4. Status Selector Dropdown */}
                          <div className="relative">
                            <select
                              value={normalizeOrderStatus(order.status)}
                              onChange={(e) => {
                                const targetStatus = e.target.value as OrderStatus;
                                if (targetStatus === 'Cancelled') {
                                  setOrderToCancel(order);
                                } else {
                                  onUpdateOrderStatus(order.id, targetStatus);
                                }
                              }}
                              className={`h-8 pl-2.5 pr-6 rounded-xl text-xs font-mono font-bold border appearance-none cursor-pointer focus:outline-none transition-colors shadow-2xs ${getOrderStatusBadgeClass(
                                order.status
                              )}`}
                              title="Change status"
                            >
                              <option value="New" className="bg-white text-blue-800">New</option>
                              <option value="Completed" className="bg-white text-emerald-800">Completed</option>
                              <option value="Cancelled" className="bg-white text-red-700">Cancelled</option>
                            </select>
                            <ChevronDown className="w-3 h-3 text-stone-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* Table Footer with Pagination (Matching Products View) */}
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

      {/* Inspect Order Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-stone-800/10 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-[#4a170a] px-5 sm:px-6 py-4 flex items-center justify-between text-white border-b border-[#381005]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#4a170a] flex items-center justify-center font-bold">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-amber-50">
                    Order {inspectingOrder.orderNumber}
                  </h3>
                  <p className="text-[11px] text-amber-200/70 font-mono">
                    Placed on {inspectingOrder.createdAt}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="p-1.5 text-amber-200/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-4 bg-[#fffdfa] text-sm">
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
                <div className="font-bold text-[#4a170a] flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-400" />
                  <span>{inspectingOrder.customerName}</span>
                </div>
                <div className="text-xs text-stone-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{inspectingOrder.customerPhone}</span>
                </div>
                {inspectingOrder.address && (
                  <div className="text-xs text-stone-600 flex items-start gap-2 pt-1 border-t border-stone-100">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                    <span>
                      {typeof inspectingOrder.address === 'string'
                        ? inspectingOrder.address
                        : `${inspectingOrder.address.street}${inspectingOrder.address.apartment ? `, ${inspectingOrder.address.apartment}` : ''}, ${inspectingOrder.address.barangay}, ${inspectingOrder.address.city}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Ordered Items
                </div>
                <div className="divide-y divide-stone-100">
                  {inspectingOrder.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#4a170a]">{item.quantity}x</span>{' '}
                        <span className="text-stone-800">{item.name}</span>
                        {item.boxSize && (
                          <span className="ml-1.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                            {item.boxSize}
                          </span>
                        )}
                      </div>
                      <div className="font-mono font-bold text-[#4a170a]">
                        ₱{(item.price * item.quantity).toLocaleString()}.00
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-stone-200 flex items-center justify-between font-extrabold text-sm text-[#4a170a]">
                  <span>Total Amount</span>
                  <span className="text-[#d01617]">₱{inspectingOrder.totalAmount.toLocaleString()}.00</span>
                </div>
              </div>

              {/* Payment & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-500 font-mono text-[10px] block uppercase">Payment Method</span>
                  <span className="font-bold text-[#4a170a] mt-0.5 block">{inspectingOrder.paymentMethod}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <span className="text-stone-500 font-mono text-[10px] block uppercase">Kitchen Status</span>
                  <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[11px] font-mono font-bold uppercase border ${getOrderStatusBadgeClass(
                    inspectingOrder.status
                  )}`}>
                    {normalizeOrderStatus(inspectingOrder.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="px-5 py-2 rounded-xl bg-[#4a170a] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#381005] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Confirmation Modal: Single Order Cancellation */}
      {orderToCancel && (
        <AdminConfirmationModal
          isOpen={!!orderToCancel}
          portalName="KITCHEN ORDERS DISPATCH"
          title="CANCEL & ARCHIVE ORDER"
          message={
            <p>
              Are you sure you want to cancel order <strong className="font-mono font-bold text-[#4a170a]">{orderToCancel.orderNumber}</strong> for <strong className="font-bold text-stone-800">{orderToCancel.customerName}</strong> (₱{orderToCancel.totalAmount.toLocaleString()}.00)? This order will be moved to <strong>CANCELLED</strong> status.
            </p>
          }
          cancelText="CANCEL"
          confirmText="YES, CANCEL ORDER"
          confirmVariant="danger"
          onClose={() => setOrderToCancel(null)}
          onConfirm={() => {
            onUpdateOrderStatus(orderToCancel.id, 'Cancelled');
            setOrderToCancel(null);
          }}
        />
      )}

      {/* Confirmation Modal: Bulk Order Cancellation */}
      {isBulkCancelModalOpen && (
        <AdminConfirmationModal
          isOpen={isBulkCancelModalOpen}
          portalName="KITCHEN ORDERS DISPATCH"
          title="CANCEL SELECTED ORDERS"
          message={
            <p>
              Are you sure you want to mark <strong className="font-mono font-bold text-[#4a170a]">{selectedOrderIds.length}</strong> selected orders as <strong>CANCELLED</strong>?
            </p>
          }
          cancelText="CANCEL"
          confirmText={`YES, CANCEL ${selectedOrderIds.length} ORDERS`}
          confirmVariant="danger"
          onClose={() => setIsBulkCancelModalOpen(false)}
          onConfirm={() => {
            handleBulkStatusUpdate('Cancelled');
            setIsBulkCancelModalOpen(false);
          }}
        />
      )}

    </div>
  );
};
