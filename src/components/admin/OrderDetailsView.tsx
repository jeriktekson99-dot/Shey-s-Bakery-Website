import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  ChevronDown, 
  Trash2, 
  FileText
} from 'lucide-react';
import { AdminOrder, OrderStatus, PaymentStatus, getOrderStatusBadgeClass, normalizeOrderStatus } from './types';
import { AdminConfirmationModal } from './AdminConfirmationModal';

interface OrderDetailsViewProps {
  order: AdminOrder;
  onBack: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: OrderStatus) => void;
  onUpdatePaymentStatus?: (orderId: string, newPaymentStatus: PaymentStatus) => void;
  onConfirmCashReceived: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({
  order,
  onBack,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onConfirmCashReceived,
  onDeleteOrder
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const isCodPending = order.paymentMethod === 'COD (Pending COD)';
  const currentStatus = normalizeOrderStatus(order.status);

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (onDeleteOrder) {
      onDeleteOrder(order.id);
    }
    setIsDeleteModalOpen(false);
    onBack();
  };

  const orderDocketReference = `SPEC-ORD-${order.orderNumber.replace(/[^0-9]/g, '') || '8921'}-04`;

  return (
    <div className="space-y-6" id="admin-order-detail-page">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER BAR (Encased Card matching Reference)     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left Side: Back Arrow Button + Order Title + Status Badge */}
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            id="order-details-back-btn"
            className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Return to Live Orders"
          >
            <ArrowLeft className="w-4 h-4 text-[#4a170a]" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-base sm:text-lg font-black text-[#4a170a] tracking-tight uppercase">
                ORDER: {order.orderNumber}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-mono font-bold tracking-wider uppercase border shadow-2xs ${getOrderStatusBadgeClass(
                  currentStatus
                )}`}
              >
                ● {currentStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase mt-0.5">
              REFERENCE: {orderDocketReference} • FULFILLMENT: {order.type.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Right Side: Delete Record, Quick Status Dropdown & Print Ticket */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          
          {/* Delete Record Button (Matching reference UI) */}
          <button
            type="button"
            onClick={handleDelete}
            id="order-details-delete-record-btn"
            className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Delete / Archive this order record"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>DELETE RECORD</span>
          </button>

          {/* Quick Status Selector */}
          <div className="relative inline-flex items-center">
            <select
              value={currentStatus}
              onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as OrderStatus)}
              id="order-details-status-select"
              className={`pl-3 pr-7 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase border focus:outline-none cursor-pointer appearance-none shadow-2xs transition-colors ${getOrderStatusBadgeClass(
                currentStatus
              )}`}
            >
              <option value="New" className="bg-white text-blue-800">New</option>
              <option value="Completed" className="bg-white text-emerald-800">Completed</option>
              <option value="Cancelled" className="bg-white text-red-700">Cancelled</option>
            </select>
            <ChevronDown className="w-3 h-3 text-stone-600 absolute right-2 pointer-events-none" />
          </div>

          {/* Payment Settlement Method */}
          <div className="relative inline-flex items-center">
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
              id="order-details-payment-method-select"
              className={`pl-3 pr-7 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase border focus:outline-none cursor-pointer appearance-none shadow-2xs transition-colors ${
                order.paymentMethod === 'GCash (Paid)' || order.paymentMethod === 'COD (Paid)'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-900 border-amber-300'
              }`}
              title="Payment Settlement Method"
            >
              <option value="GCash (Paid)" className="bg-white text-emerald-800">GCash (Paid)</option>
              <option value="COD (Pending COD)" className="bg-white text-amber-900">COD (Pending COD)</option>
              <option value="COD (Paid)" className="bg-white text-emerald-800">COD (Paid)</option>
            </select>
            <ChevronDown className="w-3 h-3 text-stone-600 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN BENTO GRID (Left 8 Cols, Right 4 Cols)           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ====================================================== */}
        {/* LEFT COLUMN: 8 Columns (Scope & Items Table)           */}
        {/* ====================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CARD: Project Scope & Narrative (Itemized Table & Notes) */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-5">
            
            {/* Header with Monospace Subtitle */}
            <div className="pb-3.5 border-b border-stone-100">
              <h2 className="text-xs font-mono font-bold text-[#4a170a] tracking-wider uppercase">
                ORDER ITEMS & SPECIFICATIONS
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase mt-0.5">
                ITEMIZED ORDER BREAKDOWN & CUSTOM DEDICATION INSTRUCTIONS
              </p>
            </div>

            {/* Itemized Table of Ordered Items */}
            <div>
              <div className="rounded-xl border border-stone-200 overflow-hidden">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#faf8f5] border-b border-stone-200 text-stone-500 font-mono font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Item & Variant</th>
                      <th className="py-3 px-3 text-center">Packaging Box</th>
                      <th className="py-3 px-3 text-center">Qty</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-800">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-bold text-[#4a170a] text-xs sm:text-sm">{item.name}</div>
                          {item.variant && (
                            <div className="text-[11px] text-stone-500 mt-0.5 font-medium">{item.variant}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 align-middle text-center">
                          {item.boxSize ? (
                            <span className="bg-amber-50 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1 shadow-2xs">
                              <span>📦</span>
                              <span>{item.boxSize}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded-md">
                              Single Item
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 align-middle text-center font-bold text-[#4a170a]">
                          <span className="inline-block w-6 h-6 rounded-md bg-[#4a170a] text-amber-100 leading-6 text-[11px] font-mono font-bold text-center">
                            {item.quantity}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 align-middle text-right font-mono text-stone-600 font-semibold text-xs">
                          ₱{item.price.toLocaleString()}.00
                        </td>

                        <td className="py-3.5 px-4 align-middle text-right font-mono font-black text-[#4a170a] text-xs sm:text-sm">
                          ₱{(item.price * item.quantity).toLocaleString()}.00
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#faf8f5] border-t border-stone-200">
                    <tr>
                      <td colSpan={4} className="py-3.5 px-4 text-right font-mono font-bold text-stone-500 uppercase tracking-wider text-xs">
                        TOTAL ORDER VALUE:
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-base text-[#d01617]">
                        ₱{order.totalAmount.toLocaleString()}.00
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Customer Dedication Callout Box */}
            {order.customCakeNotes && (
              <div className="bg-[#faf6f0] border border-amber-200 rounded-xl p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#4a170a] font-mono font-bold text-[11px] uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>Customer Dedication & Plaque Inscription</span>
                </div>
                <p className="text-xs sm:text-sm text-[#4a170a] font-medium leading-relaxed italic bg-white/80 p-3 rounded-lg border border-amber-100">
                  "{order.customCakeNotes}"
                </p>
              </div>
            )}

          </div>

        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: 4 Columns (Profile + Tech Specs)         */}
        {/* ====================================================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CARD 3: Project & Client Profile */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
            
            {/* Header with Monospace Subtitle */}
            <div className="pb-3.5 border-b border-stone-100">
              <h2 className="text-xs font-mono font-bold text-[#4a170a] tracking-wider uppercase">
                PROJECT & CLIENT PROFILE
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase mt-0.5">
                CLIENT DETAILS & FULFILLMENT SEGMENT
              </p>
            </div>

            {/* Key-Value Pair 1: Client Name */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                CLIENT NAME
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#4a170a] mt-0.5">
                {order.customerName}
              </p>
            </div>

            {/* Key-Value Pair 2: Property Segment / Order Type */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                PROPERTY SEGMENT / ORDER TYPE
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#4a170a] mt-0.5">
                {order.type === 'Doorstep Delivery' ? 'Doorstep Delivery' : 'Store Pickup Hub'}
              </p>
            </div>

            {/* Key-Value Pair 3: Bakery Kitchen & Origin (Delivery Address or None/Pickup) */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                BAKERY KITCHEN & ORIGIN
              </span>
              {(order.type === 'Doorstep Delivery' || order.type === 'Delivery') ? (
                order.address ? (
                  <p className="text-xs text-[#4a170a] font-bold mt-0.5 leading-relaxed">
                    {[order.address.street, order.address.barangay, order.address.city, order.address.region].filter(Boolean).join(', ')}
                  </p>
                ) : (
                  <p className="text-xs text-[#4a170a] font-bold mt-0.5">
                    Delivery Address Pending
                  </p>
                )
              ) : (
                <p className="text-xs text-[#4a170a] font-bold mt-0.5">
                  None/Pickup
                </p>
              )}
            </div>

            {/* Key-Value Pair 4: Case Study Reference / Docket ID */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                CASE STUDY REFERENCE
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-stone-700 mt-0.5">
                {orderDocketReference}
              </p>
            </div>

            {/* Key-Value Pair 5: Contact Number */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                CONTACT NUMBER
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-[#4a170a] mt-0.5">
                {order.customerPhone}
              </p>
            </div>

            {/* Key-Value Pair 6: Schedule / Dispatch Period */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                SCHEDULE / DISPATCH PERIOD
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#4a170a] mt-0.5">
                {order.deliveryDate ? (
                  order.deliveryDate.includes(' • ') 
                    ? order.deliveryDate.split(' • ')[0]
                    : order.deliveryDate.includes(', ') && /PM|AM|Window|Dispatch|Pickup/i.test(order.deliveryDate.split(', ')[1])
                      ? order.deliveryDate.split(', ')[0]
                      : order.deliveryDate
                ) : (order.targetDate || 'Scheduled')}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Confirmation Modal: Delete / Archive Order */}
      {isDeleteModalOpen && (
        <AdminConfirmationModal
          isOpen={isDeleteModalOpen}
          portalName="KITCHEN ORDERS DISPATCH"
          title="CANCEL & ARCHIVE ORDER"
          message={
            <p>
              Are you sure you want to cancel and archive order <strong className="font-mono font-bold text-[#4a170a]">{order.orderNumber}</strong> for <strong className="font-bold text-stone-800">{order.customerName}</strong> (₱{order.totalAmount.toLocaleString()}.00)? This order will be moved to the <strong>ARCHIVE VAULT</strong>.
            </p>
          }
          cancelText="CANCEL"
          confirmText="YES, ARCHIVE ORDER"
          confirmVariant="danger"
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

    </div>
  );
};
