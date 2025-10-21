'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User } from '@/services/types';
import { getUser } from '@/services/auth';
import { Calendar, User as UserIcon, MessageCircle } from 'lucide-react';
import UserPostList from '@/components/user/UserPostList';

export default function UserProfilePage() {
    const params = useParams();
    const slug = params?.userSlug as string;
    const [user, setUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'comments'>('overview');
    const [sort, setSort] = useState<'new' | 'top'>('top');

    useEffect(() => {
        if (slug) {
            fetchUser();
        }
    }, [slug]);

    const fetchUser = async () => {
        try {
            const data = await getUser(slug);
            setUser(data);
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    if (!user) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    const fullName = `${user.first_name} ${user.last_name}`;
    const joinedDate = new Date(user.date_joined).toLocaleDateString();
    const birthDate = new Date(user.birth_date).toLocaleDateString();

    const getFilter = (currentSort: typeof sort): 'new' | 'popular' => {
        return currentSort === 'new' ? 'new' : 'popular';
    };

    return (
        <div className="w-full mt-20 min-w-0 bg-zinc-50 dark:bg-[var(--background)]">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="px-6 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative bg-white dark:bg-[var(--background)] rounded-2xl mb-6">
                    <div className="flex-shrink-0">
                        <Image
                            src={user.avatar}
                            alt={`${fullName} avatar`}
                            width={100}
                            height={100}
                            className="rounded-full border-3 border-white dark:border-gray-400/15 overflow-hidden w-24 h-24"
                        />
                    </div>
                    <div className="w-full text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{fullName}</h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 font-semibold mb-4">
                            @{user.username}
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                            <div className="flex items-center space-x-1">
                                <Calendar size={16} className="text-zinc-500 dark:text-zinc-400" />
                                <span>Joined {joinedDate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <UserIcon size={16} className="text-zinc-500 dark:text-zinc-400" />
                                <span>{user.gender}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[var(--background)] rounded-t-xl overflow-hidden">
                        <nav className="-mb-px flex space-x-0 w-full">
                            <Link
                                href="#"
                                onClick={() => setActiveTab('overview')}
                                className={`flex-1 py-4 px-6 border-b-2 font-medium text-sm text-center transition-colors ${activeTab === 'overview'
                                    ? 'text-white bg-indigo-50 dark:bg-gray-400/10'
                                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                    }`}
                            >
                                Overview
                            </Link>
                            <Link
                                href="#"
                                onClick={() => setActiveTab('posts')}
                                className={`flex-1 py-4 px-6 border-b-2 font-medium text-sm text-center transition-colors ${activeTab === 'posts'
                                    ? 'text-white bg-indigo-50 dark:bg-gray-400/10'
                                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                    }`}
                            >
                                Posts
                            </Link>
                            <Link
                                href="#"
                                onClick={() => setActiveTab('comments')}
                                className={`flex-1 py-4 px-6 border-b-2 font-medium text-sm text-center transition-colors ${activeTab === 'comments'
                                    ? 'text-white bg-indigo-50 dark:bg-gray-400/10'
                                    : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                    }`}
                            >
                                Comments
                            </Link>
                        </nav>
                    </div>
                </div>

                <div className="space-y-6 pb-8 md:p-2">
                    {activeTab !== 'overview' && (
                        <div className="flex h-10 items-center justify-between bg-white dark:bg-[var(--background)] p-4 rounded-lg ">
                            <div className="flex items-center space-x-3">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Sort by:</span>
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as typeof sort)}
                                    className="cursor-pointer text-sm border border-zinc-300 dark:border-zinc-600 rounded-md px-3 py-1.5 bg-white dark:bg-zinc-800"
                                >
                                    <option value="top">Top</option>
                                    <option value="new">New</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'overview' && (
                        <div className="bg-white dark:bg-[var(--background)] p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700">
                            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center space-x-2">
                                <span>About</span>
                            </h2>
                            {user.description && (
                                <p className="text-zinc-700 dark:text-zinc-300 mb-6 leading-relaxed">{user.description}</p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="flex items-center space-x-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                    <Calendar size={18} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                                    <div>
                                        <span className="text-zinc-900 dark:text-zinc-100 font-medium block">Birth Date</span>
                                        <span className="text-zinc-600 dark:text-zinc-400">{birthDate}</span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                    <UserIcon size={18} className="text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
                                    <div>
                                        <span className="text-zinc-900 dark:text-zinc-100 font-medium block">Gender</span>
                                        <span className="text-zinc-600 dark:text-zinc-400">{user.gender}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: activeTab === 'posts' ? 'block' : 'none' }}>
                        <UserPostList userSlug={slug} filter={getFilter(sort)} />
                    </div>

                    {activeTab === 'comments' && (
                        <div className="space-y-4">
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Comments</h3>
                                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Comments will be displayed here.</p>
                                </div>
                                <article className={`w-full p-6 border-t border-zinc-100 dark:border-zinc-800`}>
                                    <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 mb-3">
                                        <span className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded-full">r/example</span>
                                        <span>5 hr. ago</span>
                                    </div>
                                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">Example comment text...</p>
                                    <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer transition-colors">
                                        <MessageCircle size={14} />
                                        <span>Reply</span>
                                    </div>
                                </article>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}