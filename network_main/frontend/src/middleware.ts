import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const API_URL = `${process.env.NEXT_PUBLIC_API_BASE_CONTAINER_URL}/api/v1`;

export async function middleware(request: NextRequest) {
    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    if (!accessToken && refreshToken) {
        console.log('[Middleware] Access missing, Refresh exists. Refreshing...');

        try {

            const refreshRes = await fetch(`${API_URL}/users/refresh/`, {
                method: 'POST',
                headers: {
                    Cookie: `refresh_token=${refreshToken}`,
                },
            });

            if (refreshRes.ok) {
                const setCookieHeader = refreshRes.headers.get('set-cookie');

                if (setCookieHeader) {

                    const newAccessTokenMatch = setCookieHeader.match(/access_token=([^;]+)/);
                    const newAccessToken = newAccessTokenMatch ? newAccessTokenMatch[1] : null;

                    if (newAccessToken) {
                        console.log('[Middleware] Successfully refreshed token.');

                        const response = NextResponse.next();

                        response.cookies.set('access_token', newAccessToken, {
                            httpOnly: true,
                            secure: true, // false on localhost
                            sameSite: 'lax',
                            path: '/',
                            maxAge: 15 * 60
                        });

                        response.headers.set('Cookie', `access_token=${newAccessToken}; refresh_token=${refreshToken}`);

                        return response;
                    }
                }
            } else {
                console.error('[Middleware] Refresh failed with status:', refreshRes.status);
            }
        } catch (error) {
            console.error('[Middleware] Refresh error:', error);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.svg|.*\\..*).*)',
    ],
};
