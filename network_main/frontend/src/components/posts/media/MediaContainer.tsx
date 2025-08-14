import { Media } from "@/services/types";
import MediaRenderer from "./MediaRenderer";
import SlideshowControls from "./SlideshowControls";

interface MediaContainerProps {
    currentMedia: Media;
    containerAspectRatio: number | null;
    mediaItems: Media[];
    currentIndex: number;
    onFullscreenOpen: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export default function MediaContainer({
    currentMedia,
    containerAspectRatio,
    mediaItems,
    currentIndex,
    onFullscreenOpen,
    onNext,
    onPrev,
}: MediaContainerProps) {
    return (
        <div
            data-testid="media-container"
            className="relative w-full border border-[var(--border)] rounded-2xl overflow-hidden bg-black"
            style={{
                aspectRatio: containerAspectRatio ?? undefined,
                maxHeight: "560px",
                ...(currentMedia?.media_type === "video" ? { minHeight: "300px" } : {}),
            }}
        >
            <MediaRenderer
                media={currentMedia}
                onFullscreenOpen={onFullscreenOpen}
            />

            {mediaItems.length > 1 && (
                <SlideshowControls
                    currentIndex={currentIndex}
                    mediaItemsLength={mediaItems.length}
                    onNext={onNext}
                    onPrev={onPrev}
                />
            )}
        </div>
    );
}