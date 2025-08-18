import { CommentType } from "@/services/types";
import { useState, useEffect } from "react";
import CommentRating from "./CommentRating";
import CommentForm from "./CommentForm";
import { MessageSquare, Plus, Minus } from 'lucide-react';

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
        if (!isExpanded) {
            toggleExpand();
        }
    };

    return (
        <div>
            <div className="bg-white dark:bg-[var(--background)] rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-300 flex-shrink-0">
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
                        <MessageSquare size={16} className="text-gray-500 dark:text-gray-400" />
                        Reply
                    </button>

                    {hasChildren && (
                        <button
                            className="flex items-center gap-1 bg-transparent hover:bg-gray-200/20 dark:hover:bg-gray-700/50 rounded-full px-3 py-1.5 cursor-pointer text-sm text-gray-500 dark:text-gray-400"
                            onClick={toggleExpand}
                            disabled={childrenLoading}
                        >
                            {isExpanded ? (
                                <Minus size={16} className="text-gray-500 dark:text-gray-400" />
                            ) : (
                                <Plus size={16} className="text-gray-500 dark:text-gray-400" />
                            )}
                            {childrenLoading ? 'Loading...' : isExpanded ? 'Hide replies' : `Show replies (${comment.replies_count})`}
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
            </div>

            {isExpanded && childComments.length > 0 && (
                <div className="mt-3 space-y-3 pl-4 lg:pl-6 border-l-2 border-gray-200 dark:border-gray-700">
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