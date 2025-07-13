'use client';
import React, { useEffect, useState } from 'react';
import { CategoryToolbar } from '@/components/communities/CategoryToolbar';
import { CategorySection } from '@/components/communities/CategorySection';
import { Category } from '@/services/types';
import { api } from '@/services/auth';

export default function ExplorePage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selected, setSelected] = useState<string>('all');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/categories-tree/');
                const categoriesWithPagination: Category[] = res.data.results.map((category: Category) => ({
                    ...category,
                    subcategories: category.subcategories.map(sub => ({
                        ...sub,
                        nextPage: (sub as any).next
                            ?? (sub.communities.length >= 6
                                ? `/categories-tree/subcategories/${sub.id}/communities/?page=2`
                                : null)
                    }))
                }));
                setCategories(categoriesWithPagination);
            } catch (err: any) {
                setError(err.message || 'loading error');
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

    return (
        <div className="mt-5 max-w-[1300px] p-5 sm:p-10 md:p-16 mx-auto">
            <h1 className="text-white text-2xl font-bold mb-4">Explore Communities</h1>

            <CategoryToolbar
                categories={categories.map(c => ({ slug: c.slug, title: c.title }))}
                selected={selected}
                onSelect={setSelected}
            />

            <hr className="border-gray-700 mb-6" />

            {current ? (
                current.subcategories.map(sub => (
                    <CategorySection key={sub.id} subcategory={sub} />
                ))
            ) : (
                <div className="text-gray-400">Category not found</div>
            )}
        </div>
    );
}
