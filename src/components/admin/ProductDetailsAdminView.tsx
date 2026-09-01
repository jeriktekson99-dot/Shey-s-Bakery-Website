import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Check, 
  Trash2, 
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AdminProduct } from './types';
import { AdminConfirmationModal } from './AdminConfirmationModal';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';

interface ProductDetailsAdminViewProps {
  product: AdminProduct;
  onBack: () => void;
  onToggleStock: (productId: string) => void;
  onSetProductStock?: (productId: string, inStock: boolean) => void;
  onUpdateProduct?: (updatedProduct: AdminProduct) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductDetailsAdminView: React.FC<ProductDetailsAdminViewProps> = ({
  product,
  onBack,
  onToggleStock,
  onSetProductStock,
  onDeleteProduct
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // Gallery images (strictly the real uploaded images of the product)
  const initialImages = (product.images && product.images.length > 0)
    ? product.images
    : product.image
    ? [product.image]
    : [];

  const images = initialImages;
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0);
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

  const availableBoxOptions: ('Box of 10' | 'Box of 15' | 'Box of 20')[] = [
    'Box of 10',
    'Box of 15',
    'Box of 20'
  ];

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    onDeleteProduct(product.id);
    setIsDeleteModalOpen(false);
    onBack();
  };

  const parsedBasePrice = product.basePrice;
  const activeHeroImage = images[selectedPhotoIndex] || images[0] || product.image;

  // SKU code generator
  const skuReference = `SPEC-PROD-${product.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase()}-${product.id.slice(-2)}`;

