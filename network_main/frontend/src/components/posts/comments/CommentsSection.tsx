'use client';

import {
    voteComment,
    deleteVoteComment,
    createComment,
    fetchComments,
    fetchReplies
} from "@/services/api";
import CommentForm from "./CommentForm";
import CommentNode from "./CommentNode";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { CommentType } from "@/services/types";

interface CommentsSectionProps {
    postSlug: string;
    requireAuth: (callback: () => void) => void;
}

export default function CommentsSection({
    postSlug,
    requireAuth
}: CommentsSectionProps) {
    const [rootComments, setRootComments] = useState<CommentType[]>([]);
    const [hasMoreRoot, setHasMoreRoot] = useState(true);
    const [loadingRoot, setLoadingRoot] = useState(false);
    const [rootPage, setRootPage] = useState(1);
    const [replyTo, setReplyTo] = useState<string | null>(null);
    const commentsMapRef = useRef<Map<number, CommentType>>(new Map());
    const observerTarget = useRef<HTMLDivElement>(null);
    const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const loadInitialComments = async () => {
            setLoadingRoot(true);
            try {
                const { results, next } = await fetchComments(postSlug);
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
    }, [postSlug]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            async ([entry]) => {
                if (entry.isIntersecting && hasMoreRoot && !loadingRoot) {
                    setLoadingRoot(true);
                    try {
                        const { results, next } = await fetchComments(postSlug, rootPage + 1);
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
    }, [hasMoreRoot, loadingRoot, postSlug, rootPage]);

    useEffect(() => {
        if (replyTo === "root" || replyTo != null) {
            setTimeout(() => {
                commentTextareaRef.current?.focus();
            }, 0);
        }
    }, [replyTo]);

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
            const children = await fetchReplies(postSlug, parentId);

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

    const handleCreateComment = useCallback(async (parentId: string, text: string) => {
        requireAuth(async () => {
            try {
                const created = await createComment(postSlug, text, parentId === 'root' ? null : Number(parentId));

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
    }, [postSlug, requireAuth]);

    const handleCommentVote = async (commentId: number, value: number) => {
        requireAuth(async () => {
            try {
                const { sum_rating, user_vote } = await voteComment(postSlug, commentId, value);

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
                const { sum_rating, user_vote } = await deleteVoteComment(postSlug, commentId);

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
    );
};