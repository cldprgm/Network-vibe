import { MetadataRoute } from 'next';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_CONTAINER_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const SECRET = process.env.SITEMAP_SECRET_TOKEN || '';
const LIMIT = 5000; //same amount as on the backend

export async function generateSitemaps() {
    const res = await fetch(`${API_URL}/api/v1/sitemap/communities/?limit=1`, {
        cache: 'force-cache',
        next: { revalidate: 3600 },
        headers: {
            'X-Sitemap-Token': SECRET
        },
    });
    const data = await res.json();
    const totalSitemaps = Math.ceil(data.count / LIMIT);
    return Array.from({ length: totalSitemaps }, (_, i) => ({ id: i }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const offset = id * LIMIT;
    const res = await fetch(
        `${API_URL}/api/v1/sitemap/communities/?limit=${LIMIT}&offset=${offset}`, {
        cache: 'force-cache',
        next: { revalidate: 3600 },
        headers: {
            'X-Sitemap-Token': SECRET
        },
    }
    );
    const data = await res.json();

    return data.results.map((comm: any) => ({
        url: `${SITE_URL}/communities/${comm.slug}`,
        lastModified: new Date(comm.updated),
        changeFrequency: 'daily',
        priority: 0.9,
    }));
}