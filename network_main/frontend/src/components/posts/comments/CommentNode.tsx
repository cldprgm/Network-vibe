import { CommentType } from "@/services/types";
import { useState, useEffect } from "react";
import CommentRating from "./CommentRating";
import CommentForm from "./CommentForm";

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

export default CommentNode;