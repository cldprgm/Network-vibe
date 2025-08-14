import { Media } from "@/services/types";
import ImageMedia from "./ImageMedia";
import VideoMedia from "./VideoMedia";

interface MediaRendererProps {
    media: Media;
    onFullscreenOpen: () => void;
}

export default function MediaRenderer({ media, onFullscreenOpen }: MediaRendererProps) {
    if (media.media_type === "image") {
        return <ImageMedia media={media} onFullscreenOpen={onFullscreenOpen} />;
    } else {
        return <VideoMedia media={media} />;
    }
}