import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBundleDetails } from '../utils/bundlePricing';
import { getOptimizedImageUrl } from '../lib/imageOptimization';

interface ProductDetailsPageProps {
  product: Product;
  allProducts: Product[];
  onAddToCart: (product: Product, quantity: number, variant?: string) => void;
  onBuyNow: (product: Product, quantity: number, variant?: string) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateHome: () => void;
  onNavigateCatalog: (category?: string) => void;
  onOpenHowToOrder: () => void;
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({
  product,
  allProducts,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onNavigateHome,
  onNavigateCatalog,
  onOpenHowToOrder,
}) => {
  // Product images array (only legitimate product images from backend)
  const images = (product.galleryImages && product.galleryImages.length > 0)
    ? product.galleryImages
    : (product.images && product.images.length > 0)
    ? product.images
    : [product.image];

  const [activeImage, setActiveImage] = useState<string>(images[0] || product.image);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);

  // Check scroll position to dynamically show/hide arrows
  const checkScrollBounds = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  const handleArrowScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftRef.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.2;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftRef.current - walk;
    checkScrollBounds();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Reset state whenever the displayed product changes
  useEffect(() => {
    const currentImages = product.galleryImages && product.galleryImages.length > 0
      ? product.galleryImages
      : [product.image];
    setActiveImage(currentImages[0]);
    setSelectedVariant(undefined);
    setQuantity(1);
    setIsAdded(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
    setCanScrollLeft(false);
    setCanScrollRight(currentImages.length > 4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    checkScrollBounds();
    container.addEventListener('scroll', checkScrollBounds, { passive: true });
    window.addEventListener('resize', checkScrollBounds);
    return () => {
      container.removeEventListener('scroll', checkScrollBounds);
      window.removeEventListener('resize', checkScrollBounds);
    };
  }, [images]);

  // Default variants list if none provided in product
  const variantOptions = product.variants && product.variants.length > 0
    ? product.variants
    : ['Box of 10', 'Box of 15', 'Box of 20'];

  // Normalize category string for robust matching across singular/plural and variations
  const normalizeCategory = (cat?: string): string => {
    if (!cat) return '';
    const clean = cat.trim().toLowerCase();
    if (clean === 'pastry' || clean === 'pastries' || clean.includes('pastr') || clean.includes('viennoiserie')) {
      return 'Pastries';
    }
    if (clean === 'bread' || clean === 'breads' || clean.includes('bread') || clean.includes('loaf') || clean.includes('loaves')) {
      return 'Breads';
    }
    if (clean.includes('pie') || clean.includes('tart') || clean.includes('cake')) {
      return 'Pies & Tarts';
    }
    if (clean.includes('specialt') || clean.includes('snack') || clean.includes('scone') || clean.includes('cookie') || clean.includes('cracker') || clean.includes('biscotti')) {
      return 'Specialties & Snacks';
    }
    return cat.trim();
  };

  // Recommended products: ONLY from the same category as the current product (excluding current product)
  const currentCanonicalCategory = normalizeCategory(product.category);
  const sameCategoryProducts = allProducts.filter(
    (p) => p.id !== product.id && normalizeCategory(p.category) === currentCanonicalCategory
  );

  const recommendedProducts = sameCategoryProducts.slice(0, 4);

  return (
    <div className="bg-[#faf5ea] text-[#4a170a] min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* 3. Main Product Showcase Container (Asymmetric Two-Column) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start mb-16">
          
          {/* Left Column: Media Gallery */}
          <div className="lg:col-span-7 space-y-4">
            {/* Main Product Image Container */}
            <div className="relative bg-[#faf7f2] rounded-3xl overflow-hidden border border-amber-900/10 shadow-sm h-[500px] w-full group">
              <img
                src={getOptimizedImageUrl(activeImage, { width: 900, quality: 80 })}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105"
              />
            </div>

            {/* Thumbnail Gallery (Only rendered if more than 1 image is available) */}
            {images.length > 1 && (
              images.length > 4 ? (
                <div className="relative w-full group/carousel">
                  {/* Left Overlay Arrow (ONLY ARROW, positioned over first thumbnail with drop shadow) */}
                  {canScrollLeft && (
                    <button
                      type="button"
                      onClick={() => handleArrowScroll('left')}
                      aria-label="Previous thumbnails"
                      className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 z-20 text-white hover:text-amber-200 transition-all cursor-pointer bg-transparent border-0 p-0 focus:outline-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] hover:scale-115"
                    >
                      <ChevronLeft className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.5]" />
                    </button>
                  )}

                  {/* Carousel Viewport (Touchpad swipe, Touch swipe on phones, Drag, or Arrow scroll) */}
                  <div
                    ref={scrollContainerRef}
                    onScroll={checkScrollBounds}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    className="w-full overflow-x-auto overflow-y-hidden rounded-2xl scroll-smooth snap-x snap-mandatory flex gap-3 sm:gap-4 select-none touch-pan-x cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1"
                  >
                    {images.map((imgUrl, idx) => {
                      const isActive = activeImage === imgUrl;
                      return (
                        <div
                          key={idx}
                          className="w-[calc((100%-2.25rem)/4)] sm:w-[calc((100%-3rem)/4)] shrink-0 snap-start"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (!hasMovedRef.current) {
                                setActiveImage(imgUrl);
                              }
                            }}
                            className={`w-full relative rounded-xl sm:rounded-2xl overflow-hidden aspect-1/1 border-2 transition-all cursor-pointer bg-[#faf7f2] block ${
                              isActive
                                ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                                : 'border-transparent hover:border-amber-300/80 opacity-85 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={getOptimizedImageUrl(imgUrl, { width: 220, quality: 70 })}
                              alt={`${product.name} view ${idx + 1}`}
                              draggable={false}
                              className="w-full h-full object-cover object-center pointer-events-none"
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Overlay Arrow (ONLY ARROW, positioned over 4th thumbnail with drop shadow) */}
                  {canScrollRight && (
                    <button
                      type="button"
                      onClick={() => handleArrowScroll('right')}
                      aria-label="Next thumbnails"
                      className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-20 text-white hover:text-amber-200 transition-all cursor-pointer bg-transparent border-0 p-0 focus:outline-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] hover:scale-115"
                    >
                      <ChevronRight className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 sm:gap-4">
                  {images.map((imgUrl, idx) => {
                    const isActive = activeImage === imgUrl;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(imgUrl)}
                        className={`relative rounded-xl sm:rounded-2xl overflow-hidden aspect-1/1 border-2 transition-all cursor-pointer bg-[#faf7f2] ${
                          isActive
                            ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                            : 'border-transparent hover:border-amber-300/80 opacity-85 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getOptimizedImageUrl(imgUrl, { width: 220, quality: 70 })}
                          alt={`${product.name} view ${idx + 1}`}
                          className="w-full h-full object-cover object-center"
                        />
                      </button>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* Right Column: Product Information & Purchase */}
          <div className="lg:col-span-5 space-y-6 min-w-0">
            
            {/* Header / Product Title */}
            <div className="min-w-0">
              {/* Product Title */}
              <h1 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#4a170a] tracking-tight leading-tight break-words [overflow-wrap:anywhere]">
                {product.name}
              </h1>
            </div>

            {/* Price Display */}
            {(() => {
              const basePrice = product.basePrice || product.price;
              const bundleInfo = getBundleDetails(basePrice, selectedVariant);
              
              return (
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4a170a] shrink-0">
                    ₱{bundleInfo.bundlePrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })} PHP
                  </span>

                  {(product.inStock === false || product.availability === 'Sold Out') && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      Currently Sold Out
                    </span>
                  )}
                </div>
              );
            })()}

            {/* Warm Product Description */}
            <p className="text-gray-700 text-sm sm:text-base leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line">
              {product.description}
            </p>

            {/* Variant Selection (Box Packaging Variants) */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-[#4a170a]">
                PACKAGE & BUNDLE OPTIONS
              </label>

              <div className="flex flex-wrap gap-3">
                {/* Single Piece Option */}
                <button
                  type="button"
                  onClick={() => setSelectedVariant(undefined)}
                  className={`px-5 py-2.5 rounded-2xl text-sm sm:text-base font-serif font-bold transition-all cursor-pointer border-2 flex items-center gap-2 ${
                    !selectedVariant
                      ? 'border-[#552110] bg-[#552110]/10 text-[#552110] ring-2 ring-[#552110]/20'
                      : 'border-[#b59b8c] bg-transparent text-[#552110] hover:border-[#8c6553] hover:bg-[#552110]/5'
                  }`}
                >
                  <span>Single Piece</span>
                  {!selectedVariant && <Check className="w-4 h-4 text-[#552110]" />}
                </button>

                {/* Bundle Options (Box of 10, 15, 20) */}
                {variantOptions.map((variant) => {
                  const isSelected = selectedVariant === variant;

                  return (
                    <button
                      key={variant}
                      type="button"
                      onClick={() => setSelectedVariant((prev) => (prev === variant ? undefined : variant))}
                      className={`px-5 py-2.5 rounded-2xl text-sm sm:text-base font-serif font-bold transition-all cursor-pointer border-2 flex items-center gap-2 ${
                        isSelected
                          ? 'border-[#552110] bg-[#552110]/10 text-[#552110] ring-2 ring-[#552110]/20'
                          : 'border-[#b59b8c] bg-transparent text-[#552110] hover:border-[#8c6553] hover:bg-[#552110]/5'
                      }`}
                    >
                      <span>{variant}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#552110]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs uppercase font-extrabold tracking-wider text-[#4a170a]">
                Quantity:
              </label>
              <div className="flex items-center">
                <div className="inline-flex items-center justify-between border-2 border-[#542515] rounded-2xl px-2 py-1 min-w-[140px] shadow-[0px_4px_0px_#542515] bg-transparent">
                  <button
                    type="button"
                    disabled={product.inStock === false || product.availability === 'Sold Out'}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-[#552110] hover:text-[#d01617] font-bold text-lg cursor-pointer transition-colors disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-[#552110] text-base select-none">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={product.inStock === false || product.availability === 'Sold Out'}
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 flex items-center justify-center text-[#552110] hover:text-[#d01617] font-bold text-lg cursor-pointer transition-colors disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Call to Action (CTA) Buttons (1x2 stacked layout) */}
            <div className="flex flex-col gap-3.5 pt-4">
              {product.inStock === false || product.availability === 'Sold Out' ? (
                <button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 font-bold text-base py-3.5 px-6 rounded-2xl border-2 border-gray-300 cursor-not-allowed flex items-center justify-center"
                >
                  <span>Sold Out (Restocking Soon)</span>
                </button>
              ) : (
                <>
                  {/* Add to Cart Button */}
                  <button
                    onClick={() => {
                      onAddToCart(product, quantity, selectedVariant);
                      setIsAdded(true);
                      setTimeout(() => setIsAdded(false), 2000);
                    }}
                    className={`w-full font-bold text-base py-3.5 px-6 rounded-2xl border-2 border-[#542515] transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-1 active:shadow-none ${
                      isAdded
                        ? 'bg-[#3d1408] text-white shadow-none'
                        : 'bg-[#fbf8f3] hover:bg-[#f3ece0] text-[#542515] shadow-[0px_4px_0px_#542515]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-400" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <span>Add to Cart</span>
                    )}
                  </button>

                  {/* Buy It Now Button */}
                  <button
                    onClick={() => onBuyNow(product, quantity, selectedVariant)}
                    className="w-full bg-[#d94d2f] hover:bg-[#c03d21] text-white font-bold text-base py-3.5 px-6 rounded-2xl border-2 border-[#542515] shadow-[0px_4px_0px_#542515] transition-all flex items-center justify-center cursor-pointer active:translate-y-1 active:shadow-none"
                  >
                    <span>Buy It Now</span>
                  </button>
                </>
              )}
            </div>

          </div>

        </div>

        {/* 5. Cross-Selling / Recommended Products Section (Same Category Only) */}
        {recommendedProducts.length > 0 && (
          <div className="pt-12 border-t-2 border-amber-900/10">
            <div className="mb-8">
              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#4a170a]">
                You Might Also Like
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
              {recommendedProducts.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => onSelectProduct(rec)}
                  className="group flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1"
                >
                  {/* Picture with rounded corners, distinct dark brown border, and 3D sprung solid bottom shadow */}
                  <div className="aspect-square w-full rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] relative shadow-[0px_6px_0px_#542515] group-hover:shadow-[0px_8px_0px_#542515] transition-all duration-300">
                    <img
                      src={getOptimizedImageUrl(rec.image, { width: 500, quality: 75 })}
                      alt={rec.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  </div>

                  {/* Title of the food with fixed height for uniform alignment */}
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#552110] group-hover:text-[#d01617] transition-colors line-clamp-2 leading-snug mt-3 h-[3rem] flex items-start">
                    {rec.name}
                  </h3>

                  {/* Price in PHP */}
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="font-serif sm:font-sans font-medium text-base text-[#6e3923]">
                      ₱{rec.price.toFixed(2)} PHP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
