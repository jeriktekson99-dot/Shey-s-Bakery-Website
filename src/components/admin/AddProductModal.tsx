import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { AdminProduct } from './types';
import { ProductImageUploader } from './ProductImageUploader';
import { generateUniqueId } from '../../data/bakeryStore';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: AdminProduct) => void;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80';

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'Pastries' | 'Breads' | 'Pies & Tarts' | 'Specialties & Snacks'>('Pastries');
  const [basePrice, setBasePrice] = useState<string | number>('450');
  const [images, setImages] = useState<string[]>([DEFAULT_IMAGE]);
  const [description, setDescription] = useState('');
  const [box10, setBox10] = useState(true);
  const [box15, setBox15] = useState(true);
  const [box20, setBox20] = useState(false);
  const [inStock, setInStock] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const boxVariants: ('Box of 10' | 'Box of 15' | 'Box of 20')[] = [];
    if (box10) boxVariants.push('Box of 10');
    if (box15) boxVariants.push('Box of 15');
    if (box20) boxVariants.push('Box of 20');

    const primaryImage = images.length > 0 ? images[0] : DEFAULT_IMAGE;
    const parsedPrice = parseFloat(String(basePrice));
    const finalBasePrice = isNaN(parsedPrice) || parsedPrice < 0 ? 0 : parsedPrice;

    const newProd: AdminProduct = {
      id: generateUniqueId('prod'),
      name: name.trim(),
      category,
      basePrice: finalBasePrice,
      image: primaryImage,
      images: images.length > 0 ? images : [primaryImage],
      boxVariants,
      leadTime: '24 hrs',
      inStock,
      allergens: [],
      description: description.trim()
    };

    onAddProduct(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-800/10 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Warm Bakery Top Banner Header */}
        <div className="bg-[#4a170a] px-5 sm:px-6 py-4 flex items-center justify-between shrink-0 text-white border-b border-[#381005]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-[#4a170a] flex items-center justify-center font-black shadow-xs">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-serif font-black tracking-normal text-amber-50">
                Add New Bakery Product
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-amber-200/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-5 bg-[#fffdfa]">
          
          {/* Row 1: Product Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                Product Display Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Pain au Chocolat / Basque Cheesecake"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d01617] focus:ring-1 focus:ring-[#d01617] placeholder:text-stone-400 bg-white text-[#4a170a]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                Category / Segment <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d01617] bg-white text-stone-800"
              >
                <option value="Pastries">Pastries</option>
                <option value="Breads">Breads</option>
                <option value="Pies & Tarts">Pies & Tarts</option>
                <option value="Specialties & Snacks">Specialties & Snacks</option>
              </select>
            </div>
          </div>

          {/* Row 2: Base Price & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                Base Price (₱) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400 font-mono">₱</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="e.g. 450"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f] focus:ring-1 focus:ring-[#d94d2f] bg-white text-[#4a170a]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
                Initial Status <span className="text-red-500">*</span>
              </label>
              <select
                value={inStock ? 'true' : 'false'}
                onChange={(e) => setInStock(e.target.value === 'true')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d01617] bg-white text-stone-800"
              >
                <option value="true">Active & In Stock (Ready for Dispatch)</option>
                <option value="false">Sold Out / Oven Resting</option>
              </select>
            </div>
          </div>

          {/* Box Packaging Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-2">
              Box Packaging Variants Available
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                box10 ? 'bg-amber-50/80 border-amber-300 text-[#4a170a] shadow-xs' : 'border-stone-200 bg-stone-50/50 text-stone-600'
              }`}>
                <input
                  type="checkbox"
                  checked={box10}
                  onChange={(e) => setBox10(e.target.checked)}
                  className="w-4 h-4 rounded text-[#d01617] focus:ring-0 accent-[#d01617]"
                />
                <span className="text-xs font-semibold">Box of 10</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                box15 ? 'bg-amber-50/80 border-amber-300 text-[#4a170a] shadow-xs' : 'border-stone-200 bg-stone-50/50 text-stone-600'
              }`}>
                <input
                  type="checkbox"
                  checked={box15}
                  onChange={(e) => setBox15(e.target.checked)}
                  className="w-4 h-4 rounded text-[#d01617] focus:ring-0 accent-[#d01617]"
                />
                <span className="text-xs font-semibold">Box of 15</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                box20 ? 'bg-amber-50/80 border-amber-300 text-[#4a170a] shadow-xs' : 'border-stone-200 bg-stone-50/50 text-stone-600'
              }`}>
                <input
                  type="checkbox"
                  checked={box20}
                  onChange={(e) => setBox20(e.target.checked)}
                  className="w-4 h-4 rounded text-[#d01617] focus:ring-0 accent-[#d01617]"
                />
                <span className="text-xs font-semibold">Box of 20</span>
              </label>
            </div>
          </div>

          {/* Asset Media Gallery (Multiple Images) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a]">
                Product Media Gallery (Unlimited Images) <span className="text-red-500">*</span>
              </label>
            </div>
            <ProductImageUploader
              images={images}
              onChange={setImages}
              maxImages={8}
            />
          </div>

          {/* Product Scope & Details - Placed Last */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#4a170a] mb-1.5">
              Product Scope & Details <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the texture, crumb, premium butter layers, artisanal technique, and flavor notes..."
              className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm font-medium focus:outline-none focus:border-[#d94d2f] focus:ring-1 focus:ring-[#d94d2f] bg-white text-[#4a170a] placeholder:text-stone-400 resize-y"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-xs sm:text-sm font-bold uppercase tracking-wider text-stone-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#d01617] hover:bg-[#b01011] text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Save & Publish Product
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
