'use client';
import { CommunityCard } from './CommunityCard';
import { useState } from 'react';
import { Subcategory } from '@/services/types';

interface Props {
    subcategory: Subcategory;
}

export const CategorySection = ({ subcategory }: Props) => {
    const [showAll, setShowAll] = useState(false);
    const communities = showAll ? subcategory.communities : subcategory.communities.slice(0, 6);

    return (
        <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-200 mb-2">{subcategory.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {communities.map(comm => (
                    <CommunityCard key={comm.id} community={comm} />
                ))}
            </div>
            {subcategory.communities.length > 6 && (
                <div className="text-center mt-2">
                    <button
                        className="text-indigo-400 hover:underline text-sm cursor-pointer"
                        onClick={() => setShowAll(!showAll)}
                    >
                        {showAll ? 'Show less' : 'Show more'}
                    </button>
                </div>
            )}
        </div>
    );
};
