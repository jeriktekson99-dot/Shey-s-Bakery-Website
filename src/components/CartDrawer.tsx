import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, CheckCircle, Truck, ShieldCheck, Tag } from 'lucide-react';
import { isBundleVariant } from '../utils/bundlePricing';
import { getOptimizedImageUrl } from '../lib/imageOptimization';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number, notes?: string) => void;
  onRemoveItem: (productId: string, notes?: string) => void;
  onClearCart: () => void;
  onProceedToCheckout?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
}) => {
  const [isCheckout, setIsCheckout] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'maya' | 'card' | 'cod'>('gcash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const freeDeliveryThreshold = 1000;
  const progressPercent = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);
  const deliveryFee = deliveryType === 'pickup' || subtotal >= freeDeliveryThreshold ? 0 : 100;
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (customerName && customerPhone) {
      setOrderComplete(true);
    }
  };

  const handleResetCheckout = () => {
    setOrderComplete(false);
    setIsCheckout(false);
    onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fadeIn"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between overflow-hidden animate-slideLeft">
          
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#4a170a] text-white flex items-center justify-between border-b border-amber-900/40">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-[#d94d2f]" />
              <h3 className="font-serif text-xl font-bold text-amber-50">Your Baked Goodies</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-amber-200/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Delivery Progress Bar */}
          {cartItems.length > 0 && !orderComplete && (
            <div className="bg-[#faf7f2] p-4 border-b border-amber-100">
              <div className="flex items-center justify-between text-xs font-semibold text-[#4a170a] mb-1.5">
                <span className="flex items-center gap-1">
                  <Truck className="w-4 h-4 text-[#d01617]" />
                  {amountToFreeDelivery === 0 ? (
                    <span className="text-emerald-700 font-bold">🎉 You unlocked FREE Delivery!</span>
                  ) : (
                    <span>Add ₱{amountToFreeDelivery.toLocaleString()} more for FREE Delivery!</span>
                  )}
                </span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full h-1 bg-amber-200/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#d01617] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {orderComplete ? (
              /* Order Success View */
              <div className="py-8 text-center space-y-4 animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h4 className="font-serif text-2xl font-bold text-[#4a170a]">Order Received!</h4>
                <p className="text-sm text-gray-600 max-w-xs mx-auto">
                  Thank you, <strong className="text-[#4a170a]">{customerName}</strong>! Your order has been dispatched to our bakery oven team.
                </p>
                <div className="bg-[#faf7f2] p-4 rounded-xl border border-amber-200/80 text-left text-xs space-y-2 text-[#4a170a]">
                  <p><strong>Order Ref:</strong> #SHEY-{Math.floor(100000 + Math.random() * 900000)}</p>
                  <p><strong>Option:</strong> {deliveryType === 'delivery' ? 'Express Delivery' : 'Store Pickup'}</p>
                  <p><strong>Payment Method:</strong> {paymentMethod.toUpperCase()}</p>
                  <p><strong>Total Paid:</strong> ₱{grandTotal.toLocaleString()}</p>
                </div>
                <button
                  onClick={handleResetCheckout}
                  className="w-full bg-[#d01617] hover:bg-[#b01011] text-white font-bold py-3 rounded-xl transition-colors shadow-md cursor-pointer mt-4"
                >
                  Back to Shey's Bakery
                </button>
              </div>
            ) : isCheckout ? (
              /* Checkout Form View */
              <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs text-[#4a170a]">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <h4 className="font-serif text-lg font-bold text-[#4a170a]">Checkout Details</h4>
                  <button
                    type="button"
                    onClick={() => setIsCheckout(false)}
                    className="text-xs text-[#d01617] font-semibold hover:underline"
                  >
                    ← Back to Cart
                  </button>
                </div>

                {/* Delivery or Pickup Toggle */}
                <div>
                  <label className="block font-bold mb-1">Option:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        deliveryType === 'delivery'
                          ? 'bg-[#4a170a] text-amber-50 border-[#4a170a]'
                          : 'bg-white border-amber-200 text-gray-700'
                      }`}
                    >
                      Express Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all ${
                        deliveryType === 'pickup'
                          ? 'bg-[#4a170a] text-amber-50 border-[#4a170a]'
                          : 'bg-white border-amber-200 text-gray-700'
                      }`}
                    >
                      Store Pickup
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-amber-200 focus:outline-none focus:border-[#d01617]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Mobile Number (for SMS updates) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0917 123 4567"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-amber-200 focus:outline-none focus:border-[#d01617]"
                  />
                </div>

                {deliveryType === 'delivery' && (
                  <div>
                    <label className="block font-bold mb-1">Delivery Address *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Street, Barangay, City, Landmark"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-amber-200 focus:outline-none focus:border-[#d01617]"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e: any) => setPaymentMethod(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-amber-200 focus:outline-none focus:border-[#d01617] bg-white font-medium"
                  >
                    <option value="gcash">GCash (Instant QR)</option>
                    <option value="maya">Maya / Online Banking</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="cod">Cash on Pickup / COD</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-amber-100 space-y-1 text-sm font-semibold">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₱{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Delivery Fee:</span>
                    <span>{deliveryFee === 0 ? 'FREE' : `₱${deliveryFee}`}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#4a170a] pt-1">
                    <span>Grand Total:</span>
                    <span className="text-[#d01617]">₱{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#d01617] hover:bg-[#b01011] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all cursor-pointer text-sm mt-2"
                >
                  Confirm & Pay ₱{grandTotal.toLocaleString()}
                </button>
              </form>
            ) : cartItems.length === 0 ? (
              /* Empty Cart View */
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-100 text-[#4a170a] rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8 text-[#d94d2f]" />
                </div>
                <h4 className="font-serif text-xl font-bold text-[#4a170a]">Your cart is empty</h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  Looks like you haven't added any fresh baked treats yet. Explore our delicious menu!
                </p>
                <button
                  onClick={onClose}
                  className="bg-[#d01617] hover:bg-[#b01011] text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              /* Cart Item List */
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const itemKey = item.id || `${item.product.id}-${item.notes || 'single'}`;
                  const isBundle = item.variant ? isBundleVariant(item.variant) : (item.notes ? isBundleVariant(item.notes) : false);

                  return (
                    <div
                      key={itemKey}
                      className="p-3 bg-[#faf7f2] rounded-2xl border border-amber-100/80 flex gap-3 items-center"
                    >
                      <img
                        src={getOptimizedImageUrl(item.product.image, { width: 150, quality: 75 })}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 object-cover rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#4a170a] truncate">{item.product.name}</h4>
                        
                        {item.notes && (
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            <span className="text-[11px] font-medium text-[#8b634b] truncate">
                              {item.notes}
                            </span>
                            {isBundle && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase bg-[#d94d2f] text-white px-1.5 py-0.2 rounded">
                                <Tag className="w-2 h-2" />
                                10% OFF
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <p className="text-xs font-bold text-[#d01617]">
                            ₱{item.product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </p>
                          {item.rawPrice && item.rawPrice > item.product.price && (
                            <span className="text-[10px] text-gray-400 line-through">
                              ₱{item.rawPrice.toFixed(0)}
                            </span>
                          )}
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, -1, item.notes)}
                            className="w-6 h-6 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-xs font-bold text-[#4a170a] hover:bg-amber-100 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold text-[#4a170a] min-w-4 text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.product.id, 1, item.notes)}
                            className="w-6 h-6 rounded-lg bg-white border border-amber-200 flex items-center justify-center text-xs font-bold text-[#4a170a] hover:bg-amber-100 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product.id, item.notes)}
                        className="text-gray-400 hover:text-[#d01617] p-1.5 transition-colors cursor-pointer"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Subtotal & Action */}
          {cartItems.length > 0 && !isCheckout && !orderComplete && (
            <div className="p-5 sm:p-6 bg-white border-t border-amber-100 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-serif text-xl font-extrabold text-[#4a170a]">
                  ₱{subtotal.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Taxes & delivery calculated at checkout.
              </p>
              <button
                onClick={() => {
                  if (onProceedToCheckout) {
                    onClose();
                    onProceedToCheckout();
                  } else {
                    setIsCheckout(true);
                  }
                }}
                className="w-full bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
