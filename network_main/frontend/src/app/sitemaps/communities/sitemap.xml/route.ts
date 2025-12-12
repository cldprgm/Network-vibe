import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_CONTAINER_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const SECRET = process.env.SITEMAP_SECRET_TOKEN || '';
const LIMIT = 5000; //same amount as on the backend

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/api/v1/sitemap/communities/?limit=1`, {
            cache: 'force-cache',
            next: { revalidate: 3600 },
            headers: {
                'X-Sitemap-Token': SECRET
            },
        });

        if (!res.ok) {
            throw new Error(`API Error: ${res.status}`);
        }

        const data = await res.json();
        const totalSitemaps = Math.ceil(data.count / LIMIT);

        let sitemaps = '';

        for (let id = 0; id < totalSitemaps; id++) {
            sitemaps += `
        <sitemap>
          <loc>${SITE_URL}/sitemaps/communities/chunks/sitemap/${id}.xml</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
        </sitemap>
      `;
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemaps}
    </sitemapindex>`;

        return new NextResponse(xml, {
            headers: {
                'Content-Type': 'application/xml',
            },
        });

    } catch (error) {
        console.error('Error generating posts sitemap index:', error);
        return new NextResponse('Error generating sitemap', { status: 500 });
    }
}