'use client';
import { CommunityCard } from './CommunityCard';
import { useState } from 'react';
import { CommunityType } from '@/services/types';
import { api } from '@/services/auth';

interface Props {
    communities: CommunityType[];
    nextPage: string | null;
    setCommunities: React.Dispatch<React.SetStateAction<CommunityType[]>>;
    setNextPage: React.Dispatch<React.SetStateAction<string | null>>;
}

export const RecommendedSection = ({ communities, nextPage, setCommunities, setNextPage }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const shouldShowButton = nextPage !== null;

    const loadMoreCommunities = async () => {
        if (!nextPage) return;

        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(nextPage);
            setCommunities(prev => [...prev, ...res.data.recommendations]);
            setNextPage(res.data.next);
        } catch (err) {
            setError('Error loading communities');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-200 mb-2">Recommended Communities</h2>
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