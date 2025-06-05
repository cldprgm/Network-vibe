import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import { useAuthStore } from '@/zustand_store/authStore';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export interface RefreshResult {
    newAccessCookie: string | null;
    logoutCookies: string[] | null;
}

async function refreshAccessToken(cookies: string): Promise<RefreshResult> {
    try {
        const api = axios.create({
            baseURL: baseUrl,
            headers: { Cookie: cookies },
            withCredentials: true,
        });
        const res = await api.post('/users/refresh/');
        const setCook = res.headers['set-cookie'] as string[] | undefined;
        if (setCook) {
            const newAccess = setCook.find((c) => c.includes('access_token'));
            return { newAccessCookie: newAccess || null, logoutCookies: null };
        }
        return { newAccessCookie: null, logoutCookies: null };
    } catch (err: any) {
        console.error('SSR token refresh failed:', err.response?.data || err.message);
        try {
            const logoutApi = axios.create({
                baseURL: baseUrl,
                headers: { Cookie: cookies },
                withCredentials: true,
            });
            const logoutRes = await logoutApi.post('/users/logout/');
            const logoutSetCook = logoutRes.headers['set-cookie'] as string[] | undefined;
            useAuthStore.getState().logout();
            console.log('SUCCESS LOGOUT');
            return { newAccessCookie: null, logoutCookies: logoutSetCook || [] };
        } catch (e: any) {
            console.error(
                'Error forcing logout after failed refresh:',
                e.response?.data || e.message
            );
            return { newAccessCookie: null, logoutCookies: [] };
        }
    }
}

export async function GET(req: NextRequest) {
    const cookieHeader = req.headers.get('cookie') || '';

    try {
        const authApi = axios.create({
            baseURL: baseUrl,
            headers: { Cookie: cookieHeader },
            withCredentials: true,
        });
        const authRes = await authApi.get('/posts/');
        return NextResponse.json(authRes.data);
    } catch (err: any) {
        if (err.response?.status === 401) {
            console.log('Auth GET /posts/ 401, refreshing...');
            const { newAccessCookie, logoutCookies } = await refreshAccessToken(cookieHeader);

            if (newAccessCookie) {
                console.log('Got new access_token, repeat request on /posts/');
                const retryApi = axios.create({
                    baseURL: baseUrl,
                    headers: { Cookie: cookieHeader + '; ' + newAccessCookie },
                    withCredentials: true,
                });
                try {
                    const retryRes = await retryApi.get('/posts/');
                    const response = NextResponse.json(retryRes.data);
                    response.headers.append('Set-Cookie', newAccessCookie);
                    return response;
                } catch (retryErr: any) {
                    console.error(
                        'Error repeated request after refresh:',
                        retryErr.response?.status,
                        retryErr.message
                    );
                    return NextResponse.json(
                        { error: 'Failed to upload posts after refresh' },
                        { status: 500 }
                    );
                }
            }

            if (logoutCookies && logoutCookies.length > 0) {
                console.log('Refresh didnt work, making anonymous request');

                try {
                    const publicApi = axios.create({
                        baseURL: baseUrl,
                        withCredentials: false,
                    });
                    const publicRes = await publicApi.get('/posts/');
                    const response = NextResponse.json(publicRes.data);
                    logoutCookies.forEach((c) => response.headers.append('Set-Cookie', c));
                    return response;
                } catch (anonErr: any) {
                    console.error(
                        'Error with anonymous request /posts/ after logout:',
                        anonErr.response?.status,
                        anonErr.message
                    );
                    return NextResponse.json(
                        { error: 'Failed to upload public data of the posts.' },
                        { status: 500 }
                    );
                }
            }
        }

        console.error('getPosts fallback error:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
        });
        return NextResponse.json({ error: 'Failed to upload posts.' }, { status: 500 });
    }
}
