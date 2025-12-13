export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <sitemap>
        <loc>${baseUrl}/sitemaps/static_pages/sitemap.xml</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
      </sitemap>
    <sitemap>
      <loc>${baseUrl}/sitemaps/posts/sitemap.xml</loc>
    </sitemap>
    <sitemap>
      <loc>${baseUrl}/sitemaps/communities/sitemap.xml</loc>
    </sitemap>
  </sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}