import React, { useState, useEffect, useCallback, useRef } from "react";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholderColor?: string;
  quality?: number;
  formats?: ("webp" | "avif")[];
}

const SUPPORTED_FORMATS = (() => {
  if (typeof window === "undefined") return ["webp"];
  const canvas = document.createElement("canvas");
  if (canvas.getContext?.("2d")) {
    return ["webp", "avif"].filter((fmt) => {
      try {
        return canvas.toDataURL(`image/${fmt}`).startsWith("data:image");
      } catch {
        return false;
      }
    });
  }
  return ["webp"];
})();

export const OptimizedImage = React.memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  placeholderColor = "#1a1a2e",
  quality = 80,
  formats = ["avif", "webp"],
  className = "",
  style,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!priority && imgRef.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setLoaded(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(imgRef.current);
      return () => observer.disconnect();
    }
    setLoaded(true);
  }, [priority]);

  const generateSrcSet = useCallback((baseSrc: string) => {
    if (baseSrc.startsWith("data:") || baseSrc.startsWith("blob:")) return undefined;
    const widths = [320, 640, 960, 1280, 1920];
    return widths
      .map((w) => {
        const url = new URL(baseSrc, window.location.origin);
        url.searchParams.set("w", String(w));
        url.searchParams.set("q", String(quality));
        return `${url.toString()} ${w}w`;
      })
      .join(", ");
  }, [quality]);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    backgroundColor: placeholderColor,
    width: width ? `${width}px` : "100%",
    height: height ? `${height}px` : "auto",
    aspectRatio: width && height ? `${width}/${height}` : undefined,
    ...style,
  };

  if (error) {
    return (
      <div style={containerStyle} className={`flex items-center justify-center rounded ${className}`}>
        <div className="text-gray-500 text-sm">Failed to load image</div>
      </div>
    );
  }

  return (
    <div ref={imgRef} style={containerStyle} className={className}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse" style={{ backgroundColor: placeholderColor }} />
      )}
      {loaded && (
        <picture>
          {formats.filter((f) => SUPPORTED_FORMATS.includes(f)).map((fmt) => (
            <source key={fmt} srcSet={generateSrcSet(src)} type={`image/${fmt}`} />
          ))}
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            style={{ aspectRatio: width && height ? `${width}/${height}` : undefined }}
            {...props}
          />
        </picture>
      )}
    </div>
  );
});

export const MemoizedComponent = React.memo(function MemoizedComponent({
  children,
  deps = [],
}: {
  children: React.ReactNode;
  deps?: unknown[];
}) {
  return <>{children}</>;
});

export function useStableCallback<T extends (...args: unknown[]) => unknown>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback((...args: unknown[]) => ref.current(...args), []) as T;
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
