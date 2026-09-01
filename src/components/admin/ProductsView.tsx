import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Check, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Package, 
  Eye, 
  ArrowRight, 
  ExternalLink, 
  Archive,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ImageIcon
} from 'lucide-react';
import { AdminProduct } from './types';
import { AddProductModal } from './AddProductModal';
import { EditProductModal } from './EditProductModal';
import { AdminConfirmationModal } from './AdminConfirmationModal';
import { getOptimizedImageUrl } from '../../lib/imageOptimization';

interface ProductsViewProps {
  products: AdminProduct[];
  onToggleStock: (productId: string) => void;
  onSetProductStock?: (productId: string, inStock: boolean) => void;
  onAddProduct: (product: AdminProduct) => void;
  onUpdateProduct?: (product: AdminProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onViewProductDetails?: (productId: string) => void;
  onViewLivePage?: (product: AdminProduct) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onToggleStock,
  onSetProductStock,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onViewProductDetails,
  onViewLivePage
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'in_stock' | 'sold_out'>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  const inStockCount = products.filter((p) => p.inStock).length;
  const soldOutCount = products.filter((p) => !p.inStock).length;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedProductIds([]);
  }, [search, categoryFilter, stockFilter]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesStock = 
      stockFilter === 'All' || 
      (stockFilter === 'in_stock' && p.inStock) || 
      (stockFilter === 'sold_out' && !p.inStock);
    return matchesSearch && matchesCat && matchesStock;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startItemNumber = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const endItemNumber = Math.min(startIndex + ITEMS_PER_PAGE, filteredProducts.length);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(paginatedProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedProductIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected = 
    paginatedProducts.length > 0 && 
    paginatedProducts.every((p) => selectedProductIds.includes(p.id));

  // Bulk actions
  const handleBulkStock = (inStock: boolean) => {
    selectedProductIds.forEach((id) => {
      if (onSetProductStock) {
        onSetProductStock(id, inStock);
      }
    });
    setSelectedProductIds([]);
  };

  const handleBulkArchive = () => {
    if (selectedProductIds.length === 0) return;
    setIsBulkArchiveModalOpen(true);
  };

  const confirmExecuteBulkArchive = () => {
    selectedProductIds.forEach((id) => {
      onDeleteProduct(id);
    });
    setSelectedProductIds([]);
    setIsBulkArchiveModalOpen(false);
  };

  // Helper to format SKU / Product ID consistently
  const formatProductId = (product: AdminProduct, index: number) => {
    const num = String(index + 1).padStart(2, '0');
    if (product.id.startsWith('p-')) {
      return `BAKE-206-${num}`;
    }
    return `PROD-${product.id.slice(0, 8).toUpperCase()}`;
  };

  return (
    <div className="space-y-6" id="admin-products-catalog-view">
      
      {/* 1. Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight uppercase">
            Menu & Products Catalog
          </h1>
          <p className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-stone-500 mt-1">
            Manage daily stock availability, box packaging options, and baking lead times.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#d01617] hover:bg-[#b01011] text-white px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* 2. Main Structured Data Table Container */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        
        {/* Top Filter Bar (Search Left + Segment/Category Right) */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-100">
          
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#4a170a] focus:ring-1 focus:ring-[#4a170a] bg-stone-50/50 hover:bg-white transition-colors placeholder:text-stone-400 text-[#4a170a]"
            />
          </div>

          {/* Segment & Stock Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Category Segment Filter */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-mono font-bold tracking-wider uppercase text-stone-500 shrink-0">
                SEGMENT:
              </label>
              <div className="relative">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-3.5 pr-8 py-2 rounded-xl border border-stone-200 bg-white hover:border-stone-400 text-xs font-mono font-semibold text-stone-800 focus:outline-none focus:border-[#4a170a] appearance-none cursor-pointer shadow-2xs transition-colors"
                >
                  <option value="All">All Segments</option>
                  <option value="Pastries">Pastries</option>
                  <option value="Breads">Breads</option>
                  <option value="Pies & Tarts">Pies & Tarts</option>
                  <option value="Specialties & Snacks">Specialties & Snacks</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Stock & Restock Status Segment */}
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-mono font-bold tracking-wider uppercase text-stone-500 shrink-0">
                STOCK:
              </label>
              <div className="relative">
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value as 'All' | 'in_stock' | 'sold_out')}
                  className="pl-3.5 pr-8 py-2 rounded-xl border border-stone-200 bg-white hover:border-stone-400 text-xs font-mono font-semibold text-stone-800 focus:outline-none focus:border-[#4a170a] appearance-none cursor-pointer shadow-2xs transition-colors"
                >
                  <option value="All">All ({products.length})</option>
                  <option value="in_stock">In Stock ({inStockCount})</option>
                  <option value="sold_out">Sold Out / Restock ({soldOutCount})</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

          </div>

        </div>

        {/* Selected Items Status / Bulk Actions Bar */}
        <div className="px-5 py-2.5 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-stone-600 font-bold uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full ${selectedProductIds.length > 0 ? 'bg-[#d01617] animate-pulse' : 'bg-stone-300'}`} />
            <span>{selectedProductIds.length} ITEMS SELECTED</span>
          </div>

          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStock(true)}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Set In Stock
              </button>
              <button
                type="button"
                onClick={() => handleBulkStock(false)}
                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Set Sold Out
              </button>
              <button
                type="button"
                onClick={handleBulkArchive}
                className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Archive ({selectedProductIds.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedProductIds([])}
                className="text-stone-400 hover:text-stone-600 underline text-[10px] cursor-pointer ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-xs sm:text-sm">
            <colgroup>
              <col style={{ width: '48px' }} />
              <col style={{ width: '130px' }} />
              <col style={{ minWidth: '240px' }} />
              <col style={{ width: '160px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '170px' }} />
            </colgroup>
            
            {/* Table Header */}
            <thead className="bg-white border-b border-stone-200 text-stone-600 font-mono font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-4 px-4 sm:px-5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-stone-300 text-[#4a170a] focus:ring-0 accent-[#4a170a] cursor-pointer"
                  />
                </th>
                <th className="py-4 px-4 whitespace-nowrap">
                  PRODUCT ID
                </th>
                <th className="py-4 px-4 min-w-[240px]">
                  PRODUCT DISPLAY NAME
                </th>
                <th className="py-4 px-4 whitespace-nowrap">
                  ASSET SEGMENT
                </th>
                <th className="py-4 px-4 whitespace-nowrap">
                  BASE PRICE & STATUS
                </th>
                <th className="py-4 px-4 text-center whitespace-nowrap">
                  CONTROL ACTIONS
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-500">
                    <p className="font-bold text-stone-700">No products match your criteria</p>
                    <p className="text-xs text-stone-400 mt-1 font-mono">Try adjusting your search or segment filters</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product, index) => {
                  const isSelected = selectedProductIds.includes(product.id);
                  const displayId = formatProductId(product, startIndex + index);

                  return (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-amber-50/30 transition-colors group ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      
                      {/* Checkbox */}
                      <td className="py-4 px-4 sm:px-5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(product.id)}
                          className="w-4 h-4 rounded border-stone-300 text-[#4a170a] focus:ring-0 accent-[#4a170a] cursor-pointer"
                        />
                      </td>

                      {/* Product ID */}
                      <td className="py-4 px-4 font-mono text-xs font-bold text-stone-700 whitespace-nowrap">
                        {displayId}
                      </td>

                      {/* Product Display Name with Media / Thumbnail */}
                      <td className="py-4 px-4 min-w-[240px]">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Thumbnail / Media placeholder */}
                          <div className="shrink-0">
                            {product.image && product.image.trim() ? (
                              <img
                                src={getOptimizedImageUrl(product.image, { width: 150, quality: 75 })}
                                alt={product.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-2xs hover:border-[#d01617] transition-colors"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 text-stone-400 flex flex-col items-center justify-center text-[9px] font-mono font-bold leading-tight">
                                <ImageIcon className="w-4 h-4 mb-0.5 text-stone-400" />
                                <span>No Media</span>
                              </div>
                            )}
                          </div>

                          {/* Titles & Excerpt */}
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => onViewProductDetails?.(product.id)}
                              className="font-bold text-[#4a170a] hover:text-[#d01617] hover:underline transition-colors text-left cursor-pointer block truncate w-full max-w-[260px]"
                              title={`Open details for ${product.name}`}
                            >
                              <span className="truncate block">{product.name}</span>
                            </button>
                            <p className="text-[11px] text-stone-500 truncate max-w-[260px] mt-0.5">
                              {product.description || (product.boxVariants && product.boxVariants.length > 0 
                                ? `Available in ${product.boxVariants.join(', ')}`
                                : 'Artisanal oven-fresh pastry specialty')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Asset Segment / Category */}
                      <td className="py-4 px-4 font-medium text-stone-700 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-stone-100/80 text-stone-700 text-xs font-semibold">
                          {product.category}
                        </span>
                      </td>

                      {/* Base Price & Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="font-extrabold text-[#4a170a]">
                            ₱{product.basePrice.toLocaleString()}.00
                          </div>
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                              product.inStock 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-600' : 'bg-red-600'}`} />
                              {product.inStock ? 'In Stock (Live)' : 'Sold Out'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Control Actions (Row of 4 rounded square icon buttons) */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* 1. Quick Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingProduct(product)}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-amber-400 bg-white hover:bg-amber-50 text-stone-600 hover:text-amber-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Edit Product"
                            aria-label="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Quick View / Inspect Details */}
                          <button
                            type="button"
                            onClick={() => onViewProductDetails?.(product.id)}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-stone-800 bg-white hover:bg-stone-100 text-stone-600 hover:text-stone-900 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Inspect Full Specifications"
                            aria-label="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. View Live Storefront Link */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onViewLivePage) {
                                onViewLivePage(product);
                              } else if (onViewProductDetails) {
                                onViewProductDetails(product.id);
                              }
                            }}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-stone-600 hover:text-blue-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="View on Storefront"
                            aria-label="View on Storefront"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Delete / Archive Button */}
                          <button
                            type="button"
                            onClick={() => setProductToDelete(product)}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-red-300 bg-white hover:bg-red-50 text-stone-500 hover:text-red-600 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Archive / Remove Product"
                            aria-label="Archive Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>

        {/* 5. Table Footer with Monospace Records Count & Pagination */}
        <div className="p-4 sm:px-6 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="font-mono text-stone-600 font-medium">
            Showing <span className="font-bold text-[#4a170a]">{startItemNumber}</span> to{' '}
            <span className="font-bold text-[#4a170a]">{endItemNumber}</span> of{' '}
            <span className="font-bold text-[#4a170a]">{filteredProducts.length}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            {/* Previous Page Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="Previous Page"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
              const isActive = pageNum === safeCurrentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl font-mono font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#4a170a] text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {/* Next Page Button */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="w-8 h-8 rounded-xl border border-stone-200 bg-white flex items-center justify-center text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
              title="Next Page"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={onAddProduct}
      />

      {/* Quick Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          isOpen={!!editingProduct}
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdateProduct={(updated) => {
            if (onUpdateProduct) onUpdateProduct(updated);
            setEditingProduct(null);
          }}
        />
      )}

      {/* Confirmation Modal: Single Product Archive */}
      {productToDelete && (
        <AdminConfirmationModal
          isOpen={!!productToDelete}
          portalName="MENU & PRODUCTS CATALOG"
          title="ARCHIVE PRODUCT RECORD"
          message={
            <p>
              Are you sure you want to archive record <strong className="font-mono font-bold text-[#4a170a]">{productToDelete.name}</strong> ({productToDelete.id})? This item will be removed from the active storefront and moved to the <strong>ARCHIVE VAULT</strong>.
            </p>
          }
          cancelText="CANCEL"
          confirmText="YES, ARCHIVE PRODUCT"
          confirmVariant="danger"
          onClose={() => setProductToDelete(null)}
          onConfirm={() => {
            onDeleteProduct(productToDelete.id);
            setProductToDelete(null);
          }}
        />
      )}

      {/* Confirmation Modal: Bulk Product Archive */}
      {isBulkArchiveModalOpen && (
        <AdminConfirmationModal
          isOpen={isBulkArchiveModalOpen}
          portalName="DATABASE BATCH ACTION"
          title="ARCHIVE SELECTED PRODUCTS"
          message={
            <p>
              Are you sure you want to archive <strong className="font-mono font-bold text-[#4a170a]">{selectedProductIds.length}</strong> selected product records? These items will be removed from the active catalog and transferred to the <strong>ARCHIVE VAULT</strong>.
            </p>
          }
          cancelText="CANCEL"
          confirmText={`YES, ARCHIVE ${selectedProductIds.length} PRODUCTS`}
          confirmVariant="danger"
          onClose={() => setIsBulkArchiveModalOpen(false)}
          onConfirm={confirmExecuteBulkArchive}
        />
      )}

    </div>
  );
};
