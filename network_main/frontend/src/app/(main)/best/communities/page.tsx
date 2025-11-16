'use client';

import { useState, useEffect } from 'react';
import { getTopCommunities } from '@/services/api';
import Image from 'next/image';
import Link from 'next/link';

interface Community {
    slug: string;
    name: string;
    icon: string;
    members_count: number;
    description: string;
}

const formatNumber = (num: number): string => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
};

const SkeletonListItem = () => (
    <div className="flex items-center py-3 px-2 animate-pulse border-b border-[var(--border)]">
        <div className="flex justify-center items-center font-bold text-xs w-8 text-transparent bg-gray-300 dark:bg-gray-700 rounded-full h-4">
            0
        </div>
        <div className="flex items-center justify-center px-2 w-12">
            <div className="w-9 h-9 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
        </div>
        <div className="flex flex-col flex-grow items-start ml-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24 mb-1"></div>
            <div className="h-3 bg-gray-400 dark:bg-gray-600 rounded w-32"></div>
        </div>
    </div>
);

interface CommunityListItemProps {
    community: Community;
    rank: number;
}

const CommunityListItem = ({ community, rank }: CommunityListItemProps) => {
    return (
        <Link
            href={`/communities/${community.slug}`}
            className="flex items-center py-3 px-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors duration-200"
        >
            <div className="flex justify-center items-center font-bold text-sm w-8 text-gray-700 dark:text-gray-300">
                {rank}
            </div>

            <div className="flex items-center justify-center px-2 w-12">
                <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0">
                    <Image
                        src={community.icon}
                        alt={community.name}
                        fill
                        className="object-cover select-none"
                        sizes="36px"
                    />
                </div>
            </div>

            <div className="flex flex-col flex-grow items-start overflow-hidden ml-2">
                <h3 className="m-0 font-bold text-sm text-gray-900 dark:text-white truncate max-w-full">
                    {community.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 m-0 truncate max-w-full">
                    {formatNumber(community.members_count)} members
                </p>
            </div>
        </Link>
    );
};

export default function BestOfNetworkPage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTopCommunities = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getTopCommunities();
                setCommunities(data);
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred';
                setError(`Failed to load communities: ${errorMessage}`);
                console.error("Fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchTopCommunities();
    }, []);

    const renderSkeletons = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4">
            {Array.from({ length: 9 }).map((_, index) => (
                <SkeletonListItem key={index} />
            ))}
        </div>
    );

    const renderError = () => (
        <p className="mt-4 text-center text-red-500">{error}</p>
    );

    const renderEmptyState = () => (
        <p className="mt-4 text-center text-gray-500 dark:text-gray-400">No popular communities yet.</p>
    );

    const renderCommunityGrid = () => {
        if (communities.length === 0 && !loading) return renderEmptyState();

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 mt-4">
                {communities.map((community, index) => (
                    <div key={community.slug} className="border-b border-[var(--border)] md:border-b-0">
                        <CommunityListItem community={community} rank={index + 1} />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section className="mt-15 bg-white dark:bg-[var(--background)] rounded-lg max-w-5xl mx-auto my-8 p-6">
            <header className="text-center border-b border-[var(--border)] pb-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    Best of Network
                </h1>
                <h2 className="text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                    Browse the largest communities on network
                </h2>
            </header>

            <div className="community-list-container">
                {loading ? renderSkeletons() : error ? renderError() : renderCommunityGrid()}
            </div>
        </section>
    );
}