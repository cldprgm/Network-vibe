'use client';

import { deleteVotePost, votePost, voteComment, deleteVoteComment, createComment } from "@/services/api";
import PostMedia from "./post_media_content";
import PostRating from "./post_rating";
import CommentRating from "./comments/CommentRating";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuthStore } from "@/zustand_store/authStore";
import { Post, CommentType } from "@/services/types";
import AuthModalController from "./auth/AuthModalController";
import Image from "next/image";
import { CommentForm } from "./comments/CommentForm";

import {
    syncDataLoaderFeature,
    selectionFeature,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";

export default function PostDetailItems({ postData }: { postData: Post }) {
    const [post, setPostData] = useState(postData);
    const { isAuthenticated } = useAuthStore();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const [replyTo, setReplyTo] = useState<string | null>(null);

    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

    const [comments, setComments] = useState<CommentType[]>(post.owned_comments);

    useEffect(() => {
        setPostData(postData);
        setComments(postData.owned_comments);
    }, [postData]);

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

    const insertReplyRec = useCallback((list: CommentType[], parentId: number, created: CommentType): CommentType[] => {
        return list.map(c => {
            if (c.id === parentId) {
                return { ...c, children: [created, ...c.children] };
            } else if (c.children.length) {
                return { ...c, children: insertReplyRec(c.children, parentId, created) };
            }
            return c;
        });
    }, []);


    const handleVote = async (slug: string, value: number) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await votePost(slug, value);
                setPostData({ ...post, sum_rating, user_vote });
            } catch (error) {
                console.error('Error for voting:', error);
            }
        });
    };

    const handleDelete = async (slug: string) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await deleteVotePost(slug);
                setPostData({ ...post, sum_rating, user_vote });
            } catch (error) {
                console.error('Error for delete voice:', error);
            }
        })
    };

    const updateCommentRec = (
        list: CommentType[],
        id: number,
        updater: (c: CommentType) => Partial<CommentType>
    ): CommentType[] => {
        return list.map(c => {
            if (c.id === id) {
                return { ...c, ...updater(c) };
            } else if (c.children.length) {
                return { ...c, children: updateCommentRec(c.children, id, updater) };
            }
            return c;
        });
    };

    const handleCreateComment = useCallback(async (parentId: string, text: string) => {
        requireAuth(async () => {
            try {
                const created = await createComment(post.slug, text, parentId === 'root' ? null : Number(parentId));
                setComments(cs => {
                    if (parentId === 'root') {
                        return [created, ...cs];
                    } else {
                        return insertReplyRec(cs, Number(parentId), created);
                    }
                });
                setReplyTo(null);
            } catch (e) { console.error(e); }
        });
    }, [post.slug, requireAuth, insertReplyRec]);

    const handleCommentVote = async (commentId: number, value: number) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await voteComment(post.slug, commentId, value);
                setComments(cs =>
                    updateCommentRec(cs, commentId, () => ({ sum_rating, user_vote }))
                );
            } catch (e) { console.error(e); }
        });
    };

    const handleCommentDelete = async (commentId: number) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await deleteVoteComment(post.slug, commentId);
                setComments(cs =>
                    updateCommentRec(cs, commentId, () => ({ sum_rating, user_vote }))
                );
            } catch (e) { console.error(e); }
        });
    };

    const { commentMap, rootIds } = useMemo(() => {
        const map = new Map<string, CommentType>();
        const roots: string[] = [];

        const dfs = (c: CommentType, parentIsRoot = false) => {
            const sid = c.id.toString();
            map.set(sid, c);
            if (parentIsRoot) roots.push(sid);
            for (const ch of c.children) dfs(ch, false);
        };

        for (const c of comments) dfs(c, true);
        map.set("root", {} as any);
        return { commentMap: map, rootIds: roots };
    }, [comments]);

    const tree = useTree<string>({
        initialState: { expandedItems: ["root"] },
        rootItemId: "root",
        getItemName: () => "", // ?
        isItemFolder: item => {
            const id = item.getId();
            if (id === "root") return true;
            return commentMap.get(id)!.children.length > 0;
        },
        dataLoader: {
            getItem: id => id,
            getChildren: id =>
                id === "root" ? rootIds : commentMap.get(id)!.children.map(c => c.id.toString()),
        },
        indent: 20,
        features: [
            syncDataLoaderFeature,
            selectionFeature,
        ],
    });

    useEffect(() => {
        tree.rebuildTree();
    }, [comments]);

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
                                {/* Post rating buttons */}

                                <PostRating
                                    sum_rating={post.sum_rating}
                                    userVote={post.user_vote}
                                    onVote={(value: number) => handleVote(post.slug, value)}
                                    onDelete={() => handleDelete(post.slug)}
                                />

                                {/* Comment link */}
                                <Link href='#' className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
                                    <svg width="18" height="18" viewBox="100 255 34 32" fill="currentColor">
                                        <path d="M116,281 C114.832,281 113.704,280.864 112.62,280.633 L107.912,283.463 L107.975,278.824 C104.366,276.654 102,273.066 102,269 C102,262.373 108.268,257 116,257 C123.732,257 130,262.373 130,269 C130,275.628 123.732,281 116,281 L116,281 Z M116,255 C107.164,255 100,261.269 100,269 C100,273.419 102.345,277.354 106,279.919 L106,287 L113.009,282.747 C113.979,282.907 114.977,283 116,283 C124.836,283 132,276.732 132,269 C132,261.269 124.836,255 116,255 L116,255 Z" />
                                    </svg>
                                    <span className="text-sm">432</span>
                                </Link>

                                {/* Share link */}
                                <Link href="#" className="flex items-center gap-1 bg-gray-200/20 hover:bg-gray-200/40 rounded-full px-3 py-1.5">
                                    <svg width="22" height="22" viewBox="5 4 17 17" fill="currentColor">
                                        <path d="M14.734 15.8974L19.22 12.1374C19.3971 11.9927 19.4998 11.7761 19.4998 11.5474C19.4998 11.3187 19.3971 11.1022 19.22 10.9574L14.734 7.19743C14.4947 6.9929 14.1598 6.94275 13.8711 7.06826C13.5824 7.19377 13.3906 7.47295 13.377 7.78743V9.27043C7.079 8.17943 5.5 13.8154 5.5 16.9974C6.961 14.5734 10.747 10.1794 13.377 13.8154V15.3024C13.3888 15.6178 13.5799 15.8987 13.8689 16.0254C14.158 16.1521 14.494 16.1024 14.734 15.8974Z" />
                                    </svg>
                                    <span className="text-sm">Share</span>
                                </Link>
                            </div>

                            <section className="mt-5">
                                {replyTo === 'root' ? (
                                    <CommentForm parentId="root" onSubmit={handleCreateComment} onCancel={() => setReplyTo(null)} />
                                ) : renderPlaceholder()}

                                <div {...tree.getContainerProps()} className="space-y-2">
                                    {tree.getItems().map((item) => {
                                        const id = item.getId();
                                        if (id === "root") return null;
                                        const comment = commentMap.get(id)!;
                                        const level = item.getItemMeta().level;
                                        const hasChildren = comment.children.length > 0;
                                        const isExpanded = item.isExpanded();

                                        return (
                                            <div
                                                key={id}
                                                {...item.getProps()}
                                                className="bg-white dark:bg-[var(--background)] rounded-2xl flex flex-col "
                                                style={{ paddingLeft: `${0 + level * 30}px` }}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center space-x-1">
                                                        {hasChildren && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    isExpanded ? item.collapse() : item.expand()
                                                                }}
                                                                className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-300 transition-colors"
                                                            >
                                                                {isExpanded
                                                                    ? <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><rect x="4" y="9" width="12" height="2" rx="1" /></svg>
                                                                    : <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"> <rect x="9" y="4" width="2" height="12" rx="1" /><rect x="4" y="9" width="12" height="2" rx="1" /></svg>
                                                                }
                                                            </button>
                                                        )}

                                                        <div className="flex gap-2 mb-2">
                                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                                                {comment.author.charAt(0).toUpperCase()}
                                                            </div>

                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-white text-sm">{comment.author}</span>
                                                                    <span className="text-gray-400 text-sm">•</span>
                                                                    <time className="text-sm text-gray-500">
                                                                        {new Date(comment.time_created).toLocaleString(undefined, {
                                                                            year: "numeric",
                                                                            month: "short",
                                                                            day: "numeric",
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })}
                                                                    </time>
                                                                </div>
                                                                <p className="text-gray-400 break-all whitespace-pre-wrap mt-2">
                                                                    {comment.content}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>


                                                <div className="flex mb-2 items-center sm:flex-nowrap gap-2 sm:gap-3 w-full">
                                                    <CommentRating
                                                        sum_rating={comment.sum_rating}
                                                        userVote={comment.user_vote}
                                                        onVote={(v) => handleCommentVote(comment.id, v)}
                                                        onDelete={() => handleCommentDelete(comment.id)}
                                                    />

                                                    <button
                                                        className="flex items-center gap-1 bg-transparent hover:bg-gray-200/20 rounded-full px-3 py-1.5 cursor-pointer"
                                                        onClick={e => { e.stopPropagation(); setReplyTo(id); if (!item.isExpanded()) item.expand(); }}
                                                    >
                                                        <svg width="22" height="22" viewBox="100 255 34 32" fill="currentColor">
                                                            <path d="M116,281 C114.832,281 113.704,280.864 112.62,280.633 L107.912,283.463 L107.975,278.824 C104.366,276.654 102,273.066 102,269 C102,262.373 108.268,257 116,257 C123.732,257 130,262.373 130,269 C130,275.628 123.732,281 116,281 L116,281 Z M116,255 C107.164,255 100,261.269 100,269 C100,273.419 102.345,277.354 106,279.919 L106,287 L113.009,282.747 C113.979,282.907 114.977,283 116,283 C124.836,283 132,276.732 132,269 C132,261.269 124.836,255 116,255 L116,255 Z" />
                                                        </svg>
                                                        <span className="text-sm">Reply</span>
                                                    </button>

                                                    {/* Share link */}
                                                    <button className="flex items-center gap-1 bg-transparent hover:bg-gray-200/20 rounded-full px-3 py-1.5 cursor-pointer">
                                                        <svg width="22" height="22" viewBox="5 4 17 17" fill="currentColor">
                                                            <path d="M14.734 15.8974L19.22 12.1374C19.3971 11.9927 19.4998 11.7761 19.4998 11.5474C19.4998 11.3187 19.3971 11.1022 19.22 10.9574L14.734 7.19743C14.4947 6.9929 14.1598 6.94275 13.8711 7.06826C13.5824 7.19377 13.3906 7.47295 13.377 7.78743V9.27043C7.079 8.17943 5.5 13.8154 5.5 16.9974C6.961 14.5734 10.747 10.1794 13.377 13.8154V15.3024C13.3888 15.6178 13.5799 15.8987 13.8689 16.0254C14.158 16.1521 14.494 16.1024 14.734 15.8974Z" />
                                                        </svg>
                                                        <span className="text-sm">Share</span>
                                                    </button>

                                                    {/* Options */}
                                                    <button className="flex items-center gap-1 bg-transparent hover:bg-gray-200/20 rounded-full px-3 py-1.5 cursor-pointer">
                                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                                            <circle cx="6" cy="12" r="2" fill="#FFFFFF" />
                                                            <circle cx="12" cy="12" r="2" fill="#FFFFFF" />
                                                            <path d="M20 12C20 13.1046 19.1046 14 18 14C16.8954 14 16 13.1046 16 12C16 10.8954 16.8954 10 18 10C19.1046 10 20 10.8954 20 12Z" fill="#FFFFFF" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                {replyTo === id && <CommentForm parentId={id} onSubmit={handleCreateComment} onCancel={() => setReplyTo(null)} />}

                                                <hr className='border-[var(--border)] mt-2' />

                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>

                    </div>

                </div>

            </div>
        </>
    );
};