'use client';

import { Post } from "@/services/types";
import { useState } from "react";
import MediaContainer from "./MediaContainer";
import FullscreenViewer from "./FullscreenViewer";
import useContainerAspectRatio from "./hooks/useContainerAspectRatio";

export default function PostMedia({ post }: { post: Post }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!post.media_data?.length) return null;

  const mediaItems = post.media_data;
  const currentMedia = mediaItems[currentIndex];

  const containerAspectRatio = useContainerAspectRatio(mediaItems, currentMedia);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);

  return (
    <div className="mb-2 relative w-full" onClick={(e) => e.stopPropagation()}>
      <MediaContainer
        currentMedia={currentMedia}
        containerAspectRatio={containerAspectRatio}
        mediaItems={mediaItems}
        currentIndex={currentIndex}
        onFullscreenOpen={() => setIsFullscreen(true)}
        onNext={nextSlide}
        onPrev={prevSlide}
      />

      {isFullscreen && (
        <FullscreenViewer
          mediaItems={mediaItems}
          currentIndex={currentIndex}
          onClose={() => setIsFullscreen(false)}
          onNext={nextSlide}
          onPrev={prevSlide}
        />
      )}
    </div>
  );
}