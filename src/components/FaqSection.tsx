import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '../data/bakeryData';

export const FaqSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faqs" className="py-14 sm:py-20 bg-[#faf5ea]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-10 sm:mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#552110] tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        {/* Minimalist Border-Divided FAQ Accordion matching reference image */}
        <div className="border-t border-[#e3d7c3]">
          {FAQS.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                key={faq.id}
                className="border-b border-[#e3d7c3] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full text-left py-4 sm:py-5 flex items-center justify-between gap-4 focus:outline-none cursor-pointer group"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#622a16] group-hover:text-[#d01617] transition-colors leading-snug">
                    {faq.question}
                  </span>
                  
                  {/* Subtle chevron indicator matching reference style */}
                  <ChevronDown
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-[#865942] shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#552110]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="pb-5 sm:pb-6 text-[#7d5641] text-base sm:text-lg leading-relaxed font-sans pr-8 sm:pr-12 animate-fadeIn">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

