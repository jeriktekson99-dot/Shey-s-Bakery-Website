import React from 'react';
import { X, ShoppingBag, Truck, CreditCard, Smile, CheckCircle, ArrowRight } from 'lucide-react';
import { HOW_TO_ORDER_STEPS } from '../data/bakeryData';

interface HowToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOrdering: () => void;
}

export const HowToOrderModal: React.FC<HowToOrderModalProps> = ({
  isOpen,
  onClose,
  onStartOrdering,
}) => {
  if (!isOpen) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShoppingBag': return <ShoppingBag className="w-6 h-6 text-[#d01617]" />;
      case 'Truck': return <Truck className="w-6 h-6 text-[#d01617]" />;
      case 'CreditCard': return <CreditCard className="w-6 h-6 text-[#d01617]" />;
      case 'Smile': return <Smile className="w-6 h-6 text-[#d01617]" />;
      default: return <ShoppingBag className="w-6 h-6 text-[#d01617]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-amber-100 relative">
        
        {/* Header */}
        <div className="p-6 bg-[#4a170a] text-white flex items-center justify-between border-b border-amber-900/40">
          <div>
            <span className="text-xs font-bold text-[#d94d2f] uppercase tracking-wider">Simple & Fast</span>
            <h3 className="font-serif text-2xl font-bold text-amber-50">How to Order at Shey's Bakery</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-200/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
            Follow our 4 easy steps to get fresh artisanal breads and pastries delivered straight from our ovens to your doorstep:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HOW_TO_ORDER_STEPS.map((step) => (
              <div
                key={step.step}
                className="p-5 bg-[#faf7f2] rounded-2xl border border-amber-200/60 flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0 shadow-xs">
                  {getIcon(step.iconName)}
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-[#d01617] uppercase tracking-wider">Step 0{step.step}</span>
                  <h4 className="font-bold text-base text-[#4a170a] mt-0.5">{step.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-[#4a170a] space-y-1">
            <p className="font-bold">⏰ Oven Schedule Note:</p>
            <p>Our main batch of sourdough and French croissants comes out fresh at 6:00 AM daily. Pre-order before 8:00 AM for guaranteed same-day delivery!</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                onClose();
                onStartOrdering();
              }}
              className="w-full sm:w-auto bg-[#d01617] hover:bg-[#b01011] text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Fresh Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
