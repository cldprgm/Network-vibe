import { Post } from "@/services/types";
import PostRating from "./PostRating";
import Link from "next/link";

export function PostActions({
    post,
    onVote,
    onDelete,
    onShareClick
}: {
    post: Post;
    onVote: (slug: string, value: number) => void;
    onDelete: (slug: string) => void;
    onShareClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
    return (
        <div className="flex items-center sm:flex-nowrap gap-2 sm:gap-3 w-full">
            <PostRating
                sum_rating={post.sum_rating}
                userVote={post.user_vote}
                onVote={(value: number) => onVote(post.slug, value)}
                onDelete={() => onDelete(post.slug)}
            />

            <Link href='#' className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
                <svg width="18" height="18" viewBox="100 255 34 32" fill="currentColor">
                    <path d="M116,281 C114.832,281 113.704,280.864 112.62,280.633 L107.912,283.463 L107.975,278.824 C104.366,276.654 102,273.066 102,269 C102,262.373 108.268,257 116,257 C123.732,257 130,262.373 130,269 C130,275.628 123.732,281 116,281 L116,281 Z M116,255 C107.164,255 100,261.269 100,269 C100,273.419 102.345,277.354 106,279.919 L106,287 L113.009,282.747 C113.979,282.907 114.977,283 116,283 C124.836,283 132,276.732 132,269 C132,261.269 124.836,255 116,255 L116,255 Z" />
                </svg>
                <span className="text-sm">{post.comment_count}</span>
            </Link>

            <button
                onClick={onShareClick}
                className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5 cursor-pointer"
            >
                <svg width="22" height="22" viewBox="5 4 17 17" fill="currentColor">
                    <path d="M14.734 15.8974L19.22 12.1374C19.3971 11.9927 19.4998 11.7761 19.4998 11.5474C19.4998 11.3187 19.3971 11.1022 19.22 10.9574L14.734 7.19743C14.4947 6.9929 14.1598 6.94275 13.8711 7.06826C13.5824 7.19377 13.3906 7.47295 13.377 7.78743V9.27043C7.079 8.17943 5.5 13.8154 5.5 16.9974C6.961 14.5734 10.747 10.1794 13.377 13.8154V15.3024C13.3888 15.6178 13.5799 15.8987 13.8689 16.0254C14.158 16.1521 14.494 16.1024 14.734 15.8974Z" />
                </svg>
                <span className="text-sm">Share</span>
            </button>
        </div>
    );
}