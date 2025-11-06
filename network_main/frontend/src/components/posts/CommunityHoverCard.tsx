'use client'

import React from 'react';
import Image from 'next/image';
import { CommunityType } from '@/services/types';

interface CardContentProps {
    community: CommunityType;
    onJoin: (communityId: number) => void;
}

interface CommunityHoverCardProps {
    community: CommunityType | null;
    isLoading: boolean;
    onJoin: (communityId: number) => void;
    style: React.CSSProperties;
    cardRef: React.Ref<HTMLDivElement>;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const CardContent = ({ community, onJoin }: CardContentProps) => (
    <div className="w-80">
        <div
            className="h-18 bg-zinc-200 dark:bg-zinc-700 bg-cover bg-center"
            style={{ backgroundImage: `url(${community.banner})` }}
        />
        <div className="p-4 pt-8 flex flex-col">
            <div className="flex items-end space-x-2 -mt-14 mb-4">
                <div className="relative w-16 h-16 bg-zinc-300 dark:bg-zinc-600 rounded-full flex-shrink-0 border-4 border-white dark:border-zinc-800 overflow-hidden">
                    <Image
                        src={`${community.icon}`}
                        alt={`${community.name} icon`}
                        layout="fill"
                        objectFit="cover"
                    />
                </div>
                <div className="pb-1">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white break-all">
                        n/{community.name}
                    </h3>
                </div>
            </div>

            <div className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">
                <span>{community.members_count.toLocaleString()} members</span>
                <span className="mx-2">·</span>
                <span className="flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                    {community.online_members} online
                </span>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 break-words line-clamp-2">
                {community.description || "No description provided."}
            </p>

            {!community.is_member && (
                <button
                    type='button'
                    onClick={() => onJoin(community.id)}
                    className="cursor-pointer w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                >
                    Join
                </button>
            )}
        </div>
    </div>
);

export default function CommunityHoverCard({
    community,
    isLoading,
    onJoin,
    style,
    cardRef,
    onMouseEnter,
    onMouseLeave,
}: CommunityHoverCardProps) {

    const containerClasses = [
        "absolute z-50",
        "bg-white dark:bg-zinc-800",
        "rounded-lg overflow-hidden",
        "border border-zinc-200 dark:border-zinc-700",
        "ring ring-zinc-700 shadow-xl/100 shadow-black/10 dark:shadow-black",
    ].join(' ');

    if (isLoading || !community) {
        return null;
    }

    return (
        <div
            ref={cardRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={style}
            className={containerClasses}
        >
            <CardContent community={community} onJoin={onJoin} />
        </div>
    );
}