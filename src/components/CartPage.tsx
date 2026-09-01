import React, { useState } from 'react';
import { Trash2, Calendar, Tag } from 'lucide-react';
import { Product, CartItem } from '../types';
import { isBundleVariant } from '../utils/bundlePricing';
import { getOptimizedImageUrl } from '../lib/imageOptimization';

interface CartPageProps {
  cartItems: CartItem[];
  allProducts: Product[];
  onUpdateQuantity: (productId: string, delta: number, notes?: string) => void;
  onRemoveItem: (productId: string, notes?: string) => void;
  onClearCart: () => void;
  onNavigateHome: () => void;
  onNavigateCatalog: (category?: string) => void;
  onSelectProduct: (product: Product) => void;
  onProceedToCheckout: (orderNotes?: string, selectedDate?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cartItems,
  allProducts,
  onUpdateQuantity,
  onRemoveItem,
  onNavigateCatalog,
  onSelectProduct,
  onProceedToCheckout,
}) => {
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  
  // Default to tomorrow's date formatted as YYYY-MM-DD for convenience
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTomorrowDate());
  const [hasAttemptedCheckout, setHasAttemptedCheckout] = useState<boolean>(false);

  // Subtotal calculation
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const totalSavings = cartItems.reduce(
    (sum, item) => sum + ((item.savings || 0) * item.quantity),
    0
  );

  // 4 Featured products for the bottom section
  const featuredProducts = allProducts.slice(0, 4);

  const handleCheckoutClick = () => {
    setHasAttemptedCheckout(true);
    if (!selectedDate) {
      return;
    }
    onProceedToCheckout(specialInstructions, selectedDate);
  };

  const isCartEmpty = cartItems.length === 0;

  return (
    <div className="bg-[#faf5ea] min-h-screen text-[#552110] py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================= */}
        {/* STATE 1: EMPTY CART                                      */}
        {/* ========================================================= */}
        {isCartEmpty ? (
          <div className="w-full flex flex-col items-center justify-center text-center py-12 sm:py-20">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#552110] mb-6 text-center">
              Your cart is empty
            </h1>

            <button
              onClick={() => onNavigateCatalog('All Products')}
              className="inline-flex items-center justify-center bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold text-sm sm:text-base px-8 py-3 rounded-full border border-[#542515] shadow-[0px_2px_0px_#542515] transition-all duration-200 cursor-pointer active:translate-y-0.5 active:shadow-none"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          /* ========================================================= */
          /* STATE 2: CART WITH ITEMS                                 */
          /* ========================================================= */
          <div className="max-w-5xl mx-auto">
            {/* Header with Title and Continue Shopping */}
            <div className="flex items-baseline justify-between pb-4 mb-6">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#552110]">
                Your cart
              </h1>
              <button
                onClick={() => onNavigateCatalog('All Products')}
                className="text-sm font-medium text-[#552110] underline hover:text-[#d94d2f] transition-colors cursor-pointer"
              >
                Continue shopping
              </button>
            </div>

            {/* Table Column Headers */}
            <div className="hidden sm:grid grid-cols-12 text-xs font-semibold text-[#8b634b] uppercase tracking-wider pb-3 border-b border-[#ebdcd0]">
              <div className="col-span-6">Product</div>
              <div className="col-span-3 text-center">Quantity</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 border-b border-[#ebdcd0] pb-6">
              {cartItems.map((item, index) => {
                const lineTotal = item.product.price * item.quantity;
                const isBundle = item.variant ? isBundleVariant(item.variant) : (item.notes ? isBundleVariant(item.notes) : false);

                return (
                  <div
                    key={`${item.product.id}-${item.notes || 'standard'}-${index}`}
                    className={`grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pb-4 ${
                      index === 0 ? 'pt-6' : 'pt-4'
                    }`}
                  >
                    {/* Product Info (Col 1-6) */}
                    <div className="sm:col-span-6 flex items-center gap-4 min-w-0">
                      {/* Image with dark brown border and rounded frame */}
                      <div
                        onClick={() => onSelectProduct(item.product)}
                        className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] shadow-[0px_3px_0px_#542515] cursor-pointer"
                      >
                        <img
                          src={getOptimizedImageUrl(item.product.image, { width: 200, quality: 75 })}
                          alt={item.product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Title, Variant & Unit Price */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <h3
                          onClick={() => onSelectProduct(item.product)}
                          className="font-serif text-base sm:text-lg font-bold text-[#552110] hover:text-[#d94d2f] transition-colors cursor-pointer leading-snug break-words [overflow-wrap:anywhere]"
                        >
                          {item.product.name}
                        </h3>
                        {item.notes && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-[#8b634b] font-medium break-words [overflow-wrap:anywhere]">
                              {item.notes}
                            </span>
                            {isBundle && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold uppercase bg-[#d94d2f] text-white px-2 py-0.5 rounded">
                                <Tag className="w-2.5 h-2.5" />
                                10% Bundle Discount
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-baseline gap-2">
                          <p className="text-sm font-bold text-[#552110]">
                            ₱{item.product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </p>
                          {item.rawPrice && item.rawPrice > item.product.price && (
                            <span className="text-xs text-[#8b634b]/60 line-through">
                              ₱{item.rawPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity Control & Delete (Col 7-9) */}
                    <div className="sm:col-span-3 flex items-center justify-between sm:justify-center gap-3">
                      <div className="inline-flex items-center justify-between border-2 border-[#542515] rounded-xl px-3 py-1 min-w-[120px] bg-transparent shadow-[0px_2px_0px_#542515]">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, -1, item.notes)}
                          className="w-6 h-6 flex items-center justify-center text-[#552110] hover:text-[#d01617] font-bold text-base cursor-pointer transition-colors"
                          aria-label="Decrease quantity"
                        >
                          –
                        </button>
                        <span className="text-sm font-bold text-[#552110] px-2 select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.product.id, 1, item.notes)}
                          className="w-6 h-6 flex items-center justify-center text-[#552110] hover:text-[#d01617] font-bold text-base cursor-pointer transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      {/* Trash Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.product.id, item.notes)}
                        className="p-1.5 text-[#8b634b] hover:text-[#d01617] transition-colors cursor-pointer"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Line Total (Col 10-12) */}
                    <div className="sm:col-span-3 text-right">
                      <span className="font-bold text-base sm:text-lg text-[#552110]">
                        ₱{lineTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Section: Special Instructions & Subtotal Checkout Area */}
            <div className="mt-8 pt-4 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Order Special Instructions */}
              <div className="md:col-span-6 space-y-2">
                <label
                  htmlFor="special-instructions"
                  className="block text-sm font-medium text-[#552110]"
                >
                  Order special instructions
                </label>
                <textarea
                  id="special-instructions"
                  rows={4}
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Special instructions for delivery or packaging..."
                  className="w-full border-2 border-[#542515] rounded-2xl p-3 bg-transparent text-[#552110] placeholder:text-[#9e7c65] text-sm focus:outline-none focus:ring-1 focus:ring-[#542515] shadow-[0px_3px_0px_#542515] resize-y"
                />
              </div>

              {/* Checkout Calculation & Date Selection */}
              <div className="md:col-span-6 flex flex-col items-end text-right space-y-2">
                {/* Subtotal */}
                <div className="flex items-baseline justify-end gap-3">
                  <span className="font-bold text-base sm:text-lg text-[#552110]">
                    Subtotal
                  </span>
                  <span className="font-bold text-xl sm:text-2xl text-[#552110]">
                    ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} PHP
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#16a34a] text-white text-[11px] sm:text-xs font-extrabold uppercase tracking-wide shadow-sm">
                    <Tag className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>YOU SAVED ₱{totalSavings.toLocaleString('en-PH', { minimumFractionDigits: 2 })} WITH BUNDLE DISCOUNTS!</span>
                  </div>
                )}

                <p className="text-xs text-[#8b634b]">
                  Taxes and shipping calculated at checkout
                </p>

                {/* Delivery Date Selection */}
                <div className="pt-2 flex items-center justify-end gap-2 text-xs font-semibold text-[#552110]">
                  <span>Select date:</span>
                  <div className="relative inline-flex items-center">
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-[#8b634b] bg-white rounded-md px-3 py-1.5 text-xs text-[#552110] font-medium shadow-xs focus:outline-none focus:ring-1 focus:ring-[#542515] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Validation Note if date empty */}
                {(!selectedDate || (hasAttemptedCheckout && !selectedDate)) && (
                  <p className="text-xs text-[#c02b2b] font-medium">
                    Make a selection to continue checkout.
                  </p>
                )}

                {/* Checkout Button */}
                <div className="pt-3 w-full sm:w-auto">
                  <button
                    onClick={handleCheckoutClick}
                    disabled={!selectedDate}
                    className="w-full sm:w-auto min-w-[200px] bg-[#d94d2f] hover:bg-[#c03d21] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base py-3 px-10 rounded-full border border-[#542515] shadow-[0px_2px_0px_#542515] transition-all duration-200 cursor-pointer active:translate-y-0.5 active:shadow-none"
                  >
                    Check out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* FEATURED ITEMS (Appears on both Empty & Filled states)    */}
        {/* ========================================================= */}
        <div className="max-w-5xl mx-auto pt-16 mt-16">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#552110] mb-8">
            Featured Items
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {featuredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => onSelectProduct(prod)}
                className="group flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1"
              >
                {/* 1. Picture with rounded corners, distinct dark brown border, and 3D sprung solid bottom shadow */}
                <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] relative shadow-[0px_6px_0px_#542515] group-hover:shadow-[0px_8px_0px_#542515] transition-all duration-300">
                  <img
                    src={getOptimizedImageUrl(prod.image, { width: 500, quality: 75 })}
                    alt={prod.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    loading="lazy"
                  />
                </div>

                {/* 2. Title of the food with fixed 2-line height for uniform alignment */}
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#552110] group-hover:text-[#d01617] transition-colors line-clamp-2 leading-snug mt-3.5 h-[3.25rem] flex items-start">
                  {prod.name}
                </h3>

                {/* 3. Price in PHP */}
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-serif sm:font-sans font-medium text-base sm:text-lg text-[#6e3923]">
                    ₱{prod.price.toFixed(2)} PHP
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-10">
            <button
              onClick={() => onNavigateCatalog('All Products')}
              className="inline-block bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold text-sm px-10 py-2.5 rounded-full border border-[#542515] shadow-[0px_2px_0px_#542515] transition-all duration-200 cursor-pointer active:translate-y-0.5 active:shadow-none"
            >
              View all
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
