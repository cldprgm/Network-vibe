'use client';
import React from 'react';

interface Category {
    slug: string;
    title: string;
}

interface Props {
    categories: Category[];
    selected: string;
    onSelect: (slug: string) => void;
}

export const CategoryToolbar: React.FC<Props> = ({ categories, selected, onSelect }) => (
    <div className="flex overflow-x-auto gap-2 mb-4">
        {categories.map(cat => (
            <button
                key={cat.slug}
                onClick={() => onSelect(cat.slug)}
                className={`
          px-3 py-1.5 whitespace-nowrap rounded-lg font-medium cursor-pointer
          ${cat.slug === selected
                        ? 'border border-transparent bg-indigo-600 text-white'
                        : 'border border-gray-600 text-gray-200 hover:bg-gray-700'}
        `}
            >
                {cat.title}
            </button>
        ))}
    </div>
);
