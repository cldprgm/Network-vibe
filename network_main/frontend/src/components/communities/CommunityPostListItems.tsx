'use client'

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { votePost, deleteVotePost } from '@/services/api';
import { Post } from '@/services/types';
import PostRating from '../posts/PostRating';
import PostMedia from '../posts/media/PostMedia';
import { useAuthStore } from '@/zustand_store/authStore';
import { useRouter } from 'next/navigation';
import AuthModalController from '../auth/AuthModalController';
import Image from 'next/image';
import { MoreHorizontal, Bookmark, Flag } from "lucide-react";

export default function CommunityPostListItems({ post }: { post: Post }) {
    const { isAuthenticated } = useAuthStore();
    const [currentPost, setCurrentPost] = useState(post);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const router = useRouter();


    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!post || !post.slug) {
        return null;
    }

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
                setCurrentPost({ ...currentPost, sum_rating, user_vote });
            } catch (error) {
                console.error('Error for voting:', error);
            }
        });
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

    const handleDelete = async (slug: string) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await deleteVotePost(slug);
                setCurrentPost({ ...currentPost, sum_rating, user_vote });
            } catch (error) {
                console.error('Error for delete voice:', error);
                alert('Error for delete voice');
            }
        });
    };

    return (
        <>
            {showAuthModal && <AuthModalController onCloseAll={() => setShowAuthModal(false)} />}

            {/* change to UserHoverCard later */}
            {/* {cardPosition && (
                <CommunityHoverCard
                    community={hoveredCommunity}
                    isLoading={isCardLoading}
                    onJoin={handleJoinCommunity}
                    style={{
                        top: `${cardPosition.top}px`,
                        left: `${cardPosition.left}px`,
                        position: 'absolute'
                    }}
                    cardRef={cardRef}
                    onMouseEnter={() => { if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current) }}
                    onMouseLeave={handleMouseLeave}
                />
            )} */}

            <div className='mt-2'>
                <div onClick={() => router.push(`/${currentPost.slug}/`)} className="cursor-pointer bg-white dark:bg-[var(--background)] hover:bg-[var(--hover-post-background)] transition rounded-2xl hover:shadow-2xl mx-auto w-full overflow-hidden">
                    <div className="px-4 py-2">

                        <div className="flex justify-between items-start mb-3">
                            <div
                                className="flex items-center space-x-2 relative"
                            // onMouseEnter={handleMouseEnter}
                            // onMouseLeave={handleMouseLeave}
                            >
                                <div className="w-9 h-9 rounded-full overflow-hidden relative">
                                    <Image
                                        className="object-cover"
                                        src={`${currentPost.author_icon}`}
                                        onClick={(e) => e.stopPropagation()}
                                        alt="User avatar"
                                        fill
                                        sizes="36"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-secondary flex items-center">
                                        <Link
                                            href={`/user/${currentPost.author_slug}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-sm mr-1.5 dark:text-gray-200/90 font-semibold text-primary hover:underline hover:text-blue-700 dark:hover:text-blue-400"
                                        >
                                            u/{currentPost.author}
                                        </Link>
                                        • {new Date(currentPost.created).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            timeZone: 'UTC'
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    ref={buttonRef}
                                    aria-label="More options"
                                    className="cursor-pointer text-gray-500 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-300/40 rounded-full p-1.5 -mt-1 -mr-1.5"
                                    onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen) }}
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                                {isMenuOpen && (
                                    <div
                                        ref={menuRef}
                                        className="absolute right-2 mt-2 w-42 bg-white dark:bg-zinc-900 rounded-md shadow-xl/30 z-10 ring-2 ring-gray-600 ring-opacity-5 overflow-hidden transform transition-all duration-150 ease-in-out origin-top-right"
                                    >
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

                        <div className="text-lg font-semibold text-primary mb-2 break-words">
                            <p>{currentPost.title}</p>
                        </div>

                        <PostMedia post={currentPost} />


                        <div className="w-full overflow-x-auto">
                            <div className="flex items-center sm:flex-nowrap gap-2 sm:gap-3 w-full">
                                <PostRating
                                    sum_rating={currentPost.sum_rating}
                                    userVote={currentPost.user_vote}
                                    onVote={(value: number) => handleVote(currentPost.slug, value)}
                                    onDelete={() => handleDelete(currentPost.slug)}
                                />
                                <Link href={`/${currentPost.slug}/`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
                                    <svg width="18" height="18" viewBox="100 255 34 32" fill="currentColor">
                                        <path d="M116,281 C114.832,281 113.704,280.864 112.62,280.633 L107.912,283.463 L107.975,278.824 C104.366,276.654 102,273.066 102,269 C102,262.373 108.268,257 116,257 C123.732,257 130,262.373 130,269 C130,275.628 123.732,281 116,281 L116,281 Z M116,255 C107.164,255 100,261.269 100,269 C100,273.419 102.345,277.354 106,279.919 L106,287 L113.009,282.747 C113.979,282.907 114.977,283 116,283 C124.836,283 132,276.732 132,269 C132,261.269 124.836,255 116,255 L116,255 Z" />
                                    </svg>
                                    <span className="text-sm">{currentPost.comment_count}</span>
                                </Link>
                                <Link href="#" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
                                    <svg width="22" height="22" viewBox="5 4 17 17" fill="currentColor">
                                        <path d="M14.734 15.8974L19.22 12.1374C19.3971 11.9927 19.4998 11.7761 19.4998 11.5474C19.4998 11.3187 19.3971 11.1022 19.22 10.9574L14.734 7.19743C14.4947 6.9929 14.1598 6.94275 13.8711 7.06826C13.5824 7.19377 13.3906 7.47295 13.377 7.78743V9.27043C7.079 8.17943 5.5 13.8154 5.5 16.9974C6.961 14.5734 10.747 10.1794 13.377 13.8154V15.3024C13.3888 15.6178 13.5799 15.8987 13.8689 16.0254C14.158 16.1521 14.494 16.1024 14.734 15.8974Z" />
                                    </svg>
                                    <span className="text-sm">Share</span>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
                <hr className='border-[var(--border)] mt-2' />
            </div>
        </>
    );
};
