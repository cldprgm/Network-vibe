'use client';

interface CommentRatingProps {
    sum_rating: number;
    userVote: number | null;
    onVote: (value: number) => void;
    onDelete: () => void;
}

export default function CommentRating({ sum_rating, userVote, onVote, onDelete }: CommentRatingProps) {
    const handleClick = (value: number) => {
        if (userVote === value) {
            onDelete();
        } else {
            onVote(value);
        }
    };

    return (
        <div className="flex items-center gap-0.5 bg-transparent rounded-full ">
            <button
                className={`rounded-full cursor-pointer border border-transparent p-1.5 hover:bg-gray-300/20
            ${userVote === 1 ? 'bg-blue-500 text-white' : ''}`}
                onClick={(e) => { e.stopPropagation(), handleClick(1) }}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12.781 2.375c-.381-.475-1.181-.475-1.562 0l-8 10A1.001 1.001 0 0 0 4 14h4v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7h4a1.001 1.001 0 0 0 .781-1.625l-8-10zM15 12h-1v8h-4v-8H6.081L12 4.601 17.919 12H15z" />
                </svg>
            </button>
            <span className="text-sm cursor-default" onClick={(e) => e.stopPropagation()}>{sum_rating}</span>
            <button
                className={`rounded-full cursor-pointer border border-transparent p-1.5 hover:bg-gray-300/20
            ${userVote === -1 ? 'bg-red-500 text-white' : ''}`}
                onClick={(e) => { e.stopPropagation(), handleClick(-1) }}
            >
                <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M20.901 10.566A1.001 1.001 0 0 0 20 10h-4V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v7H4a1.001 1.001 0 0 0-.781 1.625l8 10a1 1 0 0 0 1.562 0l8-10c.24-.301.286-.712.12-1.059zM12 19.399 6.081 12H10V4h4v8h3.919L12 19.399z" />
                </svg>
            </button>
        </div>
    );
};