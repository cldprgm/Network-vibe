'use client';
import { CommunityCard } from './CommunityCard';
import { useState } from 'react';
import { Subcategory } from '@/services/types';
import { api } from '@/services/auth';

interface Props {
    subcategory: Subcategory & { nextPage: string | null };
}

export const CategorySection = ({ subcategory }: Props) => {
    const [communities, setCommunities] = useState(subcategory.communities);
    const [nextPage, setNextPage] = useState<string | null>(subcategory.nextPage);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const shouldShowButton = nextPage !== null;

    const loadMoreCommunities = async () => {
        if (!nextPage) return;

        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(nextPage);
            setCommunities(prev => [...prev, ...res.data.results]);
            setNextPage(res.data.next);
        } catch (err) {
            setError('Error loading communities');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-200 mb-2">{subcategory.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {communities.map(comm => (
                    <CommunityCard key={comm.id} community={comm} />
                ))}
            </div>

            {shouldShowButton && (
                <div className="text-center mt-2">
                    <button
                        className="text-indigo-400 hover:underline text-sm cursor-pointer disabled:text-gray-500"
                        onClick={loadMoreCommunities}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Show more'}
                    </button>
                    {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
                </div>
            )}
        </div>
    );
};