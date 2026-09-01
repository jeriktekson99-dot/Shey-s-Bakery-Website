import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { getOptimizedImageUrl } from '../lib/imageOptimization';

interface SearchBarProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigateToCatalog?: (category?: string, searchQuery?: string) => void;
  onClose?: () => void;
  placeholder?: string;
  className?: string;
  idPrefix?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  products,
  onSelectProduct,
  onNavigateToCatalog,
  onClose,
  placeholder = '',
  className = '',
  idPrefix = 'header',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component mounts or autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Filter products based on query
  const trimmedQuery = query.trim().toLowerCase();
  const matchingProducts = trimmedQuery === ''
    ? []
    : products.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(trimmedQuery);
        const catMatch = p.category?.toLowerCase().includes(trimmedQuery);
        const descMatch = p.description?.toLowerCase().includes(trimmedQuery);
        const badgeMatch = p.badge?.toLowerCase().includes(trimmedQuery);
        const variantMatch = p.variants?.some(v => v.toLowerCase().includes(trimmedQuery));
        return nameMatch || catMatch || descMatch || badgeMatch || variantMatch;
      });

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleSearchAction = (searchQuery: string) => {
    if (onNavigateToCatalog) {
      onNavigateToCatalog('All Products', searchQuery);
    }
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      if (onClose) {
        onClose();
      }
      return;
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        if (trimmedQuery !== '') setIsOpen(true);
      }
      return;
    }

    const totalNavigableCount = matchingProducts.length + 1; // items + footer search row

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < totalNavigableCount - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalNavigableCount - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < matchingProducts.length) {
        handleProductClick(matchingProducts[selectedIndex]);
      } else if (selectedIndex === matchingProducts.length || matchingProducts.length === 0) {
        handleSearchAction(query.trim());
      } else if (matchingProducts.length > 0) {
        handleProductClick(matchingProducts[0]);
      }
    }
  };

  const handleProductClick = (product: Product) => {
    onSelectProduct(product);
    setIsOpen(false);
    setQuery('');
    if (onClose) {
      onClose();
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative flex items-center gap-3 sm:gap-4 ${className}`} id={`${idPrefix}-search-container`}>
      {/* Search Input Box with Structural Reference: Rounded Pill Container */}
      <div className="relative flex-1 bg-[#faf5ea] border-2 border-[#552110] rounded-full px-5 py-1.5 sm:py-2 transition-all shadow-xs focus-within:shadow-md flex items-center min-w-0">
        
        {/* Left side: Label + Input Field */}
        <div className="flex-1 flex flex-col justify-center min-w-0 pr-2">
          <label
            htmlFor={`${idPrefix}-search-input`}
            className="text-[10px] sm:text-[11px] font-semibold text-[#8a5d46] leading-none select-none"
          >
            Search
          </label>
          <input
            ref={inputRef}
            id={`${idPrefix}-search-input`}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (trimmedQuery !== '') setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent text-[#4a170a] text-sm sm:text-base font-semibold focus:outline-none placeholder:text-[#8a5d46]/50 py-0.5 leading-tight tracking-normal"
            autoComplete="off"
          />
        </div>

        {/* Right side inside pill: Clear button (if text exists) + Magnifying Glass Icon */}
        <div className="flex items-center gap-1.5 shrink-0 pl-1 text-[#552110]">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-[#8a5d46] hover:text-[#4a170a] hover:bg-[#ede0d2] transition-colors cursor-pointer"
              id={`${idPrefix}-search-clear-btn`}
              title="Clear text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (trimmedQuery !== '') {
                handleSearchAction(query.trim());
              } else {
                inputRef.current?.focus();
              }
            }}
            className="p-1 rounded-full text-[#552110] hover:text-[#d01617] transition-colors cursor-pointer"
            title="Search"
            aria-label="Search"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Dropdown Results Menu aligned exactly to search pill width */}
        {isOpen && trimmedQuery !== '' && (
          <div 
            className="absolute left-0 right-0 top-full mt-2 w-full bg-[#faf5ea] border border-[#ebdcd0] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-md animate-fadeIn"
            id={`${idPrefix}-search-dropdown`}
          >
            {/* Top Section Header: PRODUCTS */}
            <div className="px-4 py-2.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#9c745d]">
                Products
              </span>
            </div>
            <div className="border-b border-[#ebdcd0]" />

            {/* Results List */}
            {matchingProducts.length > 0 ? (
              <div className="max-h-[340px] overflow-y-auto divide-y divide-[#ebdcd0]/40">
                {matchingProducts.slice(0, 7).map((product, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductClick(product)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-4 py-2.5 sm:py-3 flex items-center gap-3 transition-colors cursor-pointer group ${
                        isSelected ? 'bg-[#ede0d2]' : 'hover:bg-[#f3e8dc]/80'
                      }`}
                      id={`${idPrefix}-search-item-${product.id}`}
                    >
                      {/* Thumbnail Image */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-[#e8dbcd] shrink-0 border border-[#dbc7b5]/70 shadow-2xs">
                        <img
                          src={getOptimizedImageUrl(product.image, { width: 150, quality: 75 })}
                          alt={product.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Product Name and Price */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-[#4a170a] group-hover:text-[#d01617] transition-colors leading-tight line-clamp-2">
                          {product.name}
                        </h4>
                        <p className="text-[11px] sm:text-xs font-medium text-[#7d5641] mt-0.5">
                          ₱{product.price.toFixed(2)} PHP
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* No Results Found */
              <div className="p-5 text-center">
                <p className="font-serif font-bold text-xs sm:text-sm text-[#4a170a] mb-1">
                  No products found matching "{query}"
                </p>
                <p className="text-[11px] text-[#7d5641]">
                  Try searching for sourdough, cheesecake, or croissant.
                </p>
              </div>
            )}

            {/* Bottom Action Row: Search for "[query]" -> */}
            <div className="border-t border-[#ebdcd0]" />
            <button
              type="button"
              onClick={() => handleSearchAction(query.trim())}
              onMouseEnter={() => setSelectedIndex(matchingProducts.length)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between gap-2 transition-colors cursor-pointer group ${
                selectedIndex === matchingProducts.length ? 'bg-[#ede0d2]' : 'bg-[#faf5ea] hover:bg-[#f3e8dc]'
              }`}
              id={`${idPrefix}-search-all-btn`}
            >
              <span className="font-serif font-bold text-xs sm:text-sm text-[#4a170a] group-hover:text-[#d01617] transition-colors truncate">
                Search for “{query.trim()}”
              </span>
              <ArrowRight className="w-4 h-4 text-[#4a170a] group-hover:text-[#d01617] group-hover:translate-x-0.5 transition-all shrink-0 stroke-[2.2]" />
            </button>
          </div>
        )}
      </div>

      {/* Outside Right: Close 'X' Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-2 sm:p-2.5 rounded-full text-[#552110] hover:text-[#d01617] hover:bg-[#ebdcd0]/60 transition-all cursor-pointer shrink-0 flex items-center justify-center"
          title="Close search"
          aria-label="Close search"
          id={`${idPrefix}-search-close-btn`}
        >
          <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2]" />
        </button>
      )}
    </div>
  );
};



