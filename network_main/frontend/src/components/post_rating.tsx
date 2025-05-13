'use client';

export default function PostRating ({sum_rating, userVote, onVote, onDelete}: 
    {sum_rating: number, userVote: number,onVote: any, onDelete: any}) {
    const handleClick = (value: number) => {
        if (userVote === value) {
            onDelete();
        } else {
            onVote(value);
        }
    };

    console.log('userVote is :', userVote)

    return (
    <div className="flex items-center gap-0.5 bg-gray-200/20 rounded-full ">
        <button
        className={`btn btn-sm btn-secondary rounded-full border border-transparent p-1.5 hover:bg-gray-300/40
            ${userVote === 1 ? 'bg-blue-500 text-white': ''}`}
        onClick={() => handleClick(1)}
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
        <span className="text-sm">{sum_rating}</span>
        <button
        className={`btn btn-sm btn-secondary rounded-full border border-transparent p-1.5 hover:bg-gray-300/40
            ${userVote === -1 ? 'bg-red-500 text-white': ''}`}
        onClick={() => handleClick(-1)}
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
);};