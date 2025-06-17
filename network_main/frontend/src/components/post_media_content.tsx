'use client';

import { Post, Media } from "@/services/types";
import Image from "next/image";
import { useState } from "react";

export default function PostMedia({ post }: { post: Post }) {
  if (!post.media_data?.length) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const mediaItems = post.media_data;

  const getAspectRatio = (media: Media) => {
    if (!media.aspect_ratio) {
      return media.media_type === "video" ? 16 / 9 : 4 / 3;
    }
    const [width, height] = media.aspect_ratio.split("/").map(Number);
    return width / height;
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const currentMedia = mediaItems[currentIndex];

  return (
    <div className="mb-2 relative w-full" onClick={(e) => e.stopPropagation()}>
      <div
        className="relative w-full border border-[var(--border)] rounded-2xl overflow-hidden bg-black"
        style={{ aspectRatio: getAspectRatio(currentMedia), maxHeight: "560px" }}
      >
        {currentMedia.media_type === "image" ? (
          <>
            <div className="absolute inset-0 overflow-hidden">
              <img
                src={currentMedia.file}
                className="absolute top-1/2 left-0 w-[150%] -translate-y-1/2 scale-130 opacity-40 blur-lg object-cover"
                alt=""
              />
            </div>
            <Image
              src={currentMedia.file}
              alt="Post media content"
              fill
              style={{ objectFit: "contain" }}
            />
          </>
        ) : (
          <video
            controls
            className="w-full h-full object-contain"
            src={currentMedia.file}
          >

          </video>
        )}

        {mediaItems.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
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
                  className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-white" : "bg-white/50"
                    }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}