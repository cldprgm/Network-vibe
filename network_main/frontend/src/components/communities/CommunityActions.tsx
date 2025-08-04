'use client';

import React, { useState } from 'react';
import { Users, Settings, Share2 } from 'lucide-react';
import { joinCommunity, leaveCommunity } from '@/services/api';
import { CommunityType } from '@/services/types';
import { useRouter } from 'next/navigation';

interface CommunityActionsProps {
    community: CommunityType;
    isMember: boolean;
}

export default function CommunityActions({ community, isMember }: CommunityActionsProps) {
    const router = useRouter();
    const [joined, setJoined] = useState(isMember);
    const [memberCount, setMemberCount] = useState(community.members_count);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);


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
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = () => {
        router.push(`/submit?communitySlug=${encodeURIComponent(community.slug)}`);
    };

    const handleShare = async () => {
        try {
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    };

    const handleManageClick = () => {
        router.push(`${community.slug}/edit`);
    };

    const primaryBtn = `cursor-pointer flex items-center gap-2 px-6 py-2 rounded-2xl font-semibold transition-transform \
    bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:scale-105 focus:outline-none \
    focus:ring-4 focus:ring-indigo-300 active:scale-95`;
    const joinedBtn = `cursor-pointer flex items-center gap-2 px-6 py-2 rounded-2xl font-semibold transition-all
    bg-gradient-to-r from-green-400 to-green-600 text-white shadow-md
    hover:from-red-400 hover:to-red-500 hover:text-white hover:shadow-lg
    transform hover:scale-101 focus:outline-none focus:ring-4 focus:ring-red-200`;
    const outlineBtn = `cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 border border-gray-600 \
    hover:border-gray-500 hover:text-white transition-colors focus:outline-none focus:ring-2 \
    focus:ring-gray-500`;
    const ghostBtn = `cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl text-gray-400 hover:text-white transition-colors \
    focus:outline-none focus:ring-2 focus:ring-gray-500`;

    const canEditCommunity = community.current_user_permissions?.includes('edit_community');

    return (
        <div className="mt-8 flex flex-wrap justify-center gap-4 px-4">
            <button
                onClick={handleJoinToggle}
                disabled={loading}
                className={joined ? joinedBtn : primaryBtn}
                aria-label={joined ? 'Joined' : 'Join'}
            >
                <Users size={18} />
                <span>{joined ? 'Joined' : 'Join'}</span>
            </button>

            <div className="flex items-center space-x-1 text-gray-400">
                <Users size={18} />
                <span>{memberCount.toLocaleString()}</span>
            </div>

            <button
                onClick={handleCreatePost}
                className={outlineBtn}
                aria-label="Create Post"
            >
                <svg fill="currentColor" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 9.25h-7.25V2a.772.772 0 0 0-.75-.75.772.772 0 0 0-.75.75v7.25H2a.772.772 0 0 0-.75.75c0 .398.352.75.75.75h7.25V18c0 .398.352.75.75.75s.75-.352.75-.75v-7.25H18c.398 0 .75-.352.75-.75a.772.772 0 0 0-.75-.75Z"></path>
                </svg>
                <span>Create Post</span>
            </button>

            <button
                onClick={handleShare}
                className={outlineBtn}
                aria-label="Share"
            >
                <Share2 size={18} />
                <span>{copied ? 'Copied!' : 'Share'}</span>
            </button>

            {canEditCommunity && (
                <button onClick={handleManageClick} className={ghostBtn} aria-label="Manage">
                    <Settings size={18} />
                    <span>Manage</span>
                </button>
            )}
        </div>
    );
}
