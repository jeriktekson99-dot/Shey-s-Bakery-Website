import React, { useState, useEffect } from 'react';
import { Instagram, Facebook, Mail, MapPin, Phone, ShieldCheck, X } from 'lucide-react';
import { BRAND_LOGO } from '../data/bakeryData';
import { getSocialLinks, StoreSocialLinks, DEFAULT_SOCIAL_LINKS } from '../data/bakeryStore';

interface FooterProps {
  onNavigateToSection: (sectionId: string) => void;
  onNavigateToCatalog?: (category?: string) => void;
  onNavigateToFaqs?: () => void;
  onNavigateToHowToOrder?: () => void;
  onNavigateToAboutUs?: () => void;
  onNavigateToAdmin?: () => void;
  onOpenHowToOrder: () => void;
  onOpenAboutUs: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateToSection,
  onNavigateToCatalog,
  onNavigateToFaqs,
  onNavigateToHowToOrder,
  onNavigateToAboutUs,
  onNavigateToAdmin,
  onOpenHowToOrder,
  onOpenAboutUs,
}) => {
  const [activeModal, setActiveModal] = useState<'privacy' | 'contact' | null>(null);
  const [socialLinks, setSocialLinks] = useState<StoreSocialLinks>(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    setSocialLinks(getSocialLinks());

    const handleUpdate = () => {
      setSocialLinks(getSocialLinks());
    };

    window.addEventListener('sheys_social_links_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sheys_social_links_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleLogoClick = () => {
    onNavigateToSection('hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCatalogClick = (category: string = 'All Products') => {
    if (onNavigateToCatalog) {
      onNavigateToCatalog(category);
    } else {
      onNavigateToSection('whats-new');
    }
  };

  const handleFaqsClick = () => {
    if (onNavigateToFaqs) {
      onNavigateToFaqs();
    } else {
      onNavigateToSection('faqs');
    }
  };

  const handleHowToOrderClick = () => {
    if (onNavigateToHowToOrder) {
      onNavigateToHowToOrder();
    } else {
      onOpenHowToOrder();
    }
  };

  const handleAboutUsClick = () => {
    if (onNavigateToAboutUs) {
      onNavigateToAboutUs();
    } else {
      onOpenAboutUs();
    }
  };

  return (
    <footer className="bg-[#faf5ea] text-[#4a170a] pt-14 pb-10 border-t border-[#ebdcd0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
        
        {/* 1. Top Logo & Brand Identity */}
        <div className="flex flex-col items-center justify-center mb-7">
          <button
            onClick={handleLogoClick}
            className="group flex items-center justify-center cursor-pointer focus:outline-none"
            aria-label="Shey's Bakery Home"
          >
            <img
              src={BRAND_LOGO.src}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = BRAND_LOGO.fallbackSrc;
              }}
              alt={BRAND_LOGO.alt}
              referrerPolicy="no-referrer"
              className="h-16 sm:h-[74px] w-auto object-contain group-hover:scale-105 transition-transform rounded-lg"
            />
          </button>
        </div>

        {/* 2. Social Media & Contact Icons (No circles) */}
        <div className="flex items-center justify-center gap-5 sm:gap-6 mb-7">
          <a
            href={socialLinks.facebook || "https://facebook.com/sheysbakeryofficial"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#552110] hover:text-[#d01617] transition-all duration-200 hover:scale-110 p-1"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5 sm:w-6 sm:h-6" />
          </a>

          <a
            href={socialLinks.instagram || "https://instagram.com/sheysbakery.ph"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#552110] hover:text-[#d01617] transition-all duration-200 hover:scale-110 p-1"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5 sm:w-6 sm:h-6" />
          </a>

          <a
            href={socialLinks.tiktok || "https://tiktok.com/@sheysbakery"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#552110] hover:text-[#d01617] transition-all duration-200 hover:scale-110 p-1 flex items-center justify-center"
            aria-label="TikTok"
            title="TikTok"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 sm:w-6 sm:h-6 fill-current transition-colors"
              aria-hidden="true"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
            </svg>
          </a>
        </div>

        {/* 3. Centered Horizontal Navigation Links */}
        <nav className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-center mb-5">
          <button
            type="button"
            onClick={() => handleCatalogClick('All Products')}
            className="font-serif sm:font-sans font-bold sm:font-semibold text-sm sm:text-base text-[#4a170a] hover:text-[#d01617] transition-colors cursor-pointer"
          >
            All Products
          </button>

          <button
            type="button"
            onClick={handleHowToOrderClick}
            className="font-serif sm:font-sans font-bold sm:font-semibold text-sm sm:text-base text-[#4a170a] hover:text-[#d01617] transition-colors cursor-pointer"
          >
            How to Order
          </button>

          <button
            type="button"
            onClick={handleFaqsClick}
            className="font-serif sm:font-sans font-bold sm:font-semibold text-sm sm:text-base text-[#4a170a] hover:text-[#d01617] transition-colors cursor-pointer"
          >
            FAQs
          </button>

          <button
            type="button"
            onClick={handleAboutUsClick}
            className="font-serif sm:font-sans font-bold sm:font-semibold text-sm sm:text-base text-[#4a170a] hover:text-[#d01617] transition-colors cursor-pointer"
          >
            About Us
          </button>

          <button
            type="button"
            onClick={() => {
              if (onNavigateToAdmin) {
                onNavigateToAdmin();
              }
            }}
            className="font-serif sm:font-sans font-bold sm:font-semibold text-sm sm:text-base text-[#4a170a] hover:text-[#d01617] transition-colors cursor-pointer"
          >
            Portal
          </button>
        </nav>

        {/* 4. Bottom Copyright Row */}
        <div className="w-full pt-0 flex flex-col sm:flex-row items-center justify-center text-xs text-stone-500 text-center">
          <p>
            © {new Date().getFullYear()} Shey's Bakery | All Rights Reserved
          </p>
        </div>

      </div>

      {/* Contact & Store Info Modal */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf7ed] rounded-2xl border-2 border-[#552110] max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#552110] hover:bg-amber-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-serif text-2xl font-bold text-[#552110] mb-4">
              Get in Touch
            </h3>
            
            <div className="space-y-4 text-sm text-[#4a170a]">
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                <MapPin className="w-5 h-5 text-[#d01617] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Main Bakery Kitchen & Dispatch</p>
                  <p className="text-stone-600 text-xs">128 Artisan Way, Pasig City / QC Kitchen Hub, Metro Manila</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                <Phone className="w-5 h-5 text-[#d01617] shrink-0" />
                <div>
                  <p className="font-bold">Hotline & Inquiries</p>
                  <p className="text-stone-600 text-xs">+63 (02) 8888-SHEY / +63 917 123 4567</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                <Mail className="w-5 h-5 text-[#d01617] shrink-0" />
                <div>
                  <p className="font-bold">Customer Care</p>
                  <p className="text-stone-600 text-xs">hello@sheysbakery.ph</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-6 w-full py-2.5 bg-[#552110] text-[#fbf7ed] font-bold rounded-xl hover:bg-[#3d1408] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Privacy Policy & Terms Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#fbf7ed] rounded-2xl border-2 border-[#552110] max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#552110] hover:bg-amber-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-6 h-6 text-[#d01617]" />
              <h3 className="font-serif text-2xl font-bold text-[#552110]">
                Privacy Policy & Terms
              </h3>
            </div>
            
            <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
              <p>
                <strong>Information Collection:</strong> Shey's Bakery values your trust. When placing an artisan pastry order, we collect essential details (customer name, delivery address, contact number, and baking fulfillment dates) strictly to prepare and deliver your items with utmost freshness.
              </p>
              <p>
                <strong>Payment Security:</strong> Payment proofs (GCash, BDO, BPI) and cash-on-delivery records are securely handled through encrypted channels and verified by our kitchen operations team.
              </p>
              <p>
                <strong>Freshness Guarantee:</strong> Due to the handcrafted, perishable nature of our sourdoughs and French pastries, order schedule modifications or cancellations should be submitted before the 1:00 PM cutoff prior to the delivery date.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="mt-6 w-full py-2.5 bg-[#552110] text-[#fbf7ed] font-bold rounded-xl hover:bg-[#3d1408] transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

    </footer>
  );
};

