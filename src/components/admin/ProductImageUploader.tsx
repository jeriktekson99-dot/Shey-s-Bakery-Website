import React, { useRef, useState } from 'react';
import { ImageIcon, ImagePlus, X, Star, AlertCircle, Sparkles } from 'lucide-react';
import { compressAndResizeImage, DEFAULT_FALLBACK_IMAGE } from '../../lib/imageOptimization';

interface ProductImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  images,
  onChange,
  maxImages = 8
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const validFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (validFiles.length === 0) {
      setUploadError('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    // Limit individual file size to 8MB before compression
    const oversized = validFiles.find(f => f.size > 8 * 1024 * 1024);
    if (oversized) {
      setUploadError(`File "${oversized.name}" exceeds the 8MB initial limit.`);
      return;
    }

    if (images.length + validFiles.length > maxImages) {
      setUploadError(`You can upload a maximum of ${maxImages} images.`);
    }

    const filesToRead = validFiles.slice(0, Math.max(0, maxImages - images.length));
    setIsCompressing(true);

    try {
      // Compress and resize each image to max 1024x1024 WebP/JPEG (reducing egress by >90%)
      const compressionPromises = filesToRead.map(async (file) => {
        const result = await compressAndResizeImage(file, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.82,
          format: 'image/webp'
        });
        return result.dataUrl;
      });

      const optimizedImages = await Promise.all(compressionPromises);
      onChange([...images, ...optimizedImages]);
    } catch (err: any) {
      setUploadError(err?.message || 'An error occurred while optimizing images. Please try again.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleSetPrimary = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return;
    const targetImage = images[indexToPrimary];
    const remaining = images.filter((_, idx) => idx !== indexToPrimary);
    onChange([targetImage, ...remaining]);
  };

  return (
    <div className="space-y-3" id="multiple-product-image-uploader">
      {/* Drag & Drop / Upload Target Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl py-7 px-4 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#d01617] bg-amber-50/70 ring-2 ring-[#d01617]/20 scale-[0.99]'
            : 'border-stone-300 hover:border-[#d01617] bg-[#faf8f5]/80 hover:bg-amber-50/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png, image/jpeg, image/webp, image/gif"
          onChange={handleFileSelect}
          className="hidden"
          id="product-file-upload-input"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-100/90 text-[#4a170a] flex items-center justify-center shadow-xs">
            <ImageIcon className="w-7 h-7 stroke-[1.5] text-[#d01617]" />
          </div>
          <div>
            <p className="text-xs font-mono font-bold tracking-wider uppercase text-[#4a170a]">
              Drag & Drop Multiple Media Files Here
            </p>
            <p className="text-[11px] font-mono tracking-wide text-stone-500 uppercase mt-1">
              or click to browse local filesystem (Max 8MB, auto-compressed)
            </p>
          </div>
        </div>
      </div>

      {isCompressing && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium animate-pulse">
          <Sparkles className="w-4 h-4 shrink-0 text-[#d01617] animate-spin" />
          <span>Optimizing and resizing images for low network egress...</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Uploaded Images Preview Gallery */}
      {images.filter(img => Boolean(img && img.trim())).length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {images.filter(img => Boolean(img && img.trim())).map((imgUrl, index) => {
              const isPrimary = index === 0;

              return (
                <div
                  key={`${imgUrl.slice(0, 32)}-${index}`}
                  className={`relative group rounded-xl overflow-hidden border bg-stone-100 aspect-square flex items-center justify-center transition-all ${
                    isPrimary
                      ? 'border-[#d01617] ring-2 ring-[#d01617]/25 shadow-xs'
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <img
                    src={imgUrl || DEFAULT_FALLBACK_IMAGE}
                    alt={`Product angle ${index + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  {/* Remove Button (Top-Right) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(index);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-[#d01617] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer z-10"
                    title="Remove this photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Primary Cover Badge or Set Cover Action (Bottom-Left) */}
                  {isPrimary ? (
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-[#d01617] text-white text-[9px] font-extrabold shadow-sm flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-white" />
                      <span>Cover</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetPrimary(index);
                      }}
                      className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/70 hover:bg-[#d01617] text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      title="Set as Main Cover"
                    >
                      <Star className="w-2.5 h-2.5" />
                      <span>Set Cover</span>
                    </button>
                  )}

                  {/* Photo Index Indicator (Top-Left) */}
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono font-bold">
                    #{index + 1}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Another Button */}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border border-dashed border-stone-300 hover:border-[#d01617] bg-white hover:bg-amber-50/50 flex flex-col items-center justify-center text-stone-500 hover:text-[#d01617] gap-1 transition-colors cursor-pointer"
              >
                <ImagePlus className="w-5 h-5 text-stone-400 group-hover:text-[#d01617]" />
                <span className="text-[10px] font-mono font-bold uppercase">+ Add Photo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
