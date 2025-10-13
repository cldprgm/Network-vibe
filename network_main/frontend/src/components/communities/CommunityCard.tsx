'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CommunityType } from '@/services/types';
import { joinCommunity, leaveCommunity } from '@/services/api';
import Image from 'next/image';
import { Loader } from 'lucide-react';

interface Props {
    community: CommunityType;
}

export const CommunityCard = ({ community }: Props) => {
    const [joined, setJoined] = useState(community.is_member);
    const [memberCount, setMemberCount] = useState(community.members_count);
    const [loading, setLoading] = useState(false);

    const handleJoinToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);
        try {
            if (!joined) {
                await joinCommunity(community.id);
                setJoined(true);
                setMemberCount(prev => prev + 1);
            } else {
                await leaveCommunity(community.id);
                setJoined(false);
                setMemberCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-1 w-full">
            <Link href={`/communities/${community.slug}`}>
                <div className="h-[120px] border dark:border-[var(--border)] rounded-lg p-4 bg-gray-800 dark:bg-[var(--background)] hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center gap-4 mb-3">
                        <div className="relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden ring-1 ring-gray-500">
                            <Image
                                src={`${community.icon}`}
                                alt={`${community.name} icon`}
                                fill
                                style={{ objectFit: 'cover' }}
                                sizes='48'
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-white line-clamp-2">{community.name}</p>
                            <p className="text-gray-400 text-sm">{memberCount.toLocaleString()} members</p>
                        </div>
                        <button
                            disabled={loading}
                            onClick={handleJoinToggle}
                            className={`cursor-pointer flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed ${joined
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            {loading && <Loader className="w-4 h-4 animate-spin" />}
                            {joined ? 'Joined' : 'Join'}
                        </button>
                    </div>
                    <p className="text-gray-300 text-sm break-words line-clamp-2">{community.description}</p>
                </div>
            </Link>
        </div>
    );
};
