'use client';

import { useState } from 'react';
import { registerUser } from '@/services/auth';
import { useAuthStore } from '@/zustand_store/authStore';
import Link from 'next/link';

export default function RegisterModal({
    onClose,
    onSwitchToLogin
}: {
    onClose: () => void;
    onSwitchToLogin: () => void;
}) {
    const { setLoading, isLoading } = useAuthStore();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');

    const [agreed, setAgreed] = useState(false);

    const [error, setError] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validatePassword = (password: string) => {
        return password.length >= 8;
    };

    const handleRegisterSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!agreed) {
            setError('You must agree to the Terms of Service and Privacy Policy');
            return;
        }

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
            setRegistrationSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    if (registrationSuccess) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
                    <h1 className="text-3xl font-bold text-green-600 mb-4">Almost done!</h1>
                    <p className="text-gray-700 dark:text-gray-300 mb-6">
                        We’ve sent a confirmation link to <strong>{email}</strong>.
                    </p>
                    <button onClick={onClose} className="cursor-pointer w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md relative">
                <button onClick={onClose} className="cursor-pointer absolute top-2 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                    ✕
                </button>

                <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Create Account
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
                    Join our community today
                </p>

                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="username"
                            className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                            placeholder="Your username"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                            placeholder="Min. 8 characters"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password2"
                            className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="password2"
                            value={password2}
                            onChange={(e) => setPassword2(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
                            placeholder="Repeat password"
                        />
                    </div>

                    <div className="flex items-start gap-3 mt-2">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                required
                                className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600 dark:ring-offset-gray-800 cursor-pointer"
                            />
                        </div>
                        <label htmlFor="terms" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                            I agree to the{' '}
                            <Link
                                href="/policy/terms_of_service"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline dark:text-blue-500">
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link

                                href="/policy/privacy_policy"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline dark:text-blue-500">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !agreed}
                        className={`cursor-pointer w-full py-2.5 rounded-xl transition-all duration-200 font-semibold text-white shadow-md
                            ${isLoading || !agreed
                                ? 'bg-gray-400 cursor-not-allowed opacity-70'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                            }`}
                    >
                        {isLoading ? 'Registering...' : 'Create Account'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Already have an account?{' '}
                    <button
                        type='button'
                        onClick={onSwitchToLogin}
                        className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        Log in
                    </button>
                </p>
            </div>
        </div>
    );
}