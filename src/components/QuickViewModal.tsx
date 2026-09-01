import React, { useState } from 'react';
import { Product } from '../types';
import { X, Star, ShoppingBag, Check, ShieldAlert } from 'lucide-react';
import { getBundleDetails } from '../utils/bundlePricing';
import { getOptimizedImageUrl } from '../lib/imageOptimization';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, variant?: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  if (!product) return null;

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);

  const basePrice = product.basePrice || product.price;
  const bundleInfo = getBundleDetails(basePrice, selectedVariant);
  const variantOptions = product.variants && product.variants.length > 0
    ? product.variants
    : ['Box of 10', 'Box of 15', 'Box of 20'];

  const handleAdd = () => {
    onAddToCart(product, quantity, selectedVariant);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  const totalPrice = bundleInfo.bundlePrice * quantity;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-amber-100 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-[#4a170a] flex items-center justify-center shadow-md transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Product Image */}
          <div className="relative aspect-square md:aspect-auto bg-amber-50">
            <img
              src={getOptimizedImageUrl(product.image, { width: 700, quality: 80 })}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4 min-w-0">
            <div className="min-w-0">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#d94d2f] font-bold uppercase tracking-wider">{product.category}</span>
                <div className="flex items-center gap-1 text-amber-700 font-semibold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{product.rating}</span>
                  <span className="text-gray-400">({product.reviewsCount})</span>
                </div>
              </div>

              <h3 className="font-serif text-2xl font-extrabold text-[#4a170a] leading-tight break-words [overflow-wrap:anywhere]">
                {product.name}
              </h3>

              <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                <span className="text-2xl font-bold text-[#d01617]">
                  ₱{bundleInfo.bundlePrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <p className="text-gray-600 text-xs sm:text-sm mt-3 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line line-clamp-3">
                {product.description}
              </p>

              {/* Box Bundles Selector */}
              <div className="mt-4 pt-3 border-t border-amber-100 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4a170a] block">
                  Package Options:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVariant(undefined)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      !selectedVariant
                        ? 'border-[#4a170a] bg-[#4a170a] text-white'
                        : 'border-amber-200 bg-amber-50/50 text-[#4a170a] hover:bg-amber-100/50'
                    }`}
                  >
                    Single Piece
                  </button>
                  {variantOptions.map((v) => {
                    const isSel = selectedVariant === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSelectedVariant((prev) => (prev === v ? undefined : v))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSel
                            ? 'border-[#4a170a] bg-[#4a170a] text-white'
                            : 'border-amber-200 bg-amber-50/50 text-[#4a170a] hover:bg-amber-100/50'
                        }`}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allergens */}
              {product.allergens && (
                <div className="mt-3 pt-2 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-900 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#d94d2f]" />
                  <span className="truncate">Allergens: {product.allergens.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            <div className="pt-3 border-t border-amber-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4a170a]">Quantity:</span>
                <div className="flex items-center justify-between border-2 border-[#542515] rounded-xl px-2 py-0.5 min-w-[120px] shadow-[0px_3px_0px_#542515] bg-transparent">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center font-bold text-[#552110] hover:text-[#d01617] text-base cursor-pointer transition-colors"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-6 text-center text-[#552110]">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center font-bold text-[#552110] hover:text-[#d01617] text-base cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAdd}
                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  added ? 'bg-emerald-600 text-white' : 'bg-[#d01617] hover:bg-[#b01011] text-white'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 text-amber-100" />
                    <span>Add {quantity} to Cart • ₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
