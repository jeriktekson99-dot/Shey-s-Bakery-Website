import React from 'react';
import { FAQS } from '../data/bakeryData';

interface FaqPageProps {
  onOpenHowToOrder?: () => void;
  onNavigateHome: () => void;
}

export const FaqPage: React.FC<FaqPageProps> = () => {
  return (
    <div className="bg-[#faf5ea] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Heading */}
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-black text-[#552110] tracking-tight mb-8">
          Frequently Asked Questions
        </h1>

        {/* Flat Text FAQ Content - Numbered */}
        <div className="space-y-6">
          {FAQS.map((faq, index) => (
            <div key={faq.id} className="space-y-1.5">
              <h2 className="font-serif text-[17px] sm:text-[20px] font-bold text-[#552110]">
                {index + 1}. {faq.question}
              </h2>
              <p className="text-[#7d5641] text-[14px] sm:text-[17px] leading-relaxed font-sans">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};




