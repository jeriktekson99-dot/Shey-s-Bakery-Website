import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroSlide {
  id: string;
  image: string;
  alt: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    image: 'https://lh3.googleusercontent.com/d/1L0xNqgYcQbWS11APDsNZf9fFeuIy77UD',
    alt: "Shey's Bakery Featured Showcase Banner 1",
  },
  {
    id: 'slide-2',
    image: 'https://lh3.googleusercontent.com/d/1FtaENVn623DVdlFJGleBAlwxgX8UGGDc',
    alt: "Shey's Bakery Featured Showcase Banner 2",
  },
];

interface HeroProps {
  onShopNow?: () => void;
  onOpenHowToOrder?: () => void;
}

export const Hero: React.FC<HeroProps> = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Auto slide every 5 seconds when not hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, handleNext]);

  return (
    <section 
      id="hero" 
      className="w-full bg-[#1c0803] text-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Hero Carousel Stage: 2:1 natural aspect ratio to display full banner without cropping */}
      <div className="relative w-full aspect-[2/1] overflow-hidden bg-[#1c0803]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0.2 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.2 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full"
          >
            <img
              src={HERO_SLIDES[currentSlide].image}
              alt={HERO_SLIDES[currentSlide].alt}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.includes('lh3.googleusercontent.com/d/')) {
                  const id = target.src.split('/d/')[1];
                  target.src = `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
                }
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 2. Controls Section: Arrow buttons and dot circles below the hero section */}
      <div className="bg-[#faf5ea] py-3 px-4 flex items-center justify-center gap-4 sm:gap-7" id="hero-carousel-controls">
        {/* Previous Arrow Button - pure arrow icon */}
        <button
          onClick={handlePrev}
          className="text-[#542515] hover:text-[#d01617] active:scale-90 transition-all p-1 cursor-pointer focus:outline-none flex items-center justify-center"
          aria-label="Previous image"
          id="hero-prev-arrow-btn"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
        </button>

        {/* Circle Dots representing the slides: Active solid brown dot, inactive hollow ring circles */}
        <div className="flex items-center gap-2 sm:gap-3" id="hero-dots-container">
          {HERO_SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                idx === currentSlide
                  ? 'w-2 h-2 sm:w-2.5 sm:h-2.5 bg-[#642a1b]'
                  : 'w-2 h-2 sm:w-2.5 sm:h-2.5 border border-[#bfa28d] bg-transparent hover:border-[#642a1b]'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
              id={`hero-dot-${idx}`}
            />
          ))}
        </div>

        {/* Next Arrow Button - pure arrow icon */}
        <button
          onClick={handleNext}
          className="text-[#542515] hover:text-[#d01617] active:scale-90 transition-all p-1 cursor-pointer focus:outline-none flex items-center justify-center"
          aria-label="Next image"
          id="hero-next-arrow-btn"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
        </button>
      </div>

      {/* 3. Section Line at the bottom after the button and small dots */}
      <div className="w-full border-b border-[#ebdcd0]" id="hero-section-divider" />
    </section>
  );
};


