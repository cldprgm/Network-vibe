interface SlideshowControlsProps {
    currentIndex: number;
    mediaItemsLength: number;
    onNext: () => void;
    onPrev: () => void;
}

export default function SlideshowControls({
    currentIndex,
    mediaItemsLength,
    onNext,
    onPrev,
}: SlideshowControlsProps) {
    return (
        <>
            <button
                onClick={(e) => { e?.stopPropagation(); onPrev(); }}
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
                onClick={(e) => { e?.stopPropagation(); onNext(); }}
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
            <div
                className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1"
                aria-label="media indicators"
            >
                {Array.from({ length: mediaItemsLength }).map((_, index) => (
                    <span
                        key={index}
                        className={`w-2 h-2 rounded-full ${index === currentIndex ? "bg-white" : "bg-white/50"}`}
                    />
                ))}
            </div>
        </>
    );
}