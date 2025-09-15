import { Media } from "@/services/types";
import { useEffect, useRef, useState } from "react";
import useImageSize from "./hooks/useImageSize";
import useVideoAspectRatio from "./hooks/useVideoAspectRatio";

const publicBaseUrl = process.env.NEXT_PUBLIC_API_ASSETS_URL || '';

interface FullscreenViewerProps {
    mediaItems: Media[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export default function FullscreenViewer({
    mediaItems,
    currentIndex,
    onClose,
    onNext,
    onPrev,
}: FullscreenViewerProps) {
    const currentMedia = mediaItems[currentIndex];
    const fullscreenRef = useRef<HTMLDivElement>(null);
    const imageSize = useImageSize(currentMedia);
    const videoAspectRatio = useVideoAspectRatio(currentMedia);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            } else if (e.key === "ArrowRight") {
                onNext();
            } else if (e.key === "ArrowLeft") {
                onPrev();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (fullscreenRef.current && !fullscreenRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [mediaItems.length, onClose, onNext, onPrev]);

    const getSizeClass = () => {
        if (!imageSize.width || !imageSize.height) return "object-contain max-w-[90vw] max-h-[90vh]";

        const windowRatio = window.innerWidth / window.innerHeight;
        const imageRatio = imageSize.width / imageSize.height;

        if (imageRatio < 0.7) {
            return "max-h-[90vh] w-auto";
        }

        if (imageRatio > 1.5) {
            return "max-w-[90vw] h-auto";
        }

        return "min-w-[90vw] max-w-[90vw] max-h-[90vh]";
    };

    const currentFullSrc = `${publicBaseUrl}${currentMedia.file_url}`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={onClose}
        >
            <div
                ref={fullscreenRef}
                className="relative w-full h-full flex flex-col items-center justify-center"
            >
                <div className="absolute top-0 right-0 z-50 p-4">
                    <button
                        onClick={onClose}
                        aria-label="Close lightbox"
                        className="cursor-pointer bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="relative w-full h-full flex items-center justify-center">
                    {mediaItems.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onPrev(); }}
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
                                onClick={(e) => { e.stopPropagation(); onNext(); }}
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

                    <div className="w-full h-full flex items-center justify-center p-4">
                        {currentMedia.media_type === "image" ? (
                            <img
                                src={currentFullSrc}
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
                                src={currentFullSrc}
                                controls
                                autoPlay
                                className="max-w-[90vw] max-h-[90vh] object-contain"
                                style={{
                                    aspectRatio: videoAspectRatio ?? undefined,
                                }}
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
    );
}