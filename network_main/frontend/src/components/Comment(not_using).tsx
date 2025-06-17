import React from 'react';
import { CommentType } from '@/services/types';

interface Props {
    comment: CommentType;
    depth?: number;
}

export const Comment: React.FC<Props> = ({ comment, depth = 0 }) => {
    return (
        <div
            className='bg-white dark:bg-[var(--background)] rounded-2xl p-2 mb-4'
            style={{ paddingLeft: depth * 20 + 16 }}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                    {/* Placeholder for avatar */}
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                        {comment.author.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-white text-sm">{comment.author}</span>
                </div>
                <time className="text-sm text-gray-500">
                    {new Date(comment.time_created).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </time>
            </div>

            <p className="text-gray-400 whitespace-pre-wrap mb-2">{comment.content}</p>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
                <button className="hover:text-blue-500 transition-colors">Reply</button>
                <button className="hover:text-red-500 transition-colors">Like</button>
                <span>{43} likes</span>
            </div>

            {comment.children.length > 0 && (
                <div className="mt-4">
                    {comment.children.map((child) => (
                        <Comment key={child.id} comment={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};