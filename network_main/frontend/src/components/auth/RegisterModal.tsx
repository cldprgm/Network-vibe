'use client';

import { useState } from 'react';
import { registerUser, loginUser, verifyCode, resendCode } from '@/services/auth';
import { useAuthStore } from '@/zustand_store/authStore';

export default function RegisterModal({
    onClose,
    onSwitchToLogin
}: {
    onClose: () => void;
    onSwitchToLogin: () => void;
}) {
    const { login, setLoading, isLoading } = useAuthStore();
    const [step, setStep] = useState<'form' | 'verify'>('form');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [lastResendTime, setLastResendTime] = useState<number>(0);
    const [canResend, setCanResend] = useState(true);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePassword = (password: string) => {
        return password.length >= 8;
    };

    const handleResend = async () => {
        if (!canResend) return;

        const now = Date.now();
        if (now - lastResendTime < 60000) {
            setError('Please wait 1 minute before resending');
            return;
        }

        try {
            setLoading(true);
            await resendCode(email);
            setLastResendTime(now);
            setCanResend(false);
            setSuccessMessage('Verification code resent successfully');
            setError('');

            setTimeout(() => {
                setCanResend(true);
            }, 60000);
        } catch (err: any) {
            setError(err.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (email === '' || username === '' || password === '' || password2 === '') {
            setError('All fields are required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (username.length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }

        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (password !== password2) {
            setError('Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            await registerUser(email, username, password);
            setStep('verify');
            setSuccessMessage(`Verification code sent to ${email}`);
            setLastResendTime(Date.now());
            setCanResend(false);
            setTimeout(() => setCanResend(true), 60000);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (code === '') {
            setError('Please enter the verification code');
            return;
        }

        try {
            setLoading(true);
            await verifyCode(email, code);
            const { data } = await loginUser(email, password);
            login(data.user);
            onClose();
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'Invalid or expired code');
        } finally {
            setLoading(false);
        }
    };

    if (step === 'form') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md relative">
                    <button onClick={onClose} className="cursor-pointer absolute top-2 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                        ✕
                    </button>
                    <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
                        Create an Account
                    </h1>
                    <form onSubmit={handleRegisterSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="username"
                                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Username
                            </label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Your username"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password2"
                                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="password2"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                required
                                className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition-colors duration-200 font-semibold disabled:bg-blue-400"
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                    <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <button
                            type='button'
                            onClick={onSwitchToLogin}
                            className="cursor-pointer text-blue-600 hover:underline dark:text-blue-400"
                        >
                            Log in
                        </button>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md relative">
                <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">
                    Verify Email
                </h1>
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {successMessage || `Check your email for a verification code sent to ${email}`}
                </p>
                <form onSubmit={handleVerifySubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="code"
                            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Verification Code
                        </label>
                        <input
                            type="text"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition-colors duration-200 font-semibold disabled:bg-blue-400"
                    >
                        {isLoading ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={!canResend || isLoading}
                        className="text-blue-600 hover:underline dark:text-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {canResend ? 'Resend Code' : 'Resend in 1 minute...'}
                    </button>
                </div>

            </div>
        </div>
    );
}