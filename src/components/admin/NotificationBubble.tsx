import React from 'react';
import { 
  ShoppingBag, 
  ArrowRight, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Store, 
  Truck 
} from 'lucide-react';
import { AdminOrder, AdminViewTab } from './types';

interface NotificationBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  newOrders: AdminOrder[];
  onSelectOrder: (orderId: string) => void;
  onNavigateTab: (tab: AdminViewTab) => void;
}

export const NotificationBubble: React.FC<NotificationBubbleProps> = ({
  isOpen,
  onClose,
  newOrders,
  onSelectOrder,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for closing when clicking outside */}
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bubble Widget Container */}
      <div 
        className="absolute -right-2.5 top-full mt-2 w-84 sm:w-96 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-right shadow-2xl rounded-2xl border border-stone-800/20 overflow-visible"
        id="admin-notification-bubble-widget"
        role="dialog"
        aria-label="New Live Orders"
      >
        {/* Top Speech Bubble Pointer Arrow */}
        <div 
          className="absolute -top-1.5 right-[21px] w-3.5 h-3.5 bg-[#381207] rotate-45 border-t border-l border-stone-800/40 z-20"
          aria-hidden="true"
        />

        {/* Outer Card Wrapper */}
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-xl border border-stone-200">
          
          {/* Header */}
          <div className="bg-[#381207] text-white px-5 py-4 relative select-none">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono tracking-widest text-[#e8b595] uppercase font-bold leading-none">
                  Order Management
                </p>
                <h3 className="text-sm font-black tracking-wide text-white uppercase mt-1 flex items-center gap-2 leading-none">
                  <span>New Live Orders</span>
                  {newOrders.length > 0 && (
                    <span className="bg-[#d94d2f] text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                      {newOrders.length}
                    </span>
                  )}
                </h3>
              </div>

              {newOrders.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab('orders');
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider uppercase text-amber-200 hover:text-white hover:underline transition-colors cursor-pointer group bg-transparent border-0 p-0 focus:outline-none shrink-0"
                  id="btn-view-all-live-orders"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Warm Orange / Red Accent Divider */}
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#d01617] via-[#d94d2f] to-[#f4a261]" />
          </div>

          {/* Main Content Area */}
          <div className="bg-[#faf8f5] min-h-[160px] max-h-[380px] overflow-y-auto">
            {newOrders.length === 0 ? (
              /* No New Orders - Empty State */
              <div className="flex flex-col items-center justify-center text-center p-8 py-10 space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-stone-300 flex items-center justify-center text-stone-400 bg-white shadow-2xs">
                  <CheckCircle2 className="w-6 h-6 stroke-[1.75] text-stone-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-700">
                    No New Live Orders
                  </h4>
                  <p className="text-[11px] font-mono tracking-wider text-stone-400 uppercase mt-1">
                    All incoming orders are up to date
                  </p>
                </div>
              </div>
            ) : (
              /* New Orders List */
              <div className="divide-y divide-stone-200/80">
                {newOrders.map((order) => {
                  const isDelivery = order.type === 'Doorstep Delivery' || order.type === 'Delivery';
                  const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
                  const firstItemName = order.items[0]?.name || 'Bakery Items';
                  const moreItemsCount = order.items.length - 1;
                  const rawNum = order.orderNumber || order.id;
                  const formattedOrderNum = rawNum.startsWith('#') ? rawNum : `#${rawNum}`;

                  return (
                    <div
                      key={order.id}
                      onClick={() => {
                        onSelectOrder(order.id);
                        onClose();
                      }}
                      className="p-3.5 px-4 transition-colors relative group cursor-pointer bg-[#fbf6f0] hover:bg-[#f3eae0] flex items-start gap-3 border-l-[3px] border-l-[#d94d2f]"
                    >
                      {/* Left Indicator Circle */}
                      <div className="self-center shrink-0 flex items-center justify-center w-4">
                        <span 
                          className="w-2.5 h-2.5 rounded-full bg-[#d94d2f] ring-4 ring-[#d94d2f]/20 block shadow-2xs group-hover:scale-110 transition-transform" 
                          title="New Order" 
                          aria-label="New order indicator"
                        />
                      </div>

                      {/* Main Notification Details */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#4a170a]">
                              {formattedOrderNum}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-300">
                              NEW
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#d01617] font-mono">
                            ₱{order.totalAmount.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-bold text-stone-800 truncate">
                            {order.customerName}
                          </p>
                          <p className="text-[11px] text-stone-600 truncate mt-0.5">
                            {firstItemName}
                            {moreItemsCount > 0 ? ` +${moreItemsCount} more` : ''} ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-1 border-t border-stone-200/60">
                          <span className="flex items-center gap-1 text-stone-600">
                            {isDelivery ? (
                              <>
                                <Truck className="w-3 h-3 text-[#d94d2f]" />
                                <span>Delivery</span>
                              </>
                            ) : (
                              <>
                                <Store className="w-3 h-3 text-amber-700" />
                                <span>Store Pickup</span>
                              </>
                            )}
                          </span>

                          <span className="text-stone-400">
                            {order.targetDate || order.deliveryDate || order.createdAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-2.5 bg-stone-100/90 border-t border-stone-200 flex items-center justify-between">
            <span className="text-[11px] text-stone-500 font-mono font-medium">
              {newOrders.length} {newOrders.length === 1 ? 'new live order' : 'new live orders'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono font-bold tracking-wider text-stone-600 hover:text-[#4a170a] uppercase transition-colors cursor-pointer"
              id="btn-close-notification-bubble"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
