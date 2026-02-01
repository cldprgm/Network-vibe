import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_CONTAINER_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const SECRET = process.env.SITEMAP_SECRET_TOKEN || '';
const LIMIT = 5000;

type SitemapResponse = {
    count: number;
    results: Array<{
        slug: string;
        updated: string;
    }>;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/sitemap/posts/?limit=${LIMIT}`,
            {
                cache: 'force-cache',
                next: { revalidate: 3600 },
                headers: {
                    'X-Sitemap-Token': SECRET
                },
            }
        );

        if (!res.ok) {
            console.error(`Sitemap API Error: ${res.status}`);
            return [];
        }

        const data: SitemapResponse = await res.json();

        return data.results.map((post) => ({
            url: `${SITE_URL}/${post.slug}`,
            lastModified: new Date(post.updated),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

    } catch (error) {
        console.warn('⚠️ Error generating sitemap:', error);
        return [];
    }
}