import { NextRequest, NextResponse } from 'next/server';
import { proxyBackendRequest } from '@/services/server-proxy';

export async function GET(req: NextRequest) {
    const match = req.nextUrl.pathname.match(/\/api\/proxy\/posts\/([^/]+)/);
    const slug = match ? match[1] : null;

    if (!slug || slug === 'null') {
        return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const saveSlug = encodeURIComponent(slug);

    return proxyBackendRequest(req, `/posts/${saveSlug}/`);
}