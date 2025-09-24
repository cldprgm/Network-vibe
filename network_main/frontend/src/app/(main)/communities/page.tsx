'use client';
import React, { useEffect, useState } from 'react';
import { CategoryToolbar } from '@/components/communities/CategoryToolbar';
import { CategorySection } from '@/components/communities/CategorySection';
import { Category, CommunityType } from '@/services/types';
import { RecommendedSection } from '@/components/communities/RecommendedSection';
import { api } from '@/services/auth';

export default function ExplorePage() {
    const [recommendedCommunities, setRecommendedCommunities] = useState<CommunityType[]>([]);
    const [recommendedNextPage, setRecommendedNextPage] = useState<string | null>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [selected, setSelected] = useState<string>('all');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const recommendedRes = await api.get('/recommendations/communities/');
                const recs = Array.isArray(recommendedRes.data?.recommendations)
                    ? recommendedRes.data.recommendations
                    : [];
                setRecommendedCommunities(recs);
                setRecommendedNextPage(recommendedRes.data?.next ?? null);

                const res = await api.get('/categories-tree/');

                const results: any[] = Array.isArray(res.data)
                    ? res.data
                    : Array.isArray(res.data?.results)
                        ? res.data.results
                        : [];

                const categoriesWithPagination: Category[] = results.map((category: any) => ({
                    ...category,
                    subcategories: Array.isArray(category.subcategories)
                        ? category.subcategories.map((sub: any) => {
                            const nextFromApi = sub?.next ?? null;
                            const communitiesCount = Array.isArray(sub?.communities) ? sub.communities.length : 0;
                            return {
                                ...sub,
                                nextPage: nextFromApi ?? (communitiesCount >= 6
                                    ? `/categories-tree/subcategories/${sub.id}/communities/?page=2`
                                    : null)
                            };
                        })
                        : []
                }));

                setCategories([
                    { id: 'all', slug: 'all', title: 'All', subcategories: [] },
                    ...categoriesWithPagination
                ]);
            } catch (err: any) {
                console.error('load error:', err);
                const serverMsg = err?.response?.data ? JSON.stringify(err.response.data) : undefined;
                setError(err?.message ? `${err.message}${serverMsg ? ` — ${serverMsg}` : ''}` : 'loading error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!loading && categories.length > 0) {
            if (!categories.find(c => c.slug === selected)) {
                setSelected(categories[0].slug);
            }
        }
    }, [categories, loading, selected]);

    if (loading) {
        return <div className="text-gray-400">Loading...</div>;
    }
    if (error) {
        return <div className="text-red-500">Loading error: {error}</div>;
    }

    const current = categories.find(c => c.slug === selected);

    console.log('ExplorePage render', {
        loading,
        error,
        selected,
        categoriesLength: categories.length,
        recommendedCommunitiesLength: recommendedCommunities.length,
        current: !!current
    });

    return (
        <div className="mt-5 max-w-[1300px] p-5 sm:p-10 md:p-16 mx-auto">
            <h1 className="text-white text-2xl font-bold mb-4">Explore Communities</h1>

            <CategoryToolbar
                categories={categories.map(c => ({ slug: c.slug, title: c.title }))}
                selected={selected}
                onSelect={setSelected}
            />

            <hr className="border-gray-700 mb-6" />

            {selected === 'all' ? (
                <RecommendedSection
                    communities={recommendedCommunities}
                    nextPage={recommendedNextPage}
                    setCommunities={setRecommendedCommunities}
                    setNextPage={setRecommendedNextPage}
                />
            ) : current ? (
                current.subcategories.map(sub => (
                    <CategorySection key={sub.id} subcategory={sub} />
                ))
            ) : (
                <div className="text-gray-400">Category not found</div>
            )}
        </div>
    );
}
