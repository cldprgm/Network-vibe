import { Media } from "@/services/types";
import { useEffect, useState } from "react";

export default function useImageSize(media: Media) {
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (media.media_type !== "image") return;

        const img = new window.Image();
        img.src = media.file;

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
    }, [media.file, media.media_type]);

    return imageSize;
}