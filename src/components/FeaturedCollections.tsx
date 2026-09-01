import React from 'react';
import { COLLECTIONS } from '../data/bakeryData';
import { getOptimizedImageUrl } from '../lib/imageOptimization';

interface FeaturedCollectionsProps {
  onSelectCollection: (categoryName: string) => void;
}

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({ onSelectCollection }) => {
  return (
    <section id="collections" className="py-12 sm:py-16 bg-[#faf5ea]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-left mb-8 sm:mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#552110] tracking-tight">
            Featured Collections
          </h2>
        </div>

        {/* 2x2 Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {COLLECTIONS.map((col) => (
            <div
              key={col.id}
              onClick={() => onSelectCollection(col.categoryFilter)}
              className="group flex flex-col cursor-pointer transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/10] w-full rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] relative shadow-[0px_6px_0px_#542515] group-hover:shadow-[0px_8px_0px_#542515] transition-all duration-300">
                <img
                  src={getOptimizedImageUrl(col.image, { width: 700, quality: 75 })}
                  alt={col.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('lh3.googleusercontent.com/d/')) {
                      const id = target.src.split('/d/')[1];
                      target.src = `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
                    }
                  }}
                />
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg lg:text-xl text-[#552110] group-hover:text-[#d01617] transition-colors mt-3 flex items-center gap-1.5">
                <span>{col.title}</span>
                <span className="text-[#552110] font-sans text-base transition-transform group-hover:translate-x-1">→</span>
              </h3>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};


