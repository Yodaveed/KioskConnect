import { useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface MobileSafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  onError?: () => void;
  onLoad?: () => void;
}

export function MobileSafeImage({ 
  src, 
  alt, 
  className, 
  fallbackIcon = <div className="text-4xl">🍨</div>, 
  onError,
  onLoad
}: MobileSafeImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Reset error state when src changes
  useEffect(() => {
    if (src && src !== '') {
      setImageError(false);
      setIsLoading(true);
      setRetryCount(0);
    } else {
      setImageError(true);
      setIsLoading(false);
    }
  }, [src]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setImageError(false);
    onLoad?.();
  }, [onLoad]);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    
    if (retryCount < maxRetries && src) {
      // Retry loading with a different approach
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
      }, 1000);
    } else {
      setImageError(true);
      onError?.();
    }
  }, [onError, retryCount, src]);

  // Convert Cloudinary admin/thumbnail URLs to public URLs
  const convertToPublicUrl = useCallback((url: string) => {
    // Handle Cloudinary admin console URLs
    if (url.includes('/thumbnails/') && url.includes('/preview')) {
      // Extract the cloud name and public ID from thumbnail URL
      const match = url.match(/https:\/\/res-console\.cloudinary\.com\/([^\/]+)\/thumbnails\/v1\/image\/upload\/v\d+\/([^\/]+)\/preview/);
      if (match) {
        const [, cloudName, publicId] = match;
        // Decode the base64 public ID
        try {
          const decodedId = atob(publicId);
          return `https://res.cloudinary.com/${cloudName}/image/upload/${decodedId}`;
        } catch {
          // If decoding fails, fallback to showing icon
          return '';
        }
      }
    }
    
    // Simple conversion for other console URLs
    if (url.includes('res-console.cloudinary.com')) {
      return url.replace('res-console.cloudinary.com', 'res.cloudinary.com');
    }
    
    return url;
  }, []);

  // Check if the image URL is valid and accessible
  const isValidImageUrl = useCallback((url: string) => {
    try {
      const parsedUrl = new URL(url);
      // Only allow HTTPS URLs for mobile compatibility
      return parsedUrl.protocol === 'https:' && 
             (parsedUrl.hostname.includes('imgur.com') || 
              parsedUrl.hostname.includes('cloudinary.com') ||
              parsedUrl.hostname.includes('unsplash.com') ||
              parsedUrl.hostname.includes('imagekit.io') ||
              parsedUrl.hostname.includes('amazonaws.com') ||
              parsedUrl.hostname.includes('googleusercontent.com') ||
              parsedUrl.hostname.includes('github.com') ||
              parsedUrl.hostname.includes('replit.com') ||
              parsedUrl.hostname.includes('squarespace-cdn.com') ||
              // Allow other common image hosts
              parsedUrl.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i));
    } catch {
      return false;
    }
  }, []);

  // Convert URL to public-accessible version
  const publicSrc = src ? convertToPublicUrl(src) : null;

  // If no src or invalid URL, show fallback immediately
  if (!publicSrc || publicSrc.trim() === '' || !isValidImageUrl(publicSrc)) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 shadow-md",
        className
      )}>
        {fallbackIcon}
      </div>
    );
  }

  // If image failed to load after retries, show fallback
  if (imageError) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 shadow-md",
        className
      )}>
        {fallbackIcon}
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-gray-200 animate-pulse shadow-md",
        className
      )}>
        <div className="text-gray-400 text-2xl">📷</div>
      </div>
    );
  }

  // Construct image URL with mobile optimizations
  const optimizedSrc = publicSrc.includes('?') 
    ? `${publicSrc}&format=auto&quality=85&w=400` 
    : `${publicSrc}?format=auto&quality=85&w=400`;

  return (
    <img
      src={retryCount > 0 ? publicSrc : optimizedSrc} // Use original URL on retry
      alt={alt}
      className={cn("shadow-md", className)}
      onLoad={handleImageLoad}
      onError={handleImageError}
      loading="lazy"
      decoding="async"
      crossOrigin="anonymous"
      // Add mobile-specific attributes
      style={{
        imageRendering: 'crisp-edges',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
      }}
    />
  );
}