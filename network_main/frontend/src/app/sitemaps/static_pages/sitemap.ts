import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
    const routes = [
        {
            url: `${SITE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'always' as const,
            priority: 1.0,
        },

        {
            url: `${SITE_URL}/best/communities`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/communities`,
            lastModified: new Date(),
            changeFrequency: 'hourly' as const,
            priority: 0.8,
        },

        {
            url: `${SITE_URL}/policy/terms_of_service`,
            lastModified: new Date('2025-12-11'),
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/policy/privacy_policy`,
            lastModified: new Date('2025-12-11'),
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
        {
            url: `${SITE_URL}/policy/rules`,
            lastModified: new Date('2025-12-11'),
            changeFrequency: 'yearly' as const,
            priority: 0.3,
        },
    ];

    return routes;
}