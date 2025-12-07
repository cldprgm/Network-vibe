"use client";

import React, { useState } from "react";
import { loginUser } from "@/services/auth";
import { useAuthStore } from "@/zustand_store/authStore";
import GoogleButton from "./auth_buttons/GoogleButtons";
import GithubButton from "./auth_buttons/GithubButton";

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

        if (email === '' || password === '') {
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
                setError("unknown error");
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md relative">
                <button onClick={onClose} className="cursor-pointer absolute top-2 right-3 text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                    ✕
                </button>
                <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-6">Log In</h1>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 font-medium text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition-colors duration-200 font-semibold disabled:opacity-70"
                    >
                        {isLoading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                {/* --- Social Login Section --- */}
                <div className="my-6 flex items-center">
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
                    <span className="mx-4 text-sm text-gray-500 dark:text-gray-400">or continue with</span>
                    <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
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
                {/* --------------------------- */}

                <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                    Don&apos;t have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-blue-600 hover:underline dark:text-blue-400 cursor-pointer"
                    >
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
}