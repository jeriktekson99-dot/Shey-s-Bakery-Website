import React, { useState } from 'react';
import { Product } from '../types';
import { Check } from 'lucide-react';
import { getOptimizedImageUrl } from '../lib/imageOptimization';

interface WhatsNewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onViewAllProducts?: () => void;
}

export const WhatsNew: React.FC<WhatsNewProps> = ({ products, onSelectProduct, onQuickView, onViewAllProducts }) => {
  const handleProductClick = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else if (onQuickView) {
      onQuickView(product);
    }
  };

  const featuredProducts = products.slice(0, 8);

  return (
    <section id="whats-new" className="py-12 sm:py-16 bg-[#faf5ea]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#4a170a] tracking-tight">
            What's New at Shey's
          </h2>
        </div>

        {/* Responsive Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {featuredProducts.map((product) => {
            const isSoldOut = product.inStock === false || product.availability === 'Sold Out';

            return (
              <div
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="group flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1"
              >
                {/* 1. Picture with rounded corners, distinct dark brown border, and 3D sprung solid bottom shadow */}
                <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] relative shadow-[0px_6px_0px_#542515] group-hover:shadow-[0px_8px_0px_#542515] transition-all duration-300">
                  <img
                    src={getOptimizedImageUrl(product.image, { width: 500, quality: 75 })}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover object-center transition-transform duration-500 ${
                      isSoldOut
                        ? 'grayscale-[30%] opacity-85'
                        : 'group-hover:scale-105'
                    }`}
                    loading="lazy"
                  />
                  {isSoldOut && (
                    <div className="absolute top-3 left-3 bg-[#4a170a]/90 backdrop-blur-xs text-amber-100 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-300/30">
                      Sold Out
                    </div>
                  )}
                </div>

                {/* 2. Title of the food with fixed 2-line height for uniform vertical alignment */}
                <h3 className="font-serif font-bold text-lg sm:text-xl text-[#552110] group-hover:text-[#d01617] transition-colors line-clamp-2 leading-snug mt-3.5 h-[3.25rem] flex items-start break-words [overflow-wrap:anywhere]">
                  {product.name}
                </h3>

                {/* 3. Price in PHP */}
                <div className="mt-1.5 flex items-baseline gap-2">
                  <span className="font-serif sm:font-sans font-medium text-base sm:text-lg text-[#6e3923]">
                    ₱{product.price.toFixed(2)} PHP
                  </span>
                </div>

                {/* 4. Add to cart button (leads to Product Details) */}
                {isSoldOut ? (
                  <button
                    type="button"
                    disabled
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 w-full py-2.5 sm:py-3 px-6 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400 font-medium text-sm sm:text-base tracking-wide cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <span>Sold Out</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                    className="mt-4 w-full py-2.5 sm:py-3 px-6 rounded-full border-2 border-[#3d1408] font-medium text-sm sm:text-base tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 bg-[#fbf7ed] hover:bg-[#3d1408] text-[#3d1408] hover:text-[#fbf7ed]"
                  >
                    <span>Add to cart</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* View All Hyperlink CTA */}
        {onViewAllProducts && (
          <div className="mt-12 text-center">
            <button
              onClick={onViewAllProducts}
              className="inline-flex items-center text-[#d94d2f] opacity-70 hover:opacity-100 font-semibold text-base transition-opacity cursor-pointer"
            >
              <span className="underline decoration-[#d94d2f] underline-offset-4 decoration-1">
                View All
              </span>
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

