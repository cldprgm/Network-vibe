import { NextRequest } from 'next/server';
import { proxyBackendRequest } from '@/services/server-proxy';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const cursor = searchParams.get('cursor');
    const params: Record<string, string> = {};
    if (cursor) params.cursor = cursor;

    return proxyBackendRequest(req, '/recommendations/posts/', params);
}