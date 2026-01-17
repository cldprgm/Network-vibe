import { Media } from "@/services/types";
import { useMemo } from "react";
import { parseAspectRatio } from "@/services/media";


export default function useContainerAspectRatio(mediaItems: Media[]) {
    return useMemo(() => {
        if (!mediaItems.length) return 4 / 3;

        const ratios = mediaItems.map(item =>
            parseAspectRatio(item.aspect_ratio, item.media_type)
        );

        const minRatio = Math.min(...ratios);

        return Math.max(0.3, minRatio);

    }, [mediaItems]);
}