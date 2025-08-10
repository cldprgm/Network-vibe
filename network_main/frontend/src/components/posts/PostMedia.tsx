'use client';

import { Post, Media } from "@/services/types";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function PostMedia({ post }: { post: Post }) {
  if (!post.media_data?.length) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mediaItems = post.media_data;
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const [containerAspectRatio, setContainerAspectRatio] = useState<number | null>(null);

  const currentMedia = mediaItems[currentIndex];

  const parseAspectRatio = (aspect?: string, mediaType?: string) => {
    if (!aspect) {
      return mediaType === "video" ? 16 / 9 : 4 / 3;
    }
    const [w, h] = aspect.split("/").map(Number);
    if (!w || !h) return mediaType === "video" ? 16 / 9 : 4 / 3;
    return w / h;
  };

  const getAspectRatio = (media: Media) => parseAspectRatio(media.aspect_ratio, media.media_type);

  const nextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  useEffect(() => {
    let cancelled = false;

    const imageMedia = mediaItems.filter(m => m.media_type === "image");
    if (!imageMedia.length) {
      setContainerAspectRatio(getAspectRatio(mediaItems[0]));
      return;
    }

    const ratios: number[] = [];
    let loadedCount = 0;

    imageMedia.forEach((m) => {
      const declared = m.aspect_ratio ? parseAspectRatio(m.aspect_ratio, m.media_type) : null;
      if (!m.file) {
        if (declared) ratios.push(declared);
        loadedCount++;
        return;
      }

      const img = new window.Image();
      img.src = m.file;

      img.onload = () => {
        if (cancelled) return;
        const r = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : (declared ?? 4 / 3);
        ratios.push(r);
        loadedCount++;
        if (loadedCount === imageMedia.length) {
          const minRatio = Math.max(0.3, Math.min(...ratios));
          setContainerAspectRatio(minRatio);
        }
      };

      img.onerror = () => {
        if (cancelled) return;
        if (declared) ratios.push(declared);
        loadedCount++;
        if (loadedCount === imageMedia.length) {
          const minRatio = Math.max(0.3, Math.min(...ratios));
          setContainerAspectRatio(minRatio);
        }
      };
    });

    return () => {
      cancelled = true;
    };
  }, [post.media_data?.length]);

  useEffect(() => {
    if (!isFullscreen || !currentMedia || currentMedia.media_type !== "image") return;

    const img = new window.Image();
    img.src = currentMedia.file;

    img.onload = () => {
      setImageSize({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };

    img.onerror = () => {
      console.error("Failed to load image for size detection");
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isFullscreen, currentMedia]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      } else if (e.key === "ArrowRight") {
        nextSlide();
      } else if (e.key === "ArrowLeft") {
        prevSlide();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (fullscreenRef.current && !fullscreenRef.current.contains(e.target as Node)) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFullscreen, mediaItems.length]);

  const getSizeClass = () => {
    if (!imageSize.width || !imageSize.height) return "object-contain max-w-[90vw] max-h-[90vh]";

    const windowRatio = window.innerWidth / window.innerHeight;
    const imageRatio = imageSize.width / imageSize.height;

    // vertical
    if (imageRatio < 0.7) {
      return "max-h-[90vh] w-auto";
    }

    // horizontal
    if (imageRatio > 1.5) {
      return "max-w-[90vw] h-auto";
    }

    // other
    return "min-w-[90vw] max-w-[90vw] max-h-[90vh]";
  };

  const activeAspect = containerAspectRatio ?? getAspectRatio(currentMedia);

  return (
    <div className="mb-2 relative w-full" onClick={(e) => e.stopPropagation()}>
      <div
        className="relative w-full border border-[var(--border)] rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: activeAspect, maxHeight: "560px" }}
      >
        {currentMedia.media_type === "image" ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={currentMedia.file}
                className="absolute inset-0 w-full h-full object-cover opacity-30 blur-lg scale-[1.05]"
                alt=""
                aria-hidden
              />
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(true); }}
              aria-label="Open image fullscreen"
              className="relative cursor-pointer w-full h-full block focus:outline-none"
            >
              <Image
                src={currentMedia.file}
                alt="Post media content"
                fill
                style={{ objectFit: "contain" }}
                priority={false}
              />
            </button>
          </>
        ) : (
          <video
            controls
            className="w-full h-full object-contain"
            src={currentMedia.file}
          />
        )}

        {mediaItems.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute cursor-pointer left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
              aria-label="Previous media"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
              aria-label="Next media"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {mediaItems.map((_, index) => (
                <span
                  key={index}
                  className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <div
            ref={fullscreenRef}
            className="relative w-full h-full flex flex-col items-center justify-center"
          >
            <div className="absolute top-0 right-0 z-50 p-4">
              <button
                onClick={() => setIsFullscreen(false)}
                aria-label="Close lightbox"
                className="cursor-pointer bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
              {/* Navigation arrows */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    className="absolute cursor-pointer left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10"
                    aria-label="Previous media"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute cursor-pointer right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 z-10"
                    aria-label="Next media"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}

              {/* Media content */}
              <div className="w-full h-full flex items-center justify-center p-4">
                {currentMedia.media_type === "image" ? (
                  <img
                    src={currentMedia.file}
                    alt="Fullscreen media"
                    className={`${getSizeClass()} object-contain`}
                    draggable={false}
                    style={{
                      maxWidth: "min(90vw, 2000px)",
                      maxHeight: "min(90vh, 2000px)"
                    }}
                  />
                ) : (
                  <video
                    src={currentMedia.file}
                    controls
                    autoPlay
                    className="max-w-[90vw] max-h-[90vh] object-contain"
                  />
                )}
              </div>
            </div>

            {mediaItems.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                {currentIndex + 1} / {mediaItems.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