  return (
    <div className="space-y-6" id="admin-product-detail-page">
      
      {/* ======================================================== */}
      {/* 1. TOP HEADER BAR (Encased Card matching Reference)     */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Left Side: Back Arrow Button + Product Title + Status Badge */}
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onBack}
            id="product-details-back-btn"
            className="w-10 h-10 rounded-xl bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center text-stone-700 transition-colors shadow-2xs shrink-0 cursor-pointer"
            title="Return to Menu & Products"
          >
            <ArrowLeft className="w-4 h-4 text-[#4a170a]" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-mono text-base sm:text-lg font-black text-[#4a170a] tracking-tight uppercase break-words [overflow-wrap:anywhere]">
                PRODUCT: {product.name}
              </h1>
            </div>
            <p className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase mt-0.5 break-words [overflow-wrap:anywhere]">
              REFERENCE: {skuReference} • CATEGORY: {product.category.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Right Side: Stock Status & Return Action */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {/* Delete Record Button */}
          <button
            type="button"
            onClick={handleDelete}
            id="product-details-delete-record-btn"
            className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Delete this bake from catalog"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>DELETE RECORD</span>
          </button>

          {/* Quick Stock Selector */}
          <div className="relative inline-flex items-center">
            <select
              value={product.inStock ? 'in_stock' : 'sold_out'}
              onChange={(e) => {
                const isLive = e.target.value === 'in_stock';
                if (onSetProductStock) {
                  onSetProductStock(product.id, isLive);
                } else if (product.inStock !== isLive) {
                  onToggleStock(product.id);
                }
              }}
              className={`pl-3 pr-7 py-2 rounded-xl text-xs font-mono font-bold tracking-wider uppercase border focus:outline-none cursor-pointer appearance-none shadow-2xs transition-colors ${
                product.inStock
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100'
              }`}
              id="product-details-stock-select"
            >
              <option value="in_stock" className="bg-white text-emerald-800">In Stock</option>
              <option value="sold_out" className="bg-white text-red-900">Sold Out</option>
            </select>
            <ChevronDown className="w-3 h-3 text-stone-600 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MAIN BENTO GRID (Left 8 Cols, Right 4 Cols)           */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ====================================================== */}
        {/* LEFT COLUMN: 8 Columns (Media + Scope & Narrative)     */}
        {/* ====================================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CARD 1: Media Showcase & High-Res Presentation */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-5">
            
            {/* Header with Monospace Subtitle */}
            <div className="pb-3.5 border-b border-stone-100">
              <h2 className="text-xs font-mono font-bold text-[#4a170a] tracking-wider uppercase">
                PRODUCT PHOTOS & MEDIA GALLERY
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase mt-0.5">
                HIGH-RESOLUTION VISUAL ASSETS OF THE BAKED ITEM
              </p>
            </div>

            {/* Large Hero Viewport */}
            <div className="aspect-16/9 sm:aspect-16/10 rounded-2xl overflow-hidden bg-stone-950 border border-stone-200/80 relative shadow-inner group flex items-center justify-center">
              <img
                src={getOptimizedImageUrl(activeHeroImage, { width: 900, quality: 80 })}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            </div>

            {/* Interactive Thumbnail Strip */}
            <div>
              <div className="text-[11px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Select Photo Angle ({images.length} Photos):</span>
                <span className="text-[10px] text-stone-400 font-normal">Click thumbnail to switch hero frame</span>
              </div>

              {images.length > 4 ? (
                <div className="relative w-full group/carousel">
                  {/* Left Overlay Arrow (ONLY ARROW, positioned over first thumbnail with drop shadow) */}
                  {canScrollLeft && (
                    <button
                      type="button"
                      onClick={() => handleArrowScroll('left')}
                      aria-label="Previous angles"
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
                    className="w-full overflow-x-auto overflow-y-hidden rounded-xl scroll-smooth snap-x snap-mandatory flex gap-2.5 select-none touch-pan-x cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1"
                  >
                    {images.map((imgUrl, idx) => {
                      const isActive = selectedPhotoIndex === idx;
                      return (
                        <div
                          key={idx}
                          className="w-[calc((100%-1.875rem)/4)] shrink-0 snap-start"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (!hasMovedRef.current) {
                                setSelectedPhotoIndex(idx);
                              }
                            }}
                            className={`w-full relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-2xs group block ${
                              isActive
                                ? 'border-amber-500 ring-2 ring-amber-500/30'
                                : 'border-stone-200 hover:border-amber-300 opacity-85 hover:opacity-100'
                            }`}
                            title={`View Angle ${idx + 1}`}
                          >
                            <img
                              src={getOptimizedImageUrl(imgUrl, { width: 220, quality: 70 })}
                              alt={`Angle ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              draggable={false}
                              className="w-full h-full object-cover object-center pointer-events-none"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                              Angle {idx + 1}
                            </span>
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
                      aria-label="Next angles"
                      className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 z-20 text-white hover:text-amber-200 transition-all cursor-pointer bg-transparent border-0 p-0 focus:outline-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] hover:scale-115"
                    >
                      <ChevronRight className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.5]" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                  {images.map((imgUrl, idx) => {
                    const isActive = selectedPhotoIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-2xs group ${
                          isActive
                            ? 'border-amber-500 ring-2 ring-amber-500/30'
                            : 'border-stone-200 hover:border-amber-300 opacity-85 hover:opacity-100'
                        }`}
                        title={`View Angle ${idx + 1}`}
                      >
                        <img
                          src={getOptimizedImageUrl(imgUrl, { width: 220, quality: 70 })}
                          alt={`Angle ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                          Angle {idx + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* CARD 2: Product Overview & Tasting Notes */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-5">
            
            {/* Header with Monospace Subtitle */}
            <div className="pb-3.5 border-b border-stone-100">
              <h2 className="text-xs font-mono font-bold text-[#4a170a] tracking-wider uppercase">
                PRODUCT OVERVIEW & TASTING NOTES
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase mt-0.5">
                FULL RECIPE SPECIFICATIONS, ARTISAN CRUMB & INGREDIENT HIGHLIGHTS
              </p>
            </div>

            {/* Tasting Notes & Crumb Description */}
            <div>
              <span className="block text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider mb-1">
                Baker's Tasting Notes & Crumb Description
              </span>
              <div className="w-full px-3.5 py-2.5 rounded-xl border border-stone-100 bg-[#fcfaf7] text-xs sm:text-sm text-[#4a170a] font-medium leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-line">
                {product.description || 'Artisan handcrafted brioche coiled with rich cultured butter, slow-baked to golden perfection.'}
              </div>
            </div>

            {/* Box Packaging Variants Display */}
            <div className="pt-4 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                  Configured Packaging Box Variants
                </span>
                <span className="text-[10px] text-stone-400 font-mono">Available customer options</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {(product.boxVariants && product.boxVariants.length > 0 ? product.boxVariants : availableBoxOptions).map((opt) => {
                  const count = opt === 'Box of 10' ? 10 : opt === 'Box of 15' ? 15 : 20;
                  const estPrice = Math.round(product.basePrice * (count / 10) * 0.95);

                  return (
                    <div
                      key={opt}
                      className="p-3.5 rounded-xl border border-stone-200 bg-[#faf6f0] flex flex-col justify-between text-left shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-[#4a170a]">{opt}</span>
                        <div className="w-4 h-4 rounded-md flex items-center justify-center bg-[#4a170a] text-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-[#d01617] mt-2">
                        ₱{estPrice.toLocaleString()}.00
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* ====================================================== */}
        {/* RIGHT COLUMN: 4 Columns (Profile + Tech Specs)         */}
        {/* ====================================================== */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CARD 3: Product & Catalog Profile */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs space-y-4">
            
            {/* Header with Monospace Subtitle */}
            <div className="pb-3.5 border-b border-stone-100">
              <h2 className="text-xs font-mono font-bold text-[#4a170a] tracking-wider uppercase">
                PRODUCT & CATALOG PROFILE
              </h2>
              <p className="text-[10px] sm:text-[11px] font-mono font-bold tracking-wider text-stone-400 uppercase mt-0.5">
                CATALOG DETAILS & FULFILLMENT SEGMENT
              </p>
            </div>

            {/* Key-Value Pair 1: Product Title */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                PRODUCT TITLE
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#4a170a] mt-0.5">
                {product.name}
              </p>
            </div>

            {/* Key-Value Pair 2: Menu Category */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                MENU CATEGORY
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#4a170a] mt-0.5">
                {product.category}
              </p>
            </div>

            {/* Key-Value Pair: Unit Base Price */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                UNIT BASE PRICE
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-[#d01617] mt-0.5">
                ₱{product.basePrice.toLocaleString()}.00 PHP
              </p>
            </div>

            {/* Key-Value Pair 3: Production Kitchen */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                BAKERY PRODUCTION & KITCHEN
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#4a170a] mt-0.5">
                Main Flagship Bakehouse & Hearth Oven
              </p>
            </div>

            {/* Key-Value Pair 4: Reference Code */}
            <div>
              <span className="text-[10px] font-mono font-bold text-stone-400 tracking-wider uppercase block">
                ITEM SKU / REFERENCE CODE
              </span>
              <p className="text-xs sm:text-sm font-mono font-bold text-stone-700 mt-0.5">
                {skuReference}
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Confirmation Modal: Remove/Archive Product */}
      {isDeleteModalOpen && (
        <AdminConfirmationModal
          isOpen={isDeleteModalOpen}
          portalName="CATALOG ARCHIVE PORTAL"
          title="ARCHIVE BAKERY ITEM"
          message={
            <p>
              Are you sure you want to archive <strong className="text-stone-800 font-bold">"{product.name}"</strong> (SKU: <span className="font-mono font-bold text-[#4a170a]">{skuReference}</span>)? This item will be moved to the <strong>ARCHIVE VAULT</strong>.
            </p>
          }
          cancelText="CANCEL"
          confirmText="YES, ARCHIVE ITEM"
          confirmVariant="danger"
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
        />
      )}

    </div>
  );
};
