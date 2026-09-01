import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface AdminConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  portalName?: string;
  title: string;
  message: React.ReactNode;
  cancelText?: string;
  confirmText: string;
  confirmVariant?: 'danger' | 'primary' | 'success' | 'warning';
  isLoading?: boolean;
}

export const AdminConfirmationModal: React.FC<AdminConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  portalName = 'DATABASE CONTROL PORTAL',
  title,
  message,
  cancelText = 'CANCEL',
  confirmText,
  confirmVariant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  // Variant styling for the primary confirmation button
  const getConfirmButtonClasses = () => {
    switch (confirmVariant) {
      case 'success':
        return 'bg-[#0d381e] hover:bg-[#082614] text-white border border-[#0d381e] shadow-sm';
      case 'danger':
        return 'bg-[#d01617] hover:bg-[#b01011] text-white border border-[#d01617] shadow-sm';
      case 'warning':
        return 'bg-[#c26d0a] hover:bg-[#9e5704] text-white border border-[#c26d0a] shadow-sm';
      case 'primary':
      default:
        return 'bg-[#4a170a] hover:bg-[#361007] text-white border border-[#4a170a] shadow-sm';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
        {/* Backdrop click dismiss */}
        <div 
          className="fixed inset-0" 
          onClick={isLoading ? undefined : onClose}
          aria-hidden="true" 
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-[#faf7f2] shadow-2xl border border-stone-800/15 flex flex-col"
          role="dialog"
          aria-modal="true"
        >
          {/* 1. Header Banner (Dark bakery / database theme with gold eyebrow and gold bottom accent line) */}
          <div className="bg-[#1c0c07] px-6 sm:px-7 py-5 text-white border-b-2 border-[#d4a359]">
            <div className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-[#e8b960] uppercase mb-1">
              {portalName}
            </div>
            <h3 className="font-serif font-black text-lg sm:text-xl tracking-wide text-stone-100 uppercase">
              {title}
            </h3>
          </div>

          {/* 2. Body Text Area */}
          <div className="p-6 sm:p-7 text-sm sm:text-base text-[#4a170a] leading-relaxed font-sans bg-white/90">
            {typeof message === 'string' ? (
              <p className="text-stone-700">{message}</p>
            ) : (
              message
            )}
          </div>

          {/* 3. Footer Actions (Cancel Outline + Bold Uppercase Confirm Button) */}
          <div className="px-6 sm:px-7 py-4.5 bg-[#f5efe6] border-t border-stone-200/80 flex items-center justify-end gap-3.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-6 py-2.5 rounded-2xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300/80 font-mono font-bold text-xs sm:text-sm tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-98 disabled:opacity-50"
            >
              {cancelText}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                onConfirm();
              }}
              className={`px-6 py-2.5 rounded-2xl font-mono font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-xs hover:shadow-md active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 ${getConfirmButtonClasses()}`}
            >
              {isLoading && (
                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
