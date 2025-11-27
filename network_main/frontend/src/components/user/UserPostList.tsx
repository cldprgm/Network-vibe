'use client';

import React, { useState, useEffect, useRef } from 'react';
import UserPostListItems from './UserPostListItems';
import { Post } from '@/services/types';
import { fetchPostsForUserProfile } from '@/services/api';
import { FileText } from 'lucide-react';

interface PostsSectionProps {
    userSlug: string;
    filter?: 'new' | 'popular';
}

export default function UserPostList({ userSlug, filter = 'new' }: PostsSectionProps) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
    }, []);

    const [posts, setPosts] = useState<Post[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const observerTarget = useRef<HTMLDivElement>(null);

    const loadPosts = async (cursor?: string) => {
        setLoading(true);
        try {
            const data = await fetchPostsForUserProfile(userSlug, filter, cursor);
            setPosts(prev => cursor ? [...prev, ...data.results] : data.results);
            setNextCursor(data.nextCursor);
        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPosts([]);
        loadPosts();
    }, [userSlug, filter]);

    useEffect(() => {
        if (!observerTarget.current) return;
        const observer = new IntersectionObserver(
            async ([entry]) => {
                if (entry.isIntersecting && nextCursor && !loading) {
                    loadPosts(nextCursor);
                }
            },
            { rootMargin: '1000px 0px', threshold: 0 }
        );

        observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [nextCursor, loading]);

    return (
        <section className="mt-5 mx-auto sm:p-2 md:p-1">
            <div className="border-b mb-5 flex justify-between text-sm dark:border-[var(--border)]" />

            {!loading && posts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
                    <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">
                        No posts yet
                    </p>
                </div>
            )}

            {posts.map(post => (
                <UserPostListItems key={post.id} post={post} />
            ))}

            {loading && (
                <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-200" />
                </div>
            )}

            {nextCursor && !loading && <div ref={observerTarget} className="h-2" />}
        </section>
    );
}