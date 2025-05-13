import { Post, Media } from "@/services/types";
import Image from "next/image"

export default function PostMedia ({post}: {post: Post}) {
    if (!post.media_data?.length) return null;

    const media: Media = post.media_data[0];

    const getAspectRatio = (media: Media) => {
        if (!media.aspect_ratio) {
            return media.media_type === 'video' ? 16 / 9 : 4 / 3;
        }
        const [width, height] = media.aspect_ratio.split('/').map(Number);
        return width / height;
    };

    return (
        <div className="mb-2 relative w-full">
        <div
            className="relative w-full border border-[var(--border)] rounded-2xl overflow-hidden bg-black"
            style={{ aspectRatio: getAspectRatio(media), maxHeight: '560px' }}
        >
            {media.media_type === 'image' ? (
            <>
                <div className="absolute inset-0 overflow-hidden">
                <img
                    src={media.file}
                    className="absolute top-1/2 left-0 w-[150%] -translate-y-1/2 scale-130 opacity-40 blur-lg object-cover"
                    alt=""
                />
                </div>
                <Image
                src={media.file}
                alt="Post media content"
                fill
                style={{ objectFit: "contain" }}
                />
            </>
            ) : (
            <video
                controls
                className="w-full h-full object-contain"
                src={media.file}
            >
                Your browser does not support the video tag.
            </video>
            )}
        </div>
    </div>
    )
};