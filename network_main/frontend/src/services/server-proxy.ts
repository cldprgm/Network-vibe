import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';

const baseUrl = `${process.env.NEXT_PUBLIC_API_BASE_CONTAINER_URL}/api/v1`;

interface RefreshResult {
    newAccessCookie: string | null;
    logoutCookies: string[] | null;
}

function updateCookieHeader(allCookies: string, newAccessCookieString: string): string {
    const newTokenPart = newAccessCookieString.split(';')[0].trim();
    const parts = allCookies.split(';')
        .map(p => p.trim())
        .filter(p => !p.startsWith('access_token=') && p !== '');

    parts.push(newTokenPart);
    return parts.join('; ');
}

async function refreshAccessToken(cookies: string): Promise<RefreshResult> {
    try {
        const api = axios.create({
            baseURL: baseUrl,
            headers: { Cookie: cookies },
            withCredentials: true,
        });
        const res = await api.post('/users/refresh/');
        const setCookie = res.headers['set-cookie'] as string[] | undefined;

        const newAccess = setCookie?.find((c) => c.includes('access_token'));
        return { newAccessCookie: newAccess || null, logoutCookies: null };
    } catch (err: unknown) {
        try {
            const logoutApi = axios.create({
                baseURL: baseUrl,
                headers: { Cookie: cookies },
                withCredentials: true,
            });
            const logoutRes = await logoutApi.post('/users/logout/');
            const logoutSetCookie = logoutRes.headers['set-cookie'] as string[] | undefined;
            return { newAccessCookie: null, logoutCookies: logoutSetCookie || [] };
        } catch (e) {
            if (axios.isAxiosError(e)) {
                console.error(
                    'Error forcing logout after failed refresh:',
                    e.response?.data || e.message
                );
            } else {
                console.error('Unknown error during logout fallback:', e);
            }
            return { newAccessCookie: null, logoutCookies: [] };
        }
    }
}


export async function proxyBackendRequest(
    req: NextRequest,
    backendPath: string,
    params: Record<string, string> = {}
) {
    const cookieHeader = req.headers.get('cookie') || '';

    try {
        // main request attempt
        const authApi = axios.create({
            baseURL: baseUrl,
            headers: { Cookie: cookieHeader },
            withCredentials: true,
        });
        const authRes = await authApi.get(backendPath, { params });

        const response = NextResponse.json(authRes.data);

        const newAccessTokenToSet = authRes.headers['set-cookie'];
        if (newAccessTokenToSet) {
            newAccessTokenToSet.forEach(c => response.headers.append('Set-Cookie', c));
        }

        return response;

    } catch (err: unknown) {
        // 401 (Token Expired)
        if (axios.isAxiosError(err) && err.response?.status === 401) {
            console.log(`[Proxy] 401 on ${backendPath}, refreshing...`);

            const { newAccessCookie, logoutCookies } = await refreshAccessToken(cookieHeader);

            // The refresh is successful -> Repeat the request
            if (newAccessCookie) {
                const retryCookieHeader = updateCookieHeader(cookieHeader, newAccessCookie);

                const retryApi = axios.create({
                    baseURL: baseUrl,
                    headers: { Cookie: retryCookieHeader },
                    withCredentials: true,
                });

                try {
                    const retryRes = await retryApi.get(backendPath, { params });
                    const response = NextResponse.json(retryRes.data);
                    response.headers.append('Set-Cookie', newAccessCookie);
                    return response;
                } catch (retryErr) {
                    console.error(`[Proxy] Retry failed for ${backendPath}`);
                }
            }

            // Refresh failed -> Anonymous Request
            if (logoutCookies) {
                try {
                    const publicApi = axios.create({
                        baseURL: baseUrl,
                        withCredentials: false,
                    });
                    const publicRes = await publicApi.get(backendPath, { params });
                    const finalResponse = NextResponse.json(publicRes.data);

                    // delete session
                    logoutCookies.forEach((c) => finalResponse.headers.append('Set-Cookie', c));
                    return finalResponse;
                } catch (anonErr: unknown) {
                    if (axios.isAxiosError(anonErr) && anonErr.response?.status === 404) {
                        return NextResponse.json({ detail: 'Not found' }, { status: 404 });
                    }
                    console.error('[Proxy] Anonymous request failed');
                    return NextResponse.json(
                        { error: 'Failed to fetch public data.' },
                        { status: 500 }
                    );
                }
            }
        }

        // other
        if (axios.isAxiosError(err)) {
            if (err.response?.status === 404) {
                return NextResponse.json({ detail: 'Not found' }, { status: 404 });
            }
            console.error('[Proxy] Error:', err.message);
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}