'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { verifyUserEmail } from '@/services/auth';
import { useAuthStore } from '@/zustand_store/authStore';

export default function EmailVerificationPage() {
    const params = useParams();
    const router = useRouter();
    const { login } = useAuthStore();

    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const uid = params.uid as string;
        const token = params.token as string;

        const verifyAndLogin = async () => {
            if (!uid || !token) {
                setStatus('error');
                setMessage('The confirmation link is invalid or incomplete.');
                return;
            }

            try {
                const data = await verifyUserEmail(uid, token);

                login(data.user);

                setStatus('success');
                setMessage('Success! You’ll be redirected to the homepage shortly...');

                setTimeout(() => {
                    router.push('/');
                }, 2000);

            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Couldn’t verify the email. The link may be outdated.');
            }
        };

        verifyAndLogin();
    }, [params, login, router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[var(--background)]">
            <div className="bg-white dark:bg-zinc-800 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
                {status === 'success' && (
                    <h1 className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {message}
                    </h1>
                )}
                {status === 'error' && (
                    <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {message}
                    </h1>
                )}
                {status === 'verifying' && (
                    <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 animate-pulse">
                        {message}
                    </h1>
                )}
            </div>
        </div>
    );
}