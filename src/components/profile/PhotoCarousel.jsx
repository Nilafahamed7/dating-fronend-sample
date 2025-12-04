import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { getPlaceholderImage } from '../../utils/helpers';

export default function PhotoCarousel({ photos, showDots = true, showArrows = true }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const placeholderImg = getPlaceholderImage(400, 600, 'No Photo');

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-2xl">
        <span className="text-gray-400">No photos</span>
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
      <img
        src={photos[currentIndex]?.url || placeholderImg}
        alt={`Photo ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        onError={(e) => {
          // Prevent infinite loop - only set placeholder if current src is not already placeholder
          if (e.target.src !== placeholderImg && !e.target.src.startsWith('data:image')) {
            e.target.src = placeholderImg;
          }
        }}
      />

      {photos.length > 1 && showArrows && (
        <>
          <button
            onClick={prevPhoto}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={nextPhoto}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </>
      )}

      {photos.length > 1 && showDots && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

