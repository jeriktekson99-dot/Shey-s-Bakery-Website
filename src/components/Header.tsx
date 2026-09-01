import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu, X, ChevronDown, Search } from 'lucide-react';
import { BRAND_LOGO } from '../data/bakeryData';
import { SearchBar } from './SearchBar';
import { Product } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenHowToOrder: () => void;
  onOpenAboutUs: () => void;
  onNavigateToSection: (sectionId: string) => void;
  activeView: 'home' | 'catalog' | 'faqs' | 'product' | 'how-to-order' | 'about-us' | 'checkout' | 'cart';
  onSelectView: (view: 'home' | 'catalog' | 'faqs' | 'product' | 'how-to-order' | 'about-us' | 'checkout' | 'cart') => void;
  onSelectCategory?: (category: string, searchQuery?: string) => void;
  products?: Product[];
  onSelectProduct?: (product: Product) => void;
}

export const Header: React.FC<HeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenHowToOrder,
  onOpenAboutUs,
  onNavigateToSection,
  activeView,
  onSelectView,
  onSelectCategory,
  products = [],
  onSelectProduct,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Disable page scrolling when search is active
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  const productCategories = [
    'Pastries',
    'Breads',
    'Pies & Tarts',
    'Specialties & Snacks',
  ];

  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
    onSelectView('home');
    onNavigateToSection('hero');
  };

  const handleAllProductsClick = (category?: string, searchQuery?: string) => {
    setMobileMenuOpen(false);
    setCategoryDropdownOpen(false);
    setIsSearchOpen(false);
    if (onSelectCategory) {
      onSelectCategory(category || 'All Products', searchQuery);
    } else {
      onSelectView('catalog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFaqsClick = () => {
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
    onSelectView('faqs');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHowToOrderClick = () => {
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
    onSelectView('how-to-order');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAboutUsClick = () => {
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
    onSelectView('about-us');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductSelection = (product: Product) => {
    setMobileMenuOpen(false);
    setIsSearchOpen(false);
    if (onSelectProduct) {
      onSelectProduct(product);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#faf5ea] transition-all duration-200">
        {/* 1. Top Announcement Bars */}
        <div className="bg-[#4a170a] text-amber-100 text-xs sm:text-sm py-1.5 px-4 border-b border-amber-900/30 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-center font-medium text-center">
            <span>
              Mon–Sat, 12 PM–6 PM (Next-day only; 1 PM cutoff. Excludes Sundays & holidays).
            </span>
          </div>
        </div>
        <div className="bg-[#d94d2f] text-white text-xs sm:text-sm py-1.5 px-4 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-center font-medium text-center">
            <span>
              Next day delivery available with 1pm cut-off • Free delivery over ₱1,500
            </span>
          </div>
        </div>

        {/* Main Header Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isSearchOpen ? (
            /* Search Bar Display Section: Matches the exact height and size of the Navigation Bar */
            <div className="w-full h-20 sm:h-24 lg:h-36 flex items-center justify-center animate-fadeIn">
              <div className="w-full max-w-3xl">
                <SearchBar
                  products={products}
                  onSelectProduct={handleProductSelection}
                  onNavigateToCatalog={handleAllProductsClick}
                  onClose={() => setIsSearchOpen(false)}
                  autoFocus={true}
                  placeholder=""
                  idPrefix="nav-search-overlay"
                  className="w-full"
                />
              </div>
            </div>
          ) : (
            <>
              {/* Tier 1: Left Search & Mobile Menu, Centered Logo, Right Cart */}
              <div className="relative flex items-center justify-between h-20 sm:h-24 gap-4">
                
                {/* Left Side: Mobile Menu Button (on mobile) & Desktop Search Icon */}
                <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-start min-w-0">
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden p-2 rounded-lg text-[#4a170a] hover:bg-amber-100/60 focus:outline-none cursor-pointer shrink-0"
                    aria-label="Toggle Navigation Menu"
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </button>

                  {/* Desktop Search Icon Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsSearchOpen(true);
                    }}
                    className="hidden lg:flex p-2.5 rounded-full text-[#4a170a] hover:text-[#d01617] hover:bg-amber-100/60 transition-all focus:outline-none items-center justify-center group cursor-pointer"
                    aria-label="Search"
                    title="Search Products"
                  >
                    <Search className="w-6 h-6 group-hover:scale-110 transition-transform stroke-[1.85]" />
                  </button>
                </div>

                {/* Centered Brand Logo */}
                <div className="flex items-center justify-center shrink-0">
                  <button
                    onClick={handleLogoClick}
                    className="group flex items-center justify-center focus:outline-none cursor-pointer"
                    aria-label="Shey's Bakery Home"
                  >
                    <img
                      src={BRAND_LOGO.src}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = BRAND_LOGO.fallbackSrc;
                      }}
                      alt={BRAND_LOGO.alt}
                      referrerPolicy="no-referrer"
                      className="h-14 sm:h-[74px] w-auto object-contain group-hover:scale-105 transition-transform rounded-md"
                    />
                  </button>
                </div>

                {/* Right Side: Minimized Search Icon Button (before Cart) & Shopping Bag Button */}
                <div className="flex items-center justify-end gap-1 sm:gap-2 flex-1">
                  {/* Minimized Mobile Search Button (positioned right before Cart) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setIsSearchOpen(true);
                    }}
                    className="lg:hidden p-2 rounded-full text-[#4a170a] hover:text-[#d01617] hover:bg-amber-100/60 transition-all focus:outline-none flex items-center justify-center group cursor-pointer"
                    aria-label="Search"
                    title="Search Products"
                  >
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform stroke-[1.85]" />
                  </button>

                  <button
                    onClick={onOpenCart}
                    className="relative p-2 sm:p-2.5 rounded-full text-[#4a170a] hover:text-[#d01617] hover:bg-amber-100/60 transition-all focus:outline-none flex items-center justify-center group cursor-pointer"
                    aria-label="Shopping Cart"
                  >
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform stroke-[1.85]" />
                    {cartCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-[#d94d2f] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#faf5ea] shadow-xs transition-colors">
                        {cartCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Tier 2: Centered Sub-Navigation Bar Links (Desktop) */}
              <div className="hidden lg:flex items-center justify-center pb-4 pt-0">
                <nav className="flex items-center gap-10 font-semibold text-[#4a170a]">
                  {/* All Products with Category Dropdown */}
                  <div 
                    className="relative group"
                    onMouseEnter={() => setCategoryDropdownOpen(true)}
                    onMouseLeave={() => setCategoryDropdownOpen(false)}
                  >
                    <button
                      onClick={() => handleAllProductsClick('All Products')}
                      className={`flex items-center gap-1.5 py-1.5 text-base relative transition-colors cursor-pointer ${
                        activeView === 'catalog' || activeView === 'product' ? 'text-[#d01617]' : 'hover:text-[#d01617]'
                      }`}
                    >
                      <span>All Products</span>
                      <ChevronDown className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:rotate-180 transition-transform duration-200" />
                      {(activeView === 'catalog' || activeView === 'product') && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d01617]" />
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    <div 
                      className={`absolute left-1/2 -translate-x-1/2 top-full pt-2 transition-all duration-200 z-50 ${
                        categoryDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-1 pointer-events-none'
                      }`}
                    >
                      <div className="bg-[#faf5ea] border border-[#ebdcd0] rounded-xl shadow-lg py-2 w-48 text-left backdrop-blur-xs">
                        {productCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => handleAllProductsClick(cat)}
                            className="w-full text-left px-4 py-2 text-sm font-medium text-[#4a170a] hover:bg-amber-100/60 hover:text-[#d01617] transition-colors cursor-pointer"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleHowToOrderClick}
                    className={`py-1.5 text-base relative transition-colors cursor-pointer ${
                      activeView === 'how-to-order' ? 'text-[#d01617]' : 'hover:text-[#d01617]'
                    }`}
                  >
                    How to Order
                    {activeView === 'how-to-order' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d01617]" />
                    )}
                  </button>

                  <button
                    onClick={handleFaqsClick}
                    className={`py-1.5 text-base relative transition-colors cursor-pointer ${
                      activeView === 'faqs' ? 'text-[#d01617]' : 'hover:text-[#d01617]'
                    }`}
                  >
                    FAQs
                    {activeView === 'faqs' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d01617]" />
                    )}
                  </button>

                  <button
                    onClick={handleAboutUsClick}
                    className={`py-1.5 text-base relative transition-colors cursor-pointer ${
                      activeView === 'about-us' ? 'text-[#d01617]' : 'hover:text-[#d01617]'
                    }`}
                  >
                    About Us
                    {activeView === 'about-us' && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d01617]" />
                    )}
                  </button>
                </nav>
              </div>

              {/* Mobile Navigation Drawer */}
              {mobileMenuOpen && (
                <div className="lg:hidden py-4 border-t border-[#ebdcd0] bg-[#faf5ea] px-3 space-y-2 animate-fadeIn">
                  {/* All Products Dropdown in Mobile */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-base font-bold rounded-lg transition-colors cursor-pointer ${
                        activeView === 'catalog' ? 'bg-amber-100 text-[#d01617]' : 'text-[#4a170a] hover:bg-amber-50'
                      }`}
                    >
                      <span>All Products</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#4a170a] transition-transform duration-200 ${
                          mobileCategoryOpen ? 'rotate-180 text-[#d01617]' : ''
                        }`}
                      />
                    </button>

                    {mobileCategoryOpen && (
                      <div className="pl-4 pr-1 py-1 space-y-1 animate-fadeIn">
                        <button
                          onClick={() => handleAllProductsClick('All Products')}
                          className="w-full text-left px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-stone-500 hover:text-[#d01617] hover:bg-amber-100/50 rounded-lg transition-colors cursor-pointer"
                        >
                          View All Products
                        </button>
                        {productCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => handleAllProductsClick(cat)}
                            className="w-full text-left px-3.5 py-2 text-sm font-medium text-[#4a170a] hover:text-[#d01617] hover:bg-amber-100/60 rounded-lg transition-colors cursor-pointer"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleHowToOrderClick}
                    className={`block w-full text-left px-4 py-3 text-base font-bold rounded-lg transition-colors cursor-pointer ${
                      activeView === 'how-to-order' ? 'bg-amber-100 text-[#d01617]' : 'text-[#4a170a] hover:bg-amber-50'
                    }`}
                  >
                    How to Order
                  </button>
                  <button
                    onClick={handleFaqsClick}
                    className={`block w-full text-left px-4 py-3 text-base font-bold rounded-lg transition-colors cursor-pointer ${
                      activeView === 'faqs' ? 'bg-amber-100 text-[#d01617]' : 'text-[#4a170a] hover:bg-amber-50'
                    }`}
                  >
                    FAQs
                  </button>
                  <button
                    onClick={handleAboutUsClick}
                    className={`block w-full text-left px-4 py-3 text-base font-bold rounded-lg transition-colors cursor-pointer ${
                      activeView === 'about-us' ? 'bg-amber-100 text-[#d01617]' : 'text-[#4a170a] hover:bg-amber-50'
                    }`}
                  >
                    About Us
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Backdrop / Overlay Mask for Search Mode */}
      {isSearchOpen && (
        <div
          onClick={() => setIsSearchOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-30 animate-fadeIn cursor-pointer transition-opacity duration-200"
          aria-label="Close search overlay"
          id="search-backdrop-mask"
        />
      )}
    </>
  );
};


