'use client';

import { deleteVotePost, votePost, deletePost } from "@/services/api";
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
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { MoreHorizontal, Pencil, Bookmark, Flag, Trash, Link as LinkIcon, Send, Check } from "lucide-react";

export default function PostDetailItems({ postData }: { postData: Post }) {
    const [post, setPostData] = useState(postData);
    const { isAuthenticated } = useAuthStore();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [loadingDelete, setLoadingDelete] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const postContainerRef = useRef<HTMLDivElement>(null);

    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const shareMenuRef = useRef<HTMLDivElement>(null);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [shareMenuPos, setShareMenuPos] = useState({ top: 0, left: 0 });
    const [isCopied, setIsCopied] = useState(false);

    const router = useRouter();

    if (!postData || !postData.slug) {
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
                setPostData({ ...post, sum_rating, user_vote });
            } catch (error) {
                console.error('Error for voting on post:', error);
            }
        });
    };

    const handleDeleteVote = async (slug: string) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await deleteVotePost(slug);
                setPostData({ ...post, sum_rating, user_vote });
            } catch (error) {
                console.error('Error for delete voice on post:', error);
            }
        })
    };

    const handleDelete = async (slug: string) => {
        requireAuth(async () => {
            setLoadingDelete(true);
            setDeleteError(null);
            try {
                await deletePost(slug);
                router.push(`/`);
                router.refresh();
            } catch (error) {
                console.error("Error deleting post:", error);
                setDeleteError("Failed to delete the post. Please try again.");
            } finally {
                setLoadingDelete(false);
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
            if (
                shareMenuRef.current &&
                !shareMenuRef.current.contains(event.target as Node)
            ) {
                setIsShareMenuOpen(false);
            }
        };

        if (isMenuOpen || isShareMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen, isShareMenuOpen]);

    const toggleShareMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (!isShareMenuOpen && postContainerRef.current) {
            const containerRect = postContainerRef.current.getBoundingClientRect();
            const buttonRect = e.currentTarget.getBoundingClientRect();

            setShareMenuPos({
                top: buttonRect.bottom - containerRect.top + 5,
                left: buttonRect.left - containerRect.left
            });
        }
        setIsShareMenuOpen(!isShareMenuOpen);
    };

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/${post.slug}/`;
        try {
            await navigator.clipboard.writeText(url);
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
                setIsShareMenuOpen(false);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    return (
        <>
            {showAuthModal && <AuthModalController onCloseAll={() => setShowAuthModal(false)} />}

            <div className='mt-2'>
                <div
                    ref={postContainerRef}
                    className="bg-white dark:bg-[var(--background)] rounded-2xl mx-auto w-full relative"
                >
                    <div className="px-4 py-2">

                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                                <div className="w-9 h-9 rounded-full overflow-hidden relative flex-shrink-0">
                                    <Image
                                        className="object-cover"
                                        src={`${post.community_icon}`}
                                        alt="Community icon"
                                        fill
                                    />
                                </div>

                                <div className="min-w-0 flex flex-col">
                                    <div className="flex items-center flex-wrap gap-1">

                                        <Link
                                            href={`communities/${post.community_slug}`}
                                            className="text-sm font-bold text-primary dark:text-gray-100 hover:underline hover:text-blue-700 dark:hover:text-blue-300 leading-snug"
                                        >
                                            n/{post.community_name}
                                        </Link>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            • {new Date(post.created).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                                timeZone: 'UTC'
                                            })}
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap gap-1">
                                        <Link
                                            href={`/user/${post.author}`}
                                            className="font-medium hover:text-gray-700 dark:hover:text-gray-300"
                                        >
                                            u/{post.author}
                                        </Link>


                                    </div>
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
                                        className="absolute right-2 mt-2 w-52 bg-white dark:bg-zinc-900 rounded-md shadow-xl/30 z-10 ring-2 ring-gray-700 ring-opacity-5 overflow-hidden transform transition-all duration-150 ease-in-out origin-top-right"
                                    >
                                        {post?.is_creator && (
                                            <div>
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        router.push(`/${post.slug}/edit`);
                                                    }}
                                                    className="cursor-pointer flex items-center px-5 py-3 text-sm text-green-700 dark:text-green-200 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left">
                                                    <Pencil className="w-4 h-4 mr-3" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    className="cursor-pointer flex items-center px-5 py-3 text-sm text-red-700 dark:text-red-300 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left">
                                                    <Trash className="w-4 h-4 mr-3" />
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                        <button
                                            disabled
                                            className="cursor-not-allowed flex items-center px-5 py-3 text-sm text-gray-700 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                                        >
                                            <Bookmark className="w-4 h-4 mr-3" />
                                            Save
                                        </button>
                                        <button
                                            disabled
                                            className="cursor-not-allowed flex items-center px-5 py-3 text-sm text-gray-700 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 w-full text-left"
                                        >
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
                                onDelete={handleDeleteVote}
                                onShareClick={toggleShareMenu}
                            />

                            <CommentsSection
                                postSlug={post.slug}
                                requireAuth={requireAuth}
                            />
                        </div>
                    </div>
                    {isShareMenuOpen && (
                        <div
                            ref={shareMenuRef}
                            style={{
                                top: `${shareMenuPos.top}px`,
                                left: `${shareMenuPos.left}px`
                            }}
                            className="absolute w-48 bg-white dark:bg-zinc-900 rounded-md shadow-xl ring-2 ring-gray-600 dark:ring-gray-700 z-50 overflow-hidden"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink();
                                }}
                                className="flex items-center w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                            >
                                {isCopied ? (
                                    <Check className="w-4 h-4 mr-3 text-green-500" />
                                ) : (
                                    <LinkIcon className="w-4 h-4 mr-3" />
                                )}
                                {isCopied ? "Copied!" : "Copy link"}
                            </button>

                            <button
                                disabled
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center w-full px-4 py-3 text-sm text-gray-400 dark:text-gray-500 cursor-not-allowed hover:bg-transparent"
                            >
                                <Send className="w-4 h-4 mr-3" />
                                Send to user
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)} className="relative z-50">
                <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md">
                        <DialogTitle className="p-4 text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800">
                            Delete Post
                        </DialogTitle>
                        <div className="p-4">
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">
                                Are you sure you want to delete this post? This action cannot be undone.
                            </p>
                            {deleteError && <p className="text-sm text-red-500 mt-2">{deleteError}</p>}
                        </div>
                        <div className="p-4 flex justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                            <button
                                type="button"
                                onClick={() => setIsDeleteDialogOpen(false)}
                                className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(post.slug)}
                                disabled={loadingDelete}
                                className="cursor-pointer px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                            >
                                {loadingDelete ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
};