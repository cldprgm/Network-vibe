import { Media } from "@/services/types";
import Image from "next/image";

const publicBaseUrl = process.env.NEXT_PUBLIC_API_ASSETS_URL || '';
const containerBaseUrl = process.env.NEXT_PUBLIC_API_BASE_CONTAINER_URL || '';

interface ImageMediaProps {
    media: Media;
    onFullscreenOpen: () => void;
}

export default function ImageMedia({ media, onFullscreenOpen }: ImageMediaProps) {
    const fullSrc = `${publicBaseUrl}${media.file_url}`;
    const containerfullSrc = `${containerBaseUrl}${media.file_url}`;

    return (
        <>
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={fullSrc}
                    className="absolute inset-0 w-full h-full object-cover opacity-30 blur-lg scale-[1.05]"
                    alt=""
                    aria-hidden
                />
            </div>

            <button
                onClick={(e) => { e.stopPropagation(); onFullscreenOpen(); }}
                aria-label="Open image fullscreen"
                className="relative cursor-pointer w-full h-full block focus:outline-none"
            >
                <Image
                    src={containerfullSrc}
                    alt="Post media content"
                    fill
                    style={{ objectFit: "contain" }}
                    priority={false}
                />
            </button>
        </>
    );
}