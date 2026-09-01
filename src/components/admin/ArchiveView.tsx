import React, { useState, useMemo, useEffect } from 'react';
import { 
  Archive, 
  Undo2, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Info, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import { ArchivedItem, ArchiveItemType } from './types';
import { AdminConfirmationModal } from './AdminConfirmationModal';
import { deduplicateById } from '../../data/bakeryStore';

interface ArchiveViewProps {
  archivedItems: ArchivedItem[];
  onRecoverItem: (item: ArchivedItem) => void;
  onPermanentDelete: (itemId: string) => void;
  onBulkRecover: (itemIds: string[]) => void;
  onBulkPermanentDelete: (itemIds: string[]) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  archivedItems,
  onRecoverItem,
  onPermanentDelete,
  onBulkRecover,
  onBulkPermanentDelete
}) => {
  // Origin / Type filter state
  const [selectedOriginFilter, setSelectedOriginFilter] = useState<string>('all');
  
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected checkbox IDs for bulk actions
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Pagination state (6 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedItemIds([]);
  }, [selectedOriginFilter, searchQuery]);

  // Confirmation modal states
  const [itemToRestore, setItemToRestore] = useState<ArchivedItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ArchivedItem | null>(null);
  const [isBulkRestoreModalOpen, setIsBulkRestoreModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Feedback Notification Banner
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // Filtered items computation
  const filteredItems = useMemo(() => {
    const cleanList = deduplicateById<ArchivedItem>(archivedItems);
    return cleanList.filter((item) => {
      // Origin filter
      if (selectedOriginFilter !== 'all') {
        if (selectedOriginFilter === 'products' && item.type !== 'product') return false;
        if (selectedOriginFilter === 'orders' && item.type !== 'order') return false;
        if (selectedOriginFilter === 'hubs' && item.type !== 'hub') return false;
        if (selectedOriginFilter === 'leads' && item.type !== 'custom') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesRef = item.referenceNumber?.toLowerCase().includes(q) ?? false;
        const matchesSub = item.subtitle?.toLowerCase().includes(q) ?? false;
        const matchesReason = item.reason?.toLowerCase().includes(q) ?? false;
        const matchesBy = item.archivedBy?.toLowerCase().includes(q) ?? false;
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;

        return matchesTitle || matchesRef || matchesSub || matchesReason || matchesBy || matchesTags;
      }

      return true;
    });
  }, [archivedItems, selectedOriginFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const startItemNumber = filteredItems.length === 0 ? 0 : startIndex + 1;
  const endItemNumber = Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length);

  // Bulk Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(paginatedItems.map((i) => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllSelected = paginatedItems.length > 0 && paginatedItems.every((item) => selectedItemIds.includes(item.id));
  const isIndeterminate = selectedItemIds.length > 0 && !isAllSelected;

  // Single Recover
  const handleSingleRecover = (item: ArchivedItem) => {
    setItemToRestore(item);
  };

  const handleConfirmSingleRecover = () => {
    if (!itemToRestore) return;
    const name = itemToRestore.title;
    onRecoverItem(itemToRestore);
    setSelectedItemIds((prev) => prev.filter((i) => i !== itemToRestore.id));
    setItemToRestore(null);
    showFeedback(`"${name}" was recovered and restored to active records.`);
  };

  // Single Delete Confirmation & Execution
  const handleConfirmSingleDelete = () => {
    if (!itemToDelete) return;
    const name = itemToDelete.title;
    onPermanentDelete(itemToDelete.id);
    setSelectedItemIds((prev) => prev.filter((i) => i !== itemToDelete.id));
    setItemToDelete(null);
    showFeedback(`"${name}" was permanently deleted from archives.`, 'info');
  };

  // Bulk Recover Execution
  const handleExecuteBulkRecover = () => {
    if (selectedItemIds.length === 0) return;
    const count = selectedItemIds.length;
    onBulkRecover(selectedItemIds);
    setSelectedItemIds([]);
    setIsBulkRestoreModalOpen(false);
    showFeedback(`Successfully recovered ${count} archived items back to active status.`);
  };

  // Bulk Delete Execution
  const handleExecuteBulkDelete = () => {
    if (selectedItemIds.length === 0) return;
    const count = selectedItemIds.length;
    onBulkPermanentDelete(selectedItemIds);
    setSelectedItemIds([]);
    setIsBulkDeleteModalOpen(false);
    showFeedback(`Permanently deleted ${count} selected items from archives.`, 'info');
  };

  // Source stream pill label formatting
  const getStreamSourceBadge = (type: ArchiveItemType, tags?: string[]) => {
    switch (type) {
      case 'product':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
            PRODUCTS
          </span>
        );
      case 'order':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-300 shadow-2xs">
            ORDERS
          </span>
        );
      case 'hub':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs">
            HUBS
          </span>
        );
      case 'custom':
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-50 text-purple-900 border border-purple-300 shadow-2xs">
            LEADS
          </span>
        );
      default:
        return (
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-stone-100 text-stone-700 border border-stone-300 shadow-2xs">
            RECORDS
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="admin-archive-vault-view">
      
      {/* 1. Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#4a170a] tracking-tight uppercase">
            Archive Vault
          </h1>
          <p className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-stone-500 mt-1">
            Data table of all archived orders, discontinued products, and past records.
          </p>
        </div>
      </div>

      {/* 2. Feedback Notification Toast */}
      {feedbackMessage && (
        <div 
          className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-stone-100 text-stone-800 border-stone-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Main Data Table Card Container */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        
        {/* Top Search & Filter Bar */}
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-center justify-between gap-4 border-b border-stone-100">
          
          {/* Search Box */}
          <div className="relative w-full lg:max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search archived items by ID, name, or metadata..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-8 py-2.5 rounded-2xl border border-stone-200 text-xs sm:text-sm font-medium focus:outline-none focus:border-[#4a170a] focus:ring-1 focus:ring-[#4a170a] bg-stone-50/50 hover:bg-white transition-colors placeholder:text-stone-400 text-[#4a170a]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Origin Filter Dropdown on Right */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <label className="text-[11px] font-mono font-bold tracking-wider uppercase text-stone-500 shrink-0">
              ORIGIN:
            </label>
            <div className="relative">
              <select
                value={selectedOriginFilter}
                onChange={(e) => setSelectedOriginFilter(e.target.value)}
                className="pl-4 pr-9 py-2 rounded-xl border border-stone-200 bg-white hover:border-stone-400 text-xs font-mono font-semibold text-stone-800 focus:outline-none focus:border-[#4a170a] appearance-none cursor-pointer shadow-2xs transition-colors"
              >
                <option value="all">All Origins</option>
                <option value="products">Products</option>
                <option value="orders">Orders</option>
                <option value="hubs">Bakery Hubs</option>
                <option value="leads">Leads / Inquiries</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Selected Items Status / Bulk Actions Bar */}
        <div className="px-5 py-2.5 bg-stone-50/80 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-stone-600 font-bold uppercase tracking-wider">
            <span className={`w-2 h-2 rounded-full ${selectedItemIds.length > 0 ? 'bg-[#d01617] animate-pulse' : 'bg-stone-300'}`} />
            <span>{selectedItemIds.length} ITEMS SELECTED</span>
          </div>

          {selectedItemIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBulkRestoreModalOpen(true)}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
              >
                <Undo2 className="w-3 h-3" />
                <span>Recover Selected</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Selected</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedItemIds([])}
                className="text-stone-400 hover:text-stone-600 underline text-[10px] cursor-pointer ml-1"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Structured Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-xs sm:text-sm">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-white border-b border-stone-200 text-stone-600 font-mono font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-4 sm:px-5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-stone-300 text-[#4a170a] focus:ring-0 accent-[#4a170a] cursor-pointer"
                    title="Select all"
                  />
                </th>
                <th className="py-4 px-4 min-w-[150px] whitespace-nowrap">
                  ARCHIVED ITEM ID
                </th>
                <th className="py-4 px-4 min-w-[160px] whitespace-nowrap">
                  ORIGINAL STREAM SOURCE
                </th>
                <th className="py-4 px-4 min-w-[280px]">
                  ENTITY LABEL NAME
                </th>
                <th className="py-4 px-4 min-w-[170px] whitespace-nowrap">
                  DELETED DATE/TIME
                </th>
                <th className="py-4 px-4 sm:px-6 text-center min-w-[130px] whitespace-nowrap">
                  CONTROL ACTIONS
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                      <Archive className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-base text-[#4a170a]">
                      No Archived Items Found
                    </div>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto font-mono">
                      {searchQuery
                        ? `No archive entries matched "${searchQuery}". Try a different keyword.`
                        : 'The archive vault is currently empty. Deleted orders and retired items will be stored here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isChecked = selectedItemIds.includes(item.id);
                  const displayId = item.referenceNumber || `ARC-${item.id.slice(0, 6).toUpperCase()}`;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        isChecked ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 sm:px-5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="w-4 h-4 rounded border-stone-300 text-[#4a170a] focus:ring-0 accent-[#4a170a] cursor-pointer"
                        />
                      </td>

                      {/* ARCHIVED ITEM ID */}
                      <td className="py-4 px-4 font-mono text-xs font-bold text-stone-700 whitespace-nowrap">
                        {displayId}
                      </td>

                      {/* ORIGINAL STREAM SOURCE */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getStreamSourceBadge(item.type, item.tags)}
                      </td>

                      {/* ENTITY LABEL NAME */}
                      <td className="py-4 px-4">
                        <div className="min-w-0">
                          <div className="font-bold text-[#4a170a] text-xs sm:text-sm">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-stone-500 truncate max-w-md font-mono mt-0.5">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* DELETED DATE/TIME */}
                      <td className="py-4 px-4 font-mono text-xs text-stone-700 whitespace-nowrap">
                        {item.archivedAt}
                      </td>

                      {/* CONTROL ACTIONS */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          
                          {/* Recover / Restore Action */}
                          <button
                            type="button"
                            onClick={() => handleSingleRecover(item)}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-emerald-600 bg-white hover:bg-emerald-50 text-stone-700 hover:text-emerald-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Recover item back to active operations"
                            aria-label="Recover item"
                          >
                            <Undo2 className="w-3.5 h-3.5 text-stone-700" />
                          </button>

                          {/* Permanent Delete Action */}
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="w-8 h-8 rounded-xl border border-stone-200 hover:border-red-400 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Permanently Delete Archive Record"
                            aria-label="Delete permanently"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
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

        {/* Table Footer with Pagination */}
        <div className="p-4 sm:px-6 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="font-mono text-stone-600 font-medium">
            Showing <span className="font-bold text-[#4a170a]">{startItemNumber}</span> to{' '}
            <span className="font-bold text-[#4a170a]">{endItemNumber}</span> of{' '}
            <span className="font-bold text-[#4a170a]">{filteredItems.length}</span> records
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
                      ? 'bg-[#18181b] text-white shadow-xs'
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

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: CONFIRM SINGLE RESTORE                      */}
      {/* ---------------------------------------------------- */}
      {itemToRestore && (
        <AdminConfirmationModal
          isOpen={!!itemToRestore}
          portalName="DATABASE RECOVERY PORTAL"
          title="RESTORE ARCHIVED RECORD"
          message={
            <p>
              Are you sure you want to restore record <strong className="font-mono font-bold text-[#4a170a]">{itemToRestore.referenceNumber || itemToRestore.id}</strong>? This item will be recovered and returned to the active <strong className="font-mono font-bold text-[#4a170a]">{itemToRestore.type === 'product' ? 'PRODUCTS' : itemToRestore.type === 'order' ? 'ORDERS' : itemToRestore.type === 'hub' ? 'HUBS' : 'LEADS'}</strong> data stream.
            </p>
          }
          cancelText="CANCEL"
          confirmText="YES, RESTORE RECORD"
          confirmVariant="success"
          onClose={() => setItemToRestore(null)}
          onConfirm={handleConfirmSingleRecover}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: CONFIRM BULK RESTORE                        */}
      {/* ---------------------------------------------------- */}
      {isBulkRestoreModalOpen && (
        <AdminConfirmationModal
          isOpen={isBulkRestoreModalOpen}
          portalName="DATABASE RECOVERY PORTAL"
          title="RESTORE ARCHIVED RECORDS"
          message={
            <p>
              Are you sure you want to restore <strong className="font-mono font-bold text-[#4a170a]">{selectedItemIds.length}</strong> selected records? These items will be recovered and returned to their respective active operations data streams.
            </p>
          }
          cancelText="CANCEL"
          confirmText={`YES, RESTORE ${selectedItemIds.length} RECORDS`}
          confirmVariant="success"
          onClose={() => setIsBulkRestoreModalOpen(false)}
          onConfirm={handleExecuteBulkRecover}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: CONFIRM SINGLE PERMANENT DELETE             */}
      {/* ---------------------------------------------------- */}
      {itemToDelete && (
        <AdminConfirmationModal
          isOpen={!!itemToDelete}
          portalName="DATABASE ARCHIVE PURGE"
          title="PERMANENTLY DELETE RECORD"
          message={
            <p>
              Are you sure you want to permanently delete record <strong className="font-mono font-bold text-[#4a170a]">{itemToDelete.referenceNumber || itemToDelete.id}</strong> (<span className="font-bold">{itemToDelete.title}</span>)? This item will be wiped permanently from database archives and cannot be recovered.
            </p>
          }
          cancelText="CANCEL"
          confirmText="YES, PERMANENTLY DELETE"
          confirmVariant="danger"
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmSingleDelete}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: CONFIRM BULK PERMANENT DELETE               */}
      {/* ---------------------------------------------------- */}
      {isBulkDeleteModalOpen && (
        <AdminConfirmationModal
          isOpen={isBulkDeleteModalOpen}
          portalName="DATABASE ARCHIVE PURGE"
          title="PERMANENTLY DELETE RECORDS"
          message={
            <p>
              Are you sure you want to permanently purge <strong className="font-mono font-bold text-[#4a170a]">{selectedItemIds.length}</strong> selected archived records? All selected items will be completely purged from database storage without recovery capability.
            </p>
          }
          cancelText="CANCEL"
          confirmText={`YES, DELETE ${selectedItemIds.length} RECORDS`}
          confirmVariant="danger"
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleExecuteBulkDelete}
        />
      )}

    </div>
  );
};
