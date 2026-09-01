import React, { useState } from 'react';
import { Product } from '../types';
import { Search, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { getOptimizedImageUrl } from '../lib/imageOptimization';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = query.trim() === ''
    ? []
    : products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 px-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-amber-100">
        
        {/* Search Bar Input */}
        <div className="p-4 sm:p-6 bg-[#faf7f2] border-b border-amber-200/80 flex items-center gap-3">
          <Search className="w-6 h-6 text-[#d01617] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search sourdough, croissants, ensaymada, cakes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-base sm:text-lg font-medium text-[#4a170a] placeholder-gray-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-500 hover:text-[#4a170a] hover:bg-amber-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-2">
          {query.trim() === '' ? (
            <div className="py-6 text-center text-gray-500 text-sm">
              <p className="font-semibold text-[#4a170a] mb-2">Popular Searches:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Croissant', 'Sourdough', 'Ensaymada', 'Cheesecake', 'Focaccia'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="bg-amber-50 hover:bg-amber-100 text-[#4a170a] text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200 cursor-pointer transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              No baked items found matching "{query}". Try searching for sourdough or croissants!
            </div>
          ) : (
            <>
              <div className="px-1 pb-1">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[#9c745d]">
                  Products ({results.length})
                </span>
              </div>
              {results.map((product) => (
                <div
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="p-3 bg-white hover:bg-[#faf5ea] rounded-xl border border-[#ebdcd0] transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={getOptimizedImageUrl(product.image, { width: 150, quality: 75 })}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="w-13 h-13 object-cover rounded-lg shrink-0 border border-[#dbc7b5]/60"
                    />
                    <div className="min-w-0">
                      <h4 className="font-serif font-bold text-sm sm:text-base text-[#4a170a] group-hover:text-[#d01617] transition-colors truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs font-medium text-[#7d5641] mt-0.5">
                        ₱{product.price.toFixed(2)} PHP
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#4a170a] group-hover:text-[#d01617] group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                </div>
              ))}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
