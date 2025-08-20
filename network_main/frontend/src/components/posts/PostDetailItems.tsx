// Modified PostDetailItems component (add useRouter and onClick to Edit button)
'use client';

import { deleteVotePost, votePost, } from "@/services/api";
import PostMedia from "./media/PostMedia";
import { PostActions } from "./PostActions";
import CommentsSection from "./comments/CommentsSection";
import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/zustand_store/authStore";
import { Post } from "@/services/types";
import AuthModalController from "../auth/AuthModalController";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Bookmark, Flag } from "lucide-react";

export default function PostDetailItems({ postData }: { postData: Post }) {
    if (!postData || !postData.slug) {
        return null;
    }

    const [post, setPostData] = useState(postData);
    const { isAuthenticated } = useAuthStore();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const router = useRouter();

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

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
                            <div className="relative">
                                <button
                                    ref={buttonRef}
                                    aria-label="More options"
                                    className="cursor-pointer text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-300/40 rounded-full p-1.5 -mt-1 -mr-1.5"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {isMenuOpen && (
                                    <div
                                        ref={menuRef}
                                        className="absolute right-2 mt-2 w-42 bg-white dark:bg-zinc-900 rounded-md shadow-xl/30 z-10 ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-150 ease-in-out origin-top-right"
                                    >
                                        <button
                                            onClick={() => {
                                                setIsMenuOpen(false);
                                                router.push(`/${post.slug}/edit`);
                                            }}
                                            className="cursor-pointer flex items-center px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                                            <Pencil className="w-4 h-4 mr-3" />
                                            Edit
                                        </button>
                                        <button className="cursor-pointer flex items-center px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                                            <Bookmark className="w-4 h-4 mr-3" />
                                            Save
                                        </button>
                                        <button className="cursor-pointer flex items-center px-5 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left">
                                            <Flag className="w-4 h-4 mr-3" />
                                            Report
                                        </button>
                                    </div>
                                )}
                            </div>
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