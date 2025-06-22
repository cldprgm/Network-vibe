'use client';

import {
    deleteVotePost,
    votePost,
    voteComment,
    deleteVoteComment,
    createComment,
    fetchComments,
    fetchReplies
} from "@/services/api";
import PostMedia from "./post_media_content";
import PostRating from "./post_rating";
import CommentRating from "./comments/CommentRating";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/zustand_store/authStore";
import { Post, CommentType } from "@/services/types";
import AuthModalController from "./auth/AuthModalController";
import Image from "next/image";

export default function PostDetailItems({ postData }: { postData: Post }) {
    const [post, setPostData] = useState(postData);
    const { isAuthenticated } = useAuthStore();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

    const [rootComments, setRootComments] = useState<CommentType[]>([]);
    const [hasMoreRoot, setHasMoreRoot] = useState(true);
    const [loadingRoot, setLoadingRoot] = useState(false);
    const [rootPage, setRootPage] = useState(1);
    const commentsMapRef = useRef<Map<number, CommentType>>(new Map());
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadInitialComments = async () => {
            setLoadingRoot(true);
            try {
                const { results, next } = await fetchComments(post.slug);
                setRootComments(results);
                setHasMoreRoot(!!next);

                const newMap = new Map<number, CommentType>();
                results.forEach(comment => newMap.set(comment.id, comment));
                commentsMapRef.current = newMap;
            } catch (error) {
                console.error("Failed to load comments:", error);
            } finally {
                setLoadingRoot(false);
            }
        };

        loadInitialComments();
    }, [post.slug]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            async ([entry]) => {
                if (entry.isIntersecting && hasMoreRoot && !loadingRoot) {
                    setLoadingRoot(true);
                    try {
                        const { results, next } = await fetchComments(post.slug, rootPage + 1);
                        setRootPage(prev => prev + 1);
                        setRootComments(prev => [...prev, ...results]);
                        setHasMoreRoot(!!next);

                        const newMap = new Map(commentsMapRef.current);
                        results.forEach(comment => newMap.set(comment.id, comment));
                        commentsMapRef.current = newMap;
                    } catch (error) {
                        console.error("Failed to load more comments:", error);
                    } finally {
                        setLoadingRoot(false);
                    }
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMoreRoot, loadingRoot, post.slug, rootPage]);

    useEffect(() => {
        if (replyTo === "root" || replyTo != null) {
            setTimeout(() => {
                commentTextareaRef.current?.focus();
            }, 0);
        }
    }, [replyTo]);

    const requireAuth = (callback: () => void) => {
        if (!isAuthenticated) {
            setShowAuthModal(true);
            return;
        }
        callback();
    };

    function addChildrenToComment(
        comments: CommentType[],
        parentId: number,
        children: CommentType[]
    ): CommentType[] {
        return comments.map(comment => {
            if (comment.id === parentId) {
                return { ...comment, children };
            }
            if (comment.children) {
                return {
                    ...comment,
                    children: addChildrenToComment(comment.children, parentId, children)
                };
            }
            return comment;
        });
    }

    const loadChildren = async (parentId: number) => {
        try {
            const children = await fetchReplies(post.slug, parentId);

            setRootComments(prev =>
                addChildrenToComment(prev, parentId, children)
            );

            const newMap = new Map(commentsMapRef.current);
            children.forEach(child => newMap.set(child.id, child));
            const parent = newMap.get(parentId)!
            newMap.set(parentId, { ...parent, children });
            commentsMapRef.current = newMap;
        } catch (error) {
            console.error("Failed to load replies:", error);
        }
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

    const handleCreateComment = useCallback(async (parentId: string, text: string) => {
        requireAuth(async () => {
            try {
                const created = await createComment(post.slug, text, parentId === 'root' ? null : Number(parentId));

                const updateComments = (comments: CommentType[]): CommentType[] => {
                    return comments.map(comment => {
                        if (comment.id.toString() === parentId) {
                            return {
                                ...comment,
                                children: [created, ...(comment.children || [])]
                            };
                        }

                        if (comment.children) {
                            return {
                                ...comment,
                                children: updateComments(comment.children)
                            };
                        }

                        return comment;
                    });
                };

                setRootComments(prev => {
                    if (parentId === 'root') {
                        return [created, ...prev];
                    } else {
                        return updateComments(prev);
                    }
                });

                const newMap = new Map(commentsMapRef.current);
                newMap.set(created.id, created);

                if (parentId !== 'root') {
                    const parent = newMap.get(Number(parentId));
                    if (parent) {
                        newMap.set(Number(parentId), {
                            ...parent,
                            children: [created, ...(parent.children || [])]
                        });
                    }
                }

                commentsMapRef.current = newMap;
                setReplyTo(null);
            } catch (e) { console.error(e); }
        });
    }, [post.slug, requireAuth]);

    const handleCommentVote = async (commentId: number, value: number) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await voteComment(post.slug, commentId, value);

                setRootComments(prev =>
                    prev.map(comment => updateCommentAndChildren(comment, commentId, sum_rating, user_vote))
                );

                const newMap = new Map(commentsMapRef.current);
                const comment = newMap.get(commentId);
                if (comment) {
                    newMap.set(commentId, { ...comment, sum_rating, user_vote });
                }
                commentsMapRef.current = newMap;
            } catch (e) { console.error(e); }
        });
    };

    const handleCommentDelete = async (commentId: number) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await deleteVoteComment(post.slug, commentId);

                setRootComments(prev =>
                    prev.map(comment => updateCommentAndChildren(comment, commentId, sum_rating, user_vote))
                );

                const newMap = new Map(commentsMapRef.current);
                const comment = newMap.get(commentId);
                if (comment) {
                    newMap.set(commentId, { ...comment, sum_rating, user_vote });
                }
                commentsMapRef.current = newMap;
            } catch (e) { console.error(e); }
        });
    };

    const updateCommentAndChildren = (
        comment: CommentType,
        targetId: number,
        sum_rating: number,
        user_vote: number
    ): CommentType => {
        if (comment.id === targetId) {
            return { ...comment, sum_rating, user_vote };
        }

        if (comment.children) {
            return {
                ...comment,
                children: comment.children.map(child =>
                    updateCommentAndChildren(child, targetId, sum_rating, user_vote)
                )
            };
        }

        return comment;
    };

    const renderPlaceholder = () => (
        <div
            onClick={() => { setReplyTo('root'); }}
            className="mb-4 w-full p-3 rounded-3xl bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-500/20 border dark:hover:border-gray-300 cursor-text transition"
        >
            <span className="select-none">Join the conversation</span>
        </div>
    );

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
                                        <a href="#" className="text-sm mr-1.5 dark:text-gray-200/90 font-semibold text-primary hover:underline hover:text-blue-700 dark:hover:text-blue-400">
                                            n/{post.community_name}
                                        </a>
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
                            <div className="flex items-center sm:flex-nowrap gap-2 sm:gap-3 w-full">
                                <PostRating
                                    sum_rating={post.sum_rating}
                                    userVote={post.user_vote}
                                    onVote={(value: number) => handleVote(post.slug, value)}
                                    onDelete={() => handleDelete(post.slug)}
                                />

                                <Link href='#' className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
                                    <svg width="18" height="18" viewBox="100 255 34 32" fill="currentColor">
                                        <path d="M116,281 C114.832,281 113.704,280.864 112.62,280.633 L107.912,283.463 L107.975,278.824 C104.366,276.654 102,273.066 102,269 C102,262.373 108.268,257 116,257 C123.732,257 130,262.373 130,269 C130,275.628 123.732,281 116,281 L116,281 Z M116,255 C107.164,255 100,261.269 100,269 C100,273.419 102.345,277.354 106,279.919 L106,287 L113.009,282.747 C113.979,282.907 114.977,283 116,283 C124.836,283 132,276.732 132,269 C132,261.269 124.836,255 116,255 L116,255 Z" />
                                    </svg>
                                    <span className="text-sm">432</span>
                                </Link>

                                <Link href="#" className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
                                    <svg width="22" height="22" viewBox="5 4 17 17" fill="currentColor">
                                        <path d="M14.734 15.8974L19.22 12.1374C19.3971 11.9927 19.4998 11.7761 19.4998 11.5474C19.4998 11.3187 19.3971 11.1022 19.22 10.9574L14.734 7.19743C14.4947 6.9929 14.1598 6.94275 13.8711 7.06826C13.5824 7.19377 13.3906 7.47295 13.377 7.78743V9.27043C7.079 8.17943 5.5 13.8154 5.5 16.9974C6.961 14.5734 10.747 10.1794 13.377 13.8154V15.3024C13.3888 15.6178 13.5799 15.8987 13.8689 16.0254C14.158 16.1521 14.494 16.1024 14.734 15.8974Z" />
                                    </svg>
                                    <span className="text-sm">Share</span>
                                </Link>
                            </div>

                            <section className="mt-5">
                                {replyTo === 'root' ? (
                                    <CommentForm
                                        parentId="root"
                                        onSubmit={handleCreateComment}
                                        onCancel={() => setReplyTo(null)}
                                        ref={commentTextareaRef}
                                    />
                                ) : renderPlaceholder()}

                                <div className="space-y-4">
                                    {rootComments.map(comment => (
                                        <CommentNode
                                            key={comment.id}
                                            comment={comment}
                                            depth={0}
                                            replyTo={replyTo}
                                            setReplyTo={setReplyTo}
                                            onCreateComment={handleCreateComment}
                                            onVote={handleCommentVote}
                                            onDeleteVote={handleCommentDelete}
                                            onLoadChildren={loadChildren}
                                        />
                                    ))}

                                    {loadingRoot && (
                                        <div className="flex justify-center py-4">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-200" />
                                        </div>
                                    )}

                                    {hasMoreRoot && !loadingRoot && (
                                        <div ref={observerTarget} className="h-2" />
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

const CommentNode = ({
    comment,
    depth,
    replyTo,
    setReplyTo,
    onCreateComment,
    onVote,
    onDeleteVote,
    onLoadChildren
}: {
    comment: CommentType;
    depth: number;
    replyTo: string | null;
    setReplyTo: (id: string | null) => void;
    onCreateComment: (parentId: string, text: string) => void;
    onVote: (commentId: number, value: number) => void;
    onDeleteVote: (commentId: number) => void;
    onLoadChildren: (parentId: number) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [childrenLoading, setChildrenLoading] = useState(false);
    const [childComments, setChildComments] = useState<CommentType[]>(comment.children || []);

    useEffect(() => {
        if (comment.children) {
            setChildComments(comment.children);
        }
    }, [comment.children]);

    const hasChildren = comment.replies_count > 0;

    const toggleExpand = async () => {
        if (!isExpanded && hasChildren && !comment.children) {
            setChildrenLoading(true);
            try {
                await onLoadChildren(comment.id);
            } finally {
                setChildrenLoading(false);
            }
        }
        setIsExpanded(!isExpanded);
    };

    const handleReplyClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setReplyTo(comment.id.toString());
        if (!isExpanded) setIsExpanded(true);
    };

    return (
        <div
            className={`bg-white dark:bg-[var(--background)] rounded-2xl p-4 border border-gray-200 dark:border-gray-700`}
            style={{ marginLeft: `${depth * 30}px` }}
        >
            <div className="flex gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300">
                    {comment.author.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">
                            {comment.author}
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <time className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(comment.time_created).toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </time>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 break-all whitespace-pre-wrap">
                        {comment.content}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
                <CommentRating
                    sum_rating={comment.sum_rating}
                    userVote={comment.user_vote}
                    onVote={(v) => onVote(comment.id, v)}
                    onDelete={() => onDeleteVote(comment.id)}
                />

                <button
                    className="flex items-center gap-1 bg-transparent hover:bg-gray-200/20 dark:hover:bg-gray-700/50 rounded-full px-3 py-1.5 cursor-pointer text-sm text-gray-500 dark:text-gray-400"
                    onClick={handleReplyClick}
                >
                    <svg width="18" height="18" viewBox="100 255 34 32" fill="currentColor">
                        <path d="M116,281 C114.832,281 113.704,280.864 112.62,280.633 L107.912,283.463 L107.975,278.824 C104.366,276.654 102,273.066 102,269 C102,262.373 108.268,257 116,257 C123.732,257 130,262.373 130,269 C130,275.628 123.732,281 116,281 L116,281 Z M116,255 C107.164,255 100,261.269 100,269 C100,273.419 102.345,277.354 106,279.919 L106,287 L113.009,282.747 C113.979,282.907 114.977,283 116,283 C124.836,283 132,276.732 132,269 C132,261.269 124.836,255 116,255 L116,255 Z" />
                    </svg>
                    Reply
                </button>

                {hasChildren && (
                    <button
                        className="flex items-center gap-1 bg-transparent hover:bg-gray-200/20 dark:hover:bg-gray-700/50 rounded-full px-3 py-1.5 cursor-pointer text-sm text-gray-500 dark:text-gray-400"
                        onClick={toggleExpand}
                        disabled={childrenLoading}
                    >
                        {isExpanded ? (
                            <>
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <rect x="4" y="9" width="12" height="2" rx="1" />
                                </svg>
                                Hide replies
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <rect x="9" y="4" width="2" height="12" rx="1" />
                                    <rect x="4" y="9" width="12" height="2" rx="1" />
                                </svg>
                                {childrenLoading ? 'Loading...' : `Show replies (${comment.replies_count})`}
                            </>
                        )}
                    </button>
                )}
            </div>

            {replyTo === comment.id.toString() && (
                <div className="mt-3">
                    <CommentForm
                        parentId={comment.id.toString()}
                        onSubmit={onCreateComment}
                        onCancel={() => setReplyTo(null)}
                    />
                </div>
            )}

            {isExpanded && childComments.length > 0 && (
                <div className="mt-3 space-y-3">
                    {childComments.map(child => (
                        <CommentNode
                            key={child.id}
                            comment={child}
                            depth={depth + 1}
                            replyTo={replyTo}
                            setReplyTo={setReplyTo}
                            onCreateComment={onCreateComment}
                            onVote={onVote}
                            onDeleteVote={onDeleteVote}
                            onLoadChildren={onLoadChildren}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const CommentForm = React.forwardRef<HTMLTextAreaElement, {
    parentId: string;
    onSubmit: (parentId: string, text: string) => void;
    onCancel: () => void;
}>(({ parentId, onSubmit, onCancel }, ref) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const textarea = e.currentTarget.querySelector('textarea');
        const text = textarea?.value.trim() || '';
        if (!text) return;
        onSubmit(parentId, text);
        if (textarea) textarea.value = '';
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col mt-3">
            <textarea
                ref={ref}
                className="w-full p-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 mb-2"
                rows={3}
                placeholder="Write a comment..."
                maxLength={500}
                required
            />
            <div className="flex justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                >
                    Comment
                </button>
            </div>
        </form>
    );
});
CommentForm.displayName = 'CommentForm';