import { useState } from 'react';
import { ImageIcon } from 'lucide-react';

interface IconWithFallbackProps {
  src?: string | null;
  alt: string;
  fallbackIcon?: React.ReactNode;
  className?: string;
  size?: number;
}

export function IconWithFallback({ 
  src, 
  alt, 
  fallbackIcon, 
  className = "",
  size = 64 
}: IconWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
        {fallbackIcon || <ImageIcon size={size} className="text-gray-400" />}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <ImageIcon size={size / 2} className="text-gray-300" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
}