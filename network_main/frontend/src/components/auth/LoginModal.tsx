"use client";

import React, { useState } from "react";
import { loginUser } from "@/services/auth";
import { useAuthStore } from "@/zustand_store/authStore";
import GoogleButton from "./auth_buttons/GoogleButtons";
import GithubButton from "./auth_buttons/GithubButton";
import Link from "next/link";

export default function LoginModal({
    onClose,
    onSwitchToRegister
}: {
    onClose: () => void;
    onSwitchToRegister: () => void;
}) {
    const { login, setLoading, isLoading } = useAuthStore();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Required fields must be filled in");
            return;
        }

        try {
            setLoading(true);
            const { data } = await loginUser(email, password);
            login(data.user);
            onClose();
            window.location.reload();
        } catch (err: unknown) {
            setLoading(false);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Unknown error occurred");
            }
        }
    };

    const LegalLinks = () => (
        <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
            By clicking "Log In" or using social login, you agree to our{' '}
            <Link
                href="/policy/terms_of_service"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="underline hover:text-blue-500 transition-colors">
                Terms
            </Link>
            {' '}and{' '}
            <Link
                href="/policy/privacy_policy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="underline hover:text-blue-500 transition-colors">
                Privacy Policy
            </Link>.
        </span>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md relative">
                <button onClick={onClose} className="cursor-pointer absolute top-2 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                    ✕
                </button>

                <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
                    Welcome Back
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-6 text-sm">
                    Enter your details to access your account
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center font-medium">
                            {error}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-all duration-200 font-semibold shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed mb-3"
                        >
                            {isLoading ? 'Logging in...' : 'Log In'}
                        </button>

                        <div className="text-center px-4">
                            <LegalLinks />
                        </div>
                    </div>
                </form>

                <div className="my-6 flex items-center gap-3">
                    <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">or</span>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
                </div>

                <div className="space-y-3">
                    <GoogleButton
                        onSuccess={onClose}
                        onError={setError}
                        setLoading={setLoading}
                    />
                    <GithubButton
                        onSuccess={onClose}
                        onError={setError}
                        setLoading={setLoading}
                    />
                </div>

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Don&apos;t have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="cursor-pointer font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
}