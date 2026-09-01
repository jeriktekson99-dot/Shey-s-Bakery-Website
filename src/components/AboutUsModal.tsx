import React from 'react';
import { X, ChefHat, Heart, Sparkles } from 'lucide-react';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#faf5ea] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border-2 border-[#552110] relative">
        
        {/* Header */}
        <div className="p-6 bg-[#4a170a] text-white flex items-center justify-between border-b border-amber-900/40">
          <div className="flex items-center gap-2.5">
            <ChefHat className="w-7 h-7 text-[#d94d2f]" />
            <div>
              <span className="text-xs font-bold text-[#d94d2f] uppercase tracking-wider">Our Story</span>
              <h3 className="font-serif text-2xl font-bold text-amber-50">About Shey Bakery</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-amber-200/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6 text-[#552110]">
          {/* How We Started */}
          <div className="space-y-2">
            <h4 className="font-serif text-xl font-bold text-[#552110]">How We Started</h4>
            <div className="space-y-2.5 text-sm sm:text-base leading-relaxed text-[#7d5641]">
              <p>
                Shey Bakery opened in May 2017 with a simple goal: to serve warm, delicious bread to our neighborhood every day. We started with our popular Morning Pandesal and soon began baking hot pandesal straight into the afternoon.
              </p>
              <p>
                Over the years, our menu has grown to include classic favorites like traditional breads, creamy egg pie, soft custard pianono, plain tasty, and special daily loaves. Whether you need a quick morning bite or a sweet treat later in the day, we have something special for every craving.
              </p>
            </div>
          </div>

          {/* What We Offer */}
          <div className="space-y-2 pt-2 border-t border-[#ebdcd0]">
            <h4 className="font-serif text-xl font-bold text-[#552110]">What We Offer</h4>
            <div className="space-y-2.5 text-sm sm:text-base leading-relaxed text-[#7d5641]">
              <p>
                We bake fresh every single day so you always get warm, high-quality bread straight from the oven. From breakfast favorites to afternoon snacks, there is always something warm and comforting waiting for you.
              </p>
              <p>
                We keep our prices affordable so everyone in our community can enjoy fresh, delicious baked goods whenever they visit. It brings us real joy to share great food with our neighbors without breaking the bank.
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3">
            <Heart className="w-6 h-6 text-[#d01617] shrink-0" />
            <p className="text-xs text-stone-700 font-medium">
              Serving warm, fresh, and affordable baked favorites to our neighborhood since May 2017.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

