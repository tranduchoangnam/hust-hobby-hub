import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  fallbackChar?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

export default function Avatar({
  src,
  alt,
  size = 48,
  className = '',
  fallbackChar,
  showOnlineStatus = false,
  isOnline = false,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Generate gradient colors based on name
  const generateGradient = (name: string) => {
    const colors = [
      'from-pink-400 to-pink-600',
      'from-purple-400 to-purple-600',
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-yellow-400 to-yellow-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-teal-400 to-teal-600',
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const displayChar = fallbackChar || alt.charAt(0).toUpperCase();
  const gradientClass = generateGradient(alt);

  return (
    <div className={`relative inline-block ${className}`}>
      <div 
        className="rounded-full overflow-hidden border-2 border-white shadow-lg bg-gradient-to-br"
        style={{ width: size, height: size }}
      >
        {src && !imageError ? (
          <>
            {isLoading && (
              <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center animate-pulse`}>
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <Image
              src={src}
              alt={alt}
              width={size}
              height={size}
              className={`object-cover w-full h-full transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onError={handleImageError}
              onLoad={handleImageLoad}
              unoptimized
            />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center`}>
            <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>
              {displayChar}
            </span>
          </div>
        )}
      </div>
      
      {showOnlineStatus && (
        <div className={`absolute bottom-0 right-0 rounded-full border-2 border-white ${
          isOnline ? 'bg-green-500' : 'bg-gray-400'
        }`} style={{ width: size * 0.25, height: size * 0.25 }}>
        </div>
      )}
    </div>
  );
} 