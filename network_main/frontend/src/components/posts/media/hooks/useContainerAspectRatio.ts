import { Media } from "@/services/types";
import { useEffect, useState } from "react";

const parseAspectRatio = (aspect?: string, mediaType?: string) => {
    if (!aspect) {
        return mediaType === "video" ? 16 / 9 : 4 / 3;
    }
    const [w, h] = aspect.split("/").map(Number);
    if (!w || !h) return mediaType === "video" ? 16 / 9 : 4 / 3;
    return w / h;
};

export default function useContainerAspectRatio(mediaItems: Media[], currentMedia: Media) {
    const [containerAspectRatio, setContainerAspectRatio] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        if (!mediaItems.length) {
            if (!cancelled) setContainerAspectRatio(4 / 3);
            return;
        }

        if (currentMedia.media_type === "video" && currentMedia.file) {
            const vid = document.createElement("video");
            vid.preload = "metadata";
            vid.src = currentMedia.file;

            const onLoaded = () => {
                if (cancelled) return;
                const w = vid.videoWidth || 0;
                const h = vid.videoHeight || 0;
                const ratio = w && h ? w / h : parseAspectRatio(currentMedia.aspect_ratio, "video");
                if (!cancelled) setContainerAspectRatio(ratio);
            };

            const onError = () => {
                if (cancelled) return;
                const ratio = parseAspectRatio(currentMedia.aspect_ratio, "video");
                if (!cancelled) setContainerAspectRatio(ratio);
            };

            vid.addEventListener("loadedmetadata", onLoaded);
            vid.addEventListener("error", onError);

            return () => {
                cancelled = true;
                vid.removeEventListener("loadedmetadata", onLoaded);
                vid.removeEventListener("error", onError);
                try { vid.src = ""; } catch { }
            };
        }

        const imageMedia = mediaItems.filter((m) => m.media_type === "image");
        if (!imageMedia.length) {
            if (!cancelled) setContainerAspectRatio(parseAspectRatio(mediaItems[0]?.aspect_ratio, mediaItems[0]?.media_type));
            return;
        }

        const ratios: number[] = [];
        let loadedCount = 0;

        imageMedia.forEach((m) => {
            const declared = m.aspect_ratio ? parseAspectRatio(m.aspect_ratio, m.media_type) : null;

            if (!m.file) {
                if (declared) ratios.push(declared);
                loadedCount++;
                if (loadedCount === imageMedia.length && !cancelled) {
                    const minRatio = Math.max(0.3, Math.min(...ratios));
                    setContainerAspectRatio(minRatio);
                }
                return;
            }

            const img = new window.Image();
            img.src = m.file;

            img.onload = () => {
                if (cancelled) return;
                const r = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : (declared ?? 4 / 3);
                ratios.push(r);
                loadedCount++;
                if (loadedCount === imageMedia.length && !cancelled) {
                    const minRatio = Math.max(0.3, Math.min(...ratios));
                    setContainerAspectRatio(minRatio);
                }
            };

            img.onerror = () => {
                if (cancelled) return;
                if (declared) ratios.push(declared);
                loadedCount++;
                if (loadedCount === imageMedia.length && !cancelled) {
                    const minRatio = Math.max(0.3, Math.min(...ratios));
                    setContainerAspectRatio(minRatio);
                }
            };
        });

        return () => {
            cancelled = true;
        };
    }, [mediaItems, currentMedia?.file, currentMedia?.media_type]);

    return containerAspectRatio;
}