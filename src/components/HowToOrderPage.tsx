import React from 'react';

interface HowToOrderPageProps {
  onStartShopping?: () => void;
  onNavigateHome: () => void;
  onNavigateFaqs?: () => void;
}

export const HowToOrderPage: React.FC<HowToOrderPageProps> = () => {
  return (
    <div className="bg-[#faf5ea] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Heading */}
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-[#552110] tracking-tight mb-8">
          How to Order & Bakery Policies
        </h1>

        {/* Flat Text Content - Numbered */}
        <div className="space-y-6 text-[#552110]">
          <section className="space-y-1.5">
            <h2 className="font-serif text-[17px] sm:text-[20px] font-bold text-[#552110]">
              1. Choose Your Items
            </h2>
            <p className="text-[#7d5641] text-[14px] sm:text-[17px] leading-relaxed font-sans">
              Browse our fresh sourdoughs, pastries, and cakes. Select any extras you want, adjust your quantities, and click "Add to Cart" to start your order.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-serif text-[17px] sm:text-[20px] font-bold text-[#552110]">
              2. Pick Delivery or Store Pickup
            </h2>
            <p className="text-[#7d5641] text-[14px] sm:text-[17px] leading-relaxed font-sans">
              Choose doorstep delivery across Cavite (Zone #1: ₱100, Zone #2: ₱140, Zone #3: ₱180, or free for orders over ₱1,500) or pick up your order directly from our bakery counter. You can schedule your delivery date up to 14 days in advance, or pick up your order during bakery operating hours.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-serif text-[17px] sm:text-[20px] font-bold text-[#552110]">
              3. Enter Your Details
            </h2>
            <p className="text-[#7d5641] text-[14px] sm:text-[17px] leading-relaxed font-sans">
              Fill in your contact information and delivery address. Double-check your mobile number so our driver can reach you, and feel free to add delivery notes or a gift message.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-serif text-[17px] sm:text-[20px] font-bold text-[#552110]">
              4. Pay Securely
            </h2>
            <p className="text-[#7d5641] text-[14px] sm:text-[17px] leading-relaxed font-sans">
              Pay instantly using GCash, Maya, credit/debit card, or bank transfer. If you select store pickup, you can also pay with cash or card when you collect your order.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="font-serif text-[17px] sm:text-[20px] font-bold text-[#552110]">
              5. Track Your Order
            </h2>
            <p className="text-[#7d5641] text-[14px] sm:text-[17px] leading-relaxed font-sans">
              You will receive an instant email and SMS receipt after checkout. As soon as your order is on the way, we will text you a link to track your driver in real time.
            </p>
          </section>

          <section className="space-y-1.5 pt-4 border-t border-[#e3d7c3]">
            <h2 className="font-serif text-[17px] sm:text-[20px] font-bold text-[#552110]">
              6. Baking Cut-Off & Policies
            </h2>
            <p className="text-[#7d5641] text-[14px] sm:text-[17px] leading-relaxed font-sans">
              Order before <strong className="text-[#552110]">1:00 PM</strong> for next-day delivery or pickup so our team can bake your items fresh overnight. For weekend events, we recommend ordering 2 to 3 days in advance to secure your preferred time.
            </p>
          </section>
        </div>

      </div>
    </div>
  );
};


