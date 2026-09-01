import React from 'react';

interface AboutUsPageProps {
  onExploreBakes?: () => void;
  onNavigateHome: () => void;
}

export const AboutUsPage: React.FC<AboutUsPageProps> = () => {
  return (
    <div className="bg-[#faf5ea] text-[#552110] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-[#552110] tracking-tight leading-tight">
            About Us
          </h1>
        </div>

        {/* Story & What We Offer Rows */}
        <div className="space-y-16 sm:space-y-24 mb-16 sm:mb-20">
          
          {/* Row 1: How We Started (Image-Left / Text-Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Image */}
            <div className="lg:col-span-6">
              <div className="aspect-[25/22] sm:aspect-[50/33] w-full rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] relative shadow-[0px_8px_0px_#542515] transition-all duration-300">
                <img
                  src="https://lh3.googleusercontent.com/d/1lhnWkakAVfJjxUu4Ezd4oLCPERlnhvw5"
                  alt="How We Started - Shey Bakery"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('lh3.googleusercontent.com')) {
                      target.src = 'https://drive.google.com/thumbnail?id=1lhnWkakAVfJjxUu4Ezd4oLCPERlnhvw5&sz=w1200';
                    }
                  }}
                />
              </div>
            </div>

            {/* Right Text */}
            <div className="lg:col-span-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#552110] mb-4 leading-snug">
                  How We Started
                </h2>
                <div className="space-y-4 text-[#7d5641] text-base sm:text-lg leading-relaxed font-sans">
                  <p>
                    Shey Bakery opened in May 2017 with a simple goal: to serve warm, delicious bread to our neighborhood every day. We started with our popular Morning Pandesal and soon began baking hot pandesal straight into the afternoon.
                  </p>
                  <p>
                    Over the years, our menu has grown to include classic favorites like traditional breads, creamy egg pie, soft custard cookies, plain tasty, and special daily loaves. Whether you need a quick morning bite or a sweet treat later in the day, we have something special for every craving.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: What We Offer (Text-Left / Image-Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Text */}
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#552110] mb-4 leading-snug">
                  What We Offer
                </h2>
                <div className="space-y-4 text-[#7d5641] text-base sm:text-lg leading-relaxed font-sans">
                  <p>
                    We bake fresh every single day so you can always enjoy warm, high-quality bread straight from our local ovens. From early morning breakfast favorites to simple afternoon treats, there is always something warm, comforting, and delicious waiting on our shelves for you.
                  </p>
                  <p>
                    We keep our prices friendly and affordable so everyone in our local neighborhood can enjoy fresh baked goods whenever they drop by. It brings us true happiness to share honest, tasty food with our entire community every single day without breaking the bank.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="aspect-[25/22] sm:aspect-[50/33] w-full rounded-2xl overflow-hidden border-2 border-[#542515] bg-[#eadecc] relative shadow-[0px_8px_0px_#542515] transition-all duration-300">
                <img
                  src="https://lh3.googleusercontent.com/d/11wrFwWlrBMVEJhrfpSUAeBHV_u-Q2Q3y"
                  alt="What We Offer - Shey Bakery"
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.includes('lh3.googleusercontent.com')) {
                      target.src = 'https://drive.google.com/thumbnail?id=11wrFwWlrBMVEJhrfpSUAeBHV_u-Q2Q3y&sz=w1200';
                    }
                  }}
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

