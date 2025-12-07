'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function GithubCallback() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    useEffect(() => {
        if (error) {
            if (window.opener) {
                window.opener.postMessage({
                    type: 'GITHUB_AUTH_ERROR',
                    error: "Login cancelled"
                }, window.location.origin);
            }
            window.close();
            return;
        }

        if (!code || !state) return;

        const storedState = sessionStorage.getItem('github_oauth_state');

        if (!storedState || state !== storedState) {
            window.opener.postMessage({
                type: 'GITHUB_AUTH_ERROR',
                error: "Security Error: State mismatch"
            }, window.location.origin);

            window.close();
            return;
        }

        sessionStorage.removeItem('github_oauth_state');

        window.opener.postMessage({
            type: 'GITHUB_AUTH_SUCCESS',
            code
        }, window.location.origin);

        window.close();

    }, [code, state, error]);

    return (
        <div className="flex items-center justify-center h-screen">
            <p>Authenticating with GitHub...</p>
        </div>
    );
}