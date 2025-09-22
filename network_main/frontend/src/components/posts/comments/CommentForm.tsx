import React from 'react';

interface Props {
    parentId: string;
    onSubmit: (parentId: string, text: string) => void;
    onCancel?: () => void;
}

const CommentForm = React.forwardRef<HTMLTextAreaElement, Props>(({ parentId, onSubmit, onCancel }, ref) => {
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
            <div className="flex justify-end gap-2 pb-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="cursor-pointer px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                >
                    Comment
                </button>
            </div>
        </form>
    );
});
CommentForm.displayName = 'CommentForm';
export default CommentForm;