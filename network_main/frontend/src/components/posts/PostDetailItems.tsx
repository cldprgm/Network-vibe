'use client';

import { deleteVotePost, votePost, } from "@/services/api";
import PostMedia from "./media/PostMedia";
import { PostActions } from "./PostActions";
import CommentsSection from "./comments/CommentsSection";
import React, { useState } from "react";
import { useAuthStore } from "@/zustand_store/authStore";
import { Post } from "@/services/types";
import AuthModalController from "../auth/AuthModalController";
import Image from "next/image";
import Link from "next/link";

export default function PostDetailItems({ postData }: { postData: Post }) {
    if (!postData || !postData.slug) {
        return null;
    }

    const [post, setPostData] = useState(postData);
    const { isAuthenticated } = useAuthStore();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const requireAuth = (callback: () => void) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        callback();
    };

    const handleVote = async (slug: string, value: number) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await votePost(slug, value);
                setPostData({ ...post, sum_rating, user_vote });
            } catch (error) {
                console.error('Error for voting on post:', error);
            }
        });
    };

    const handleDelete = async (slug: string) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await deleteVotePost(slug);
                setPostData({ ...post, sum_rating, user_vote });
            } catch (error) {
                console.error('Error for delete voice on post:', error);
            }
        })
    };

    return (
        <>
            {showAuthModal && <AuthModalController onCloseAll={() => setShowAuthModal(false)} />}

            <div className='mt-2'>
                <div className="bg-white dark:bg-[var(--background)] rounded-2xl mx-auto w-full overflow-hidden">
                    <div className="px-4 py-2">

                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-9 h-9 rounded-full overflow-hidden relative">
                                    <Image
                                        className="object-cover"
                                        src={post.community_icon}
                                        alt="Community icon"
                                        fill
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-secondary flex items-center">
                                        <Link
                                            href={`communities/${post.community_slug}`}
                                            className="text-sm mr-1.5 dark:text-gray-200/90 font-semibold text-primary hover:underline hover:text-blue-700 dark:hover:text-blue-400"
                                        >
                                            n/{post.community_name}
                                        </Link>
                                        • {new Date(post.created).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <button aria-label="More options" className="text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-300/40 rounded-full p-1.5 -mt-1 -mr-1.5">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path></svg>
                            </button>
                        </div>

                        <div className="text-2xl font-semibold text-primary mb-2 break-words">
                            <p>{post.title}</p>
                        </div>

                        <PostMedia post={post} />

                        <div className="text-base text-primary mb-2 break-words text-gray-200/70">
                            <p>{post.description}</p>
                        </div>

                        <div className="w-full overflow-x-auto">
                            <PostActions
                                post={post}
                                onVote={handleVote}
                                onDelete={handleDelete}
                            />

                            <CommentsSection
                                postSlug={post.slug}
                                requireAuth={requireAuth}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


