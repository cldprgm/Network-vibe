import { NextRequest, NextResponse } from 'next/server';
import { proxyBackendRequest } from '@/services/server-proxy';

export async function GET(req: NextRequest) {
    const match = req.nextUrl.pathname.match(/\/api\/proxy\/communities\/([^/]+)/);
    const communitySlug = match ? match[1] : null;

    if (!communitySlug) {
        return NextResponse.json({ error: 'Community Slug not provided' }, { status: 400 });
    }

    const saveSlug = encodeURIComponent(communitySlug);

    return proxyBackendRequest(req, `/communities/${saveSlug}/`);
}