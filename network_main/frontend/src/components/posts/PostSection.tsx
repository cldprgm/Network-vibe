'use client';

import React, { useState, useEffect, useRef } from 'react';
import PostListItems from './PostListItems';
import { Post } from '@/services/types';
import { fetchPosts } from '@/services/api';

interface PostsSectionProps {
    initialPosts: Post[];
    initialNextPage: number | null;
}

export default function PostsSection({ initialPosts, initialNextPage }: PostsSectionProps) {
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.scrollTo(0, 0);
        }
    }, []);

    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [nextPage, setNextPage] = useState<number | null>(initialNextPage);
    const [loading, setLoading] = useState(false);

    const observerTarget = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!observerTarget.current) return;
        const observer = new IntersectionObserver(
            async ([entry]) => {
                if (entry.isIntersecting && nextPage && !loading) {
                    setLoading(true);
                    try {
                        const data = await fetchPosts(nextPage);
                        setPosts(prev => [...prev, ...data.results]);
                        setNextPage(data.nextPage ?? null);
                    } catch (error) {
                        console.error('Failed to load more posts:', error);
                    } finally {
                        setLoading(false);
                    }
                }
            },
            { rootMargin: '1000px 0px', threshold: 0 }
        );

        observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [nextPage, loading]);

    return (
        <div className='flex'>
            <section className="mt-5 max-w-[865px] mx-auto p-5 sm:p-10 md:p-16">
                <div className="border-b mb-5 flex justify-between text-sm dark:border-[var(--border)]" />
                {posts.map(post => (
                    <PostListItems key={post.id} post={post} />
                ))}
                {loading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-200" />
                    </div>
                )}
                {nextPage && !loading && <div ref={observerTarget} className="h-2" />}
            </section>
            <div className="w-[250px] hidden xl:block"></div>

        </div>
    );
}