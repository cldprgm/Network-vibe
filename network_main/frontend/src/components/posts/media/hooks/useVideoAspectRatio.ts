import { Media } from "@/services/types";
import { useEffect, useState } from "react";

const publicBaseUrl = process.env.NEXT_PUBLIC_API_ASSETS_URL || '';

const parseAspectRatio = (aspect?: string) => {
    if (!aspect) return 16 / 9;
    const [w, h] = aspect.split("/").map(Number);
    if (!w || !h) return 16 / 9;
    return w / h;
};

export default function useVideoAspectRatio(media: Media) {
    const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);

    useEffect(() => {
        if (!media || media.media_type !== "video" || !media.file_url) {
            setVideoAspectRatio(null);
            return;
        }

        let cancelled = false;
        const vid = document.createElement("video");
        vid.preload = "metadata";
        vid.src = `${publicBaseUrl}${media.file_url}`;

        const onLoaded = () => {
            if (cancelled) return;
            const w = vid.videoWidth || 0;
            const h = vid.videoHeight || 0;
            if (w && h) {
                setVideoAspectRatio(w / h);
            } else {
                setVideoAspectRatio(parseAspectRatio(media.aspect_ratio));
            }
        };

        const onError = () => {
            if (cancelled) return;
            setVideoAspectRatio(parseAspectRatio(media.aspect_ratio));
        };

        vid.addEventListener("loadedmetadata", onLoaded);
        vid.addEventListener("error", onError);

        return () => {
            cancelled = true;
            vid.removeEventListener("loadedmetadata", onLoaded);
            vid.removeEventListener("error", onError);
            try { vid.src = ""; } catch { }
        };
    }, [media.file_url, media.media_type, media.aspect_ratio]);

    return videoAspectRatio;
}