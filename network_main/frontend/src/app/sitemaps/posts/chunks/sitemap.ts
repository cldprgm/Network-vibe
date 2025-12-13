import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_CONTAINER_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const SECRET = process.env.SITEMAP_SECRET_TOKEN || '';
const LIMIT = 5000; //same amount as on the backend

type SitemapResponse = {
    count: number;
    results: Array<{
        slug: string;
        updated: string;
    }>;
};

export async function generateSitemaps() {
    try {
        const res = await fetch(`${API_URL}/api/v1/sitemap/posts/?limit=1`, {
            cache: 'force-cache',
            next: { revalidate: 3600 },
            headers: {
                'X-Sitemap-Token': SECRET
            },
        });

        if (!res.ok) throw new Error('Failed to fetch count');

        const data: SitemapResponse = await res.json();
        const totalSitemaps = Math.ceil(data.count / LIMIT);

        return Array.from({ length: totalSitemaps }, (_, i) => ({ id: i }));
    } catch (error) {
        console.error('Sitemap generation error:', error);
        return [];
    }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const offset = id * LIMIT;

    try {
        const res = await fetch(
            `${API_URL}/api/v1/sitemap/posts/?limit=${LIMIT}&offset=${offset}`, {
            cache: 'force-cache',
            next: { revalidate: 3600 },
            headers: {
                'X-Sitemap-Token': SECRET
            },
        }
        );

        const data: SitemapResponse = await res.json();

        return data.results.map((post) => ({
            url: `${SITE_URL}/${post.slug}`,
            lastModified: new Date(post.updated),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));
    } catch (error) {
        return [];
    }
}