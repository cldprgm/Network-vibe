import React, { useRef, useEffect } from 'react';

interface CommentFormProps {
    parentId: string;
    onSubmit: (parentId: string, text: string) => void;
    onCancel: () => void;
}

export const CommentForm = React.memo(function CommentForm({
    parentId, onSubmit, onCancel,
}: CommentFormProps) {

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const text = textareaRef.current?.value.trim() || '';
                if (!text) return;
                onSubmit(parentId, text);
                textareaRef.current!.value = '';
            }}
            className="flex flex-col mb-4"
        >
            <textarea
                ref={textareaRef}
                onClick={(e) => e.stopPropagation()}
                className="w-full p-3 rounded-3xl bg-transparent text-gray-500 dark:text-gray-100 border
                   dark:hover:border-gray-300 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400 mb-2"
                rows={3}
                placeholder="Write a comment..."
                maxLength={500}
                required
            />
            <div className="flex justify-end gap-2">
                <button
                    type="submit"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-2 bg-blue-500 text-white rounded-3xl hover:bg-blue-600 transition cursor-pointer"
                >
                    Comment
                </button>
                <button
                    type="button"
                    onClick={(e) => { onCancel(); e.stopPropagation() }}
                    className="px-3 py-2 bg-gray-300 text-gray-700 rounded-3xl hover:bg-gray-400 transition cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
});
