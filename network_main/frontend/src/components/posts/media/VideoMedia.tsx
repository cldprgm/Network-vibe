import { Media } from "@/services/types";
import { useRef, useState, useEffect } from "react";
import { getVideoVisibilityManager } from "../VideoVisibilityManager";

const publicBaseUrl = process.env.NEXT_PUBLIC_API_ASSETS_URL || '';

interface VideoMediaProps {
    media: Media;
}

export default function VideoMedia({ media }: VideoMediaProps) {
    const [showControls, setShowControls] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [media]);

    useEffect(() => {
        setShowControls(false);
    }, [media]);

    useEffect(() => {
        if (!videoRef.current || media.media_type !== 'video') return;

        const manager = getVideoVisibilityManager();
        const unregister = manager.register(videoRef.current);

        return () => {
            unregister();
            try { videoRef.current?.pause(); } catch (err) { }
        };
    }, [media.file_url, media.media_type]);

    const handleVideoPlay = () => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
            setShowControls(true);
        }, 600);
    };

    const fullSrc = `${media.file_url}`;

    return (
        <video
            aria-label="Post video content"
            ref={videoRef}
            controls={showControls}
            onPlay={handleVideoPlay}
            className="w-full h-full object-contain"
            muted
            playsInline
            src={fullSrc}
        />
    );
}