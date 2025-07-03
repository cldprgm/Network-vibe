'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CommunityType } from '@/services/types';
import { joinCommunity, leaveCommunity } from '@/services/api';

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
            <Link href={`/community/${community.slug}`}>
                <div className="h-[120px] border dark:border-[var(--border)] rounded-lg p-4 bg-gray-800 dark:bg-[var(--background)] hover:bg-gray-700/20 transition-colors">
                    <div className="flex items-center mb-2">
                        <img
                            src={community.icon}
                            alt={`${community.name} icon`}
                            className="w-10 h-10 rounded-full mr-3"
                        />
                        <div className="flex-grow">
                            <p className="font-bold text-white">{community.name}</p>
                            <p className="text-gray-400 text-sm">Members: nothing</p>
                        </div>
                        <button
                            disabled={loading}
                            className={`ml-2 rounded-2xl px-4 py-1.5 text-sm cursor-pointer disabled:opacity-50 ${joined ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            onClick={handleJoinToggle}
                        >
                            {joined ? 'Joined' : 'Join'}
                        </button>
                    </div>
                    <p className="text-gray-300 text-sm break-words line-clamp-2">{community.description}</p>
                </div>
            </Link>
        </div>
    );
};
