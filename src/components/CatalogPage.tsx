import React, { useState, useMemo, useEffect } from 'react';
import { Product, Collection } from '../types';
import { COLLECTIONS } from '../data/bakeryData';
import { getOptimizedImageUrl } from '../lib/imageOptimization';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Check,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

interface CatalogPageProps {
  products: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onQuickView: (product: Product) => void;
  initialCategory?: string;
  initialSearchQuery?: string;
  onClearSearchQuery?: () => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  onAddToCart,
  onQuickView,
  initialCategory = 'All Products',
  initialSearchQuery = '',
  onClearSearchQuery,
}) => {
  // Category Tab filter
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearchQuery);

  // Filter Toolbar States
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('All');
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 16;

  // Visual Added Feedback
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const handleAddToCartClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  // Sync category & search if props change
  useEffect(() => {
    setSelectedCategory(initialCategory);
    setCurrentPage(1);
  }, [initialCategory]);

  useEffect(() => {
    setSearchQuery(initialSearchQuery);
    setCurrentPage(1);
  }, [initialSearchQuery]);

  // Categories list
  const categories = [
    'All Products',
    'Pastries',
    'Breads',
    'Pies & Tarts',
    'Specialties & Snacks',
  ];

  // Calculate Availability counts dynamically for the current category
  const availabilityCounts = useMemo(() => {
    const baseCategoryProducts = products.filter((p) => {
      if (selectedCategory === 'All Products') return true;
      if (selectedCategory === 'Bestsellers') {
        return p.badge?.toLowerCase().includes('bestseller') || p.rating >= 4.93;
      }
      return p.category === selectedCategory;
    });

    const inStock = baseCategoryProducts.filter((p) => p.availability === 'In Stock' || !p.availability).length;
    const outOfStock = baseCategoryProducts.filter((p) => p.availability === 'Pre-Order' || (p.availability as string) === 'Out of Stock').length;
    const all = baseCategoryProducts.length;

    return { inStock, outOfStock, all };
  }, [products, selectedCategory]);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      // 0. Search Query Filter (if active)
      if (trimmed !== '') {
        const nameMatch = p.name.toLowerCase().includes(trimmed);
        const catMatch = p.category?.toLowerCase().includes(trimmed);
        const descMatch = p.description?.toLowerCase().includes(trimmed);
        const badgeMatch = p.badge?.toLowerCase().includes(trimmed);
        const variantMatch = p.variants?.some(v => v.toLowerCase().includes(trimmed));
        if (!nameMatch && !catMatch && !descMatch && !badgeMatch && !variantMatch) {
          return false;
        }
      }

      // 1. Category Filter
      if (selectedCategory !== 'All Products') {
        if (selectedCategory === 'Bestsellers') {
          if (p.badge?.toLowerCase().includes('bestseller') || p.rating >= 4.93) {
            // matches
          } else {
            return false;
          }
        } else if (p.category !== selectedCategory) {
          return false;
        }
      }

      // 2. Availability Filter
      if (availabilityFilter !== 'All') {
        if (availabilityFilter === 'In Stock' && p.availability === 'Pre-Order') {
          return false;
        }
        if (availabilityFilter === 'Out of Stock' && (p.availability === 'In Stock' || !p.availability)) {
          return false;
        }
      }

      // 3. Price Range Filter
      if (priceRangeFilter === 'under-300' && p.price >= 300) return false;
      if (priceRangeFilter === '300-600' && (p.price < 300 || p.price > 600)) return false;
      if (priceRangeFilter === 'over-600' && p.price <= 600) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-ascending') return a.price - b.price;
      if (sortBy === 'price-descending') return b.price - a.price;
      if (sortBy === 'title-ascending') return a.name.localeCompare(b.name);
      if (sortBy === 'title-descending') return b.name.localeCompare(a.name);
      if (sortBy === 'best-selling') {
        const aScore = (a.badge?.toLowerCase().includes('bestseller') ? 1000 : 0) + (a.reviewsCount || 0);
        const bScore = (b.badge?.toLowerCase().includes('bestseller') ? 1000 : 0) + (b.reviewsCount || 0);
        return bScore - aScore;
      }
      if (sortBy === 'relevant') {
        return (b.rating * (b.reviewsCount || 1)) - (a.rating * (a.reviewsCount || 1));
      }
      if (sortBy === 'created-descending') {
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      }
      if (sortBy === 'created-ascending') {
        return (a.isNew ? 1 : 0) - (b.isNew ? 1 : 0);
      }
      return 0; // 'featured' keeps original order
    });
  }, [products, searchQuery, selectedCategory, availabilityFilter, priceRangeFilter, sortBy]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const gridEl = document.getElementById('catalog-grid-start');
      if (gridEl) {
        gridEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const resetFilters = () => {
    setSelectedCategory('All Products');
    setSearchQuery('');
    if (onClearSearchQuery) onClearSearchQuery();
    setAvailabilityFilter('All');
    setPriceRangeFilter('All');
    setSortBy('featured');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory !== 'All Products' ||
    searchQuery.trim() !== '' ||
    availabilityFilter !== 'All' ||
    priceRangeFilter !== 'All' ||
    sortBy !== 'featured';

  return (
    <div className="bg-[#faf5ea] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Title */}
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-black text-[#4a170a] tracking-tight mb-8">
          {selectedCategory === 'All Products' ? 'All Artisanal Creations' : selectedCategory}
        </h1>

        {/* Filter Control Toolbar */}
        <div id="catalog-grid-start" className="mb-8">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Left Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center text-[#4a170a] font-bold text-sm">
                <span>Filter By:</span>
              </div>

              {/* Availability Filter */}
              <div className="relative inline-flex items-center">
                <select
                  value={availabilityFilter}
                  onChange={(e) => {
                    setAvailabilityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-transparent border-0 text-[#4a170a] text-xs sm:text-sm font-semibold py-1.5 pl-0 pr-5 hover:text-[#d01617] focus:outline-none cursor-pointer"
                >
                  <option value="All">Availability: All Items ({availabilityCounts.all})</option>
                  <option value="In Stock">In Stock ({availabilityCounts.inStock})</option>
                  <option value="Out of Stock">Out of Stock ({availabilityCounts.outOfStock})</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#4a170a]/70">
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="relative inline-flex items-center">
                <select
                  value={priceRangeFilter}
                  onChange={(e) => {
                    setPriceRangeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none bg-transparent border-0 text-[#4a170a] text-xs sm:text-sm font-semibold py-1.5 pl-0 pr-5 hover:text-[#d01617] focus:outline-none cursor-pointer"
                >
                  <option value="All">Price: All Ranges</option>
                  <option value="under-300">Under ₱300</option>
                  <option value="300-600">₱300 - ₱600</option>
                  <option value="over-600">Over ₱600</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#4a170a]/70">
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                </div>
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#d01617] hover:text-[#4a170a] px-3 py-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Right Sorting & Product Counter */}
            <div className="flex items-center justify-between lg:justify-end gap-6 pt-2 lg:pt-0">
              <span className="text-xs sm:text-sm font-medium text-[#4a170a]/80">
                Showing <strong className="text-[#d01617] font-bold">{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-[#4a170a]">Sort by:</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-transparent border-0 text-[#4a170a] text-xs sm:text-sm font-semibold py-1.5 pl-1 pr-5 hover:text-[#d01617] focus:outline-none cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="relevant">Most relevant</option>
                    <option value="best-selling">Best selling</option>
                    <option value="title-ascending">Alphabetically, A-Z</option>
                    <option value="title-descending">Alphabetically, Z-A</option>
                    <option value="price-ascending">Price, low to high</option>
                    <option value="price-descending">Price, high to low</option>
                    <option value="created-ascending">Date, old to new</option>
                    <option value="created-descending">Date, new to old</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center text-[#4a170a]/70">
                    <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Active Search Tag (if search is filtered) */}
          {searchQuery.trim() !== '' && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-[#7d5641]">Filtered by search:</span>
              <span className="inline-flex items-center gap-1.5 bg-[#ebdcd0] text-[#4a170a] text-xs font-bold px-3 py-1 rounded-full">
                <span>“{searchQuery.trim()}”</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    if (onClearSearchQuery) onClearSearchQuery();
                  }}
                  className="hover:text-[#d01617] cursor-pointer"
                  title="Remove search filter"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Empty Filter State */}
        {filteredProducts.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center text-center py-12 sm:py-20">
            <h2 className="font-serif text-[22px] font-bold text-[#552110] mb-6 text-center">
              No baked goods found
            </h2>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold text-sm sm:text-base px-8 py-3 rounded-full border border-[#542515] shadow-[0px_2px_0px_#542515] transition-all duration-200 cursor-pointer active:translate-y-0.5 active:shadow-none"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          /* Primary 4-Column Responsive Product Grid (4x4 Layout) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
            {paginatedProducts.map((product, idx) => {
              const isJustAdded = addedIds[product.id];
              const isAboveFold = idx < 8;

              return (
                <div
                  key={product.id}
                  onClick={() => onQuickView(product)}
                  className="group flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                >
                  {/* Picture with rounded corners, distinct dark brown border, and 3D sprung solid bottom shadow */}
                  <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] relative shadow-[0px_6px_0px_#542515] group-hover:shadow-[0px_8px_0px_#542515] transition-all duration-300">
                    <img
                      src={getOptimizedImageUrl(product.image, { width: 500, quality: 75 })}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      decoding="async"
                      className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out ${
                        product.inStock === false || product.availability === 'Sold Out'
                          ? 'grayscale-[30%] opacity-85'
                          : 'group-hover:scale-105'
                      }`}
                      loading={isAboveFold ? 'eager' : 'lazy'}
                      {...(idx < 4 ? { fetchPriority: 'high' } : {})}
                    />
                    {(product.inStock === false || product.availability === 'Sold Out') && (
                      <div className="absolute top-3 left-3 bg-[#4a170a]/90 backdrop-blur-xs text-amber-100 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-amber-300/30">
                        Sold Out
                      </div>
                    )}
                  </div>

                  {/* Title of the food with fixed height for uniform alignment */}
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#552110] group-hover:text-[#d01617] transition-colors line-clamp-2 leading-snug mt-3 h-[3rem] flex items-start break-words [overflow-wrap:anywhere]">
                    {product.name}
                  </h3>

                  {/* Price in PHP */}
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="font-serif sm:font-sans font-medium text-base text-[#6e3923]">
                      ₱{product.price.toFixed(2)} PHP
                    </span>
                  </div>

                  {/* Add to cart button (leads to Product Details) */}
                  {product.inStock === false || product.availability === 'Sold Out' ? (
                    <button
                      type="button"
                      disabled
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 w-full py-2.5 px-4 rounded-full border-2 border-gray-300 bg-gray-100 text-gray-400 font-medium text-sm tracking-wide cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <span>Sold Out</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="mt-4 w-full py-2.5 px-4 rounded-full border-2 border-[#3d1408] font-medium text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 bg-[#fbf7ed] hover:bg-[#3d1408] text-[#3d1408] hover:text-[#fbf7ed]"
                    >
                      <span>Add to cart</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Minimalist Centered Pagination Switcher matching reference */}
        {totalPages > 1 && (
          <div className="mt-14 mb-6 flex items-center justify-center gap-8 text-[#552110] font-sans select-none">
            {currentPage > 1 && (
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                className="text-[#7d5641] hover:text-[#552110] transition-colors p-1 cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            <div className="flex items-center gap-6">
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => {
                const isActive = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`text-lg transition-colors cursor-pointer relative pb-0.5 ${
                      isActive
                        ? 'text-[#552110] font-medium'
                        : 'text-[#7d5641] hover:text-[#552110]'
                    }`}
                  >
                    <span>{pageNum}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#552110]" />
                    )}
                  </button>
                );
              })}
            </div>

            {currentPage < totalPages && (
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="text-[#7d5641] hover:text-[#552110] transition-colors p-1 cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        )}

        {/* "Other Collections" Section matching Home Page Featured Collections structure & styling */}
        <section className="mt-16 sm:mt-24 pt-12 border-t border-[#542515]/10">
          <div className="text-left mb-8 sm:mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#552110] tracking-tight">
              Explore Other Curated Collections
            </h2>
          </div>

          {/* 2x2 Responsive Grid matching Featured Collections style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {COLLECTIONS.map((col) => (
              <div
                key={col.id}
                onClick={() => handleCategoryChange(col.categoryFilter)}
                className="group flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/10] w-full rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] relative shadow-[0px_6px_0px_#542515] group-hover:shadow-[0px_8px_0px_#542515] transition-all duration-300">
                  <img
                    src={getOptimizedImageUrl(col.image, { width: 700, quality: 75 })}
                    alt={col.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (target.src.includes('lh3.googleusercontent.com/d/')) {
                        const id = target.src.split('/d/')[1];
                        target.src = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
                      }
                    }}
                  />
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg lg:text-xl text-[#552110] group-hover:text-[#d01617] transition-colors mt-3 flex items-center gap-1.5">
                  <span>{col.title}</span>
                  <span className="text-[#552110] font-sans text-base transition-transform group-hover:translate-x-1">→</span>
                </h3>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};
