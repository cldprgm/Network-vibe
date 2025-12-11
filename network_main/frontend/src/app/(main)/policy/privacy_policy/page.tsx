import {
    Shield,
    Database,
    Cpu,
    Cookie,
    Share2,
    Lock,
    AlertTriangle,
    RefreshCw,
    ArrowLeft,
    Mail
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How Network collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
    const lastUpdated = new Date("2025-12-11").toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="mt-15 bg-white dark:bg-[var(--background)] text-gray-900 dark:text-white font-sans min-h-screen">
            <div className="container mx-auto px-6 py-16">

                {/* Header */}
                <header className="text-center mb-16">
                    <h1 className="text-6xl font-black tracking-tighter text-gray-900 dark:text-white">
                        Privacy Policy
                    </h1>
                    <p className="mt-5 text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
                        Last Updated: {lastUpdated}
                    </p>
                </header>

                {/* Intro Block */}
                <div className="bg-gray-50 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl shadow-lg p-10 mb-16 border border-gray-200 dark:border-[var(--border)]">
                    <div className="flex items-start gap-6">
                        <div className="hidden sm:block text-blue-600 dark:text-blue-500 shrink-0 mt-1">
                            <Shield size={40} />
                        </div>
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                This Privacy Policy describes how <strong>"Network"</strong> (the "Service", "we", "us") collects, uses, stores, and protects your information when you use our web application. By using the Service, you agree to the terms of this Policy.
                            </p>
                            <p className="mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                We value your privacy and are committed to protecting your personal data. We only collect the information necessary to provide you with our services and ensure the security of your account.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Policy Sections Grid */}
                <section>
                    <div className="grid grid-cols-1 gap-8">

                        {/* 1. Information We Collect */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Database size={36} />
                            </div>
                            <div className="w-full">
                                <h3 className="text-2xl font-bold mb-4">
                                    1. Information We Collect
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base mb-4">
                                    We collect data in two ways: when you register directly via email, and when you authenticate via third-party providers.
                                </p>

                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-black/20 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">1.1. Direct Registration</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                            <li><strong>Email address:</strong> Required for unique identification.</li>
                                            <li><strong>Password:</strong> Securely salted and hashed (never stored in plain text).</li>
                                        </ul>
                                    </div>

                                    <div className="bg-white dark:bg-black/20 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">1.2. From Google (OAuth)</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                            <li><strong>google_id</strong> & <strong>social_id</strong></li>
                                            <li><strong>email</strong> & <strong>username</strong></li>
                                            <li><strong>first_name</strong> & <strong>last_name</strong></li>
                                            <li><strong>avatar</strong> (Profile picture URL)</li>
                                        </ul>
                                    </div>

                                    <div className="bg-white dark:bg-black/20 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">1.3. From GitHub (OAuth)</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                            <li><strong>github_id</strong> & <strong>social_id</strong></li>
                                            <li><strong>email</strong> (Primary verified address)</li>
                                            <li><strong>username</strong> (GitHub login)</li>
                                            <li><strong>avatar</strong> (GitHub avatar URL)</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. How We Use This Data */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Cpu size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    2. How We Use This Data
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base mb-3">
                                    All collected data is used exclusively for:
                                </p>
                                <ul className="list-disc pl-5 mb-4 text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>Creating and managing your account on Network.</li>
                                    <li>Authenticating your identity and providing access.</li>
                                    <li>Ensuring the correct operation and security of the Service.</li>
                                </ul>
                                <p className="font-medium text-blue-600 dark:text-blue-400">
                                    We do not use your data for advertising, profiling, or marketing analytics.
                                </p>
                            </div>
                        </div>

                        {/* 3. Cookies */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Cookie size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    3. Cookies
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base mb-2">
                                    We use cookies strictly for technical purposes:
                                </p>
                                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>Storing your active user session (authentication tokens).</li>
                                    <li>Ensuring the security of the authentication process (CSRF protection).</li>
                                </ul>
                                <p className="mt-3 text-gray-500 dark:text-gray-500 text-sm">
                                    We do not use cookies for third-party tracking or advertising.
                                </p>
                            </div>
                        </div>

                        {/* 4. Data Sharing */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Share2 size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    4. Data Sharing
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    We do not sell, trade, or transfer your personal data to third parties.
                                    The only exception involves trusted infrastructure providers (hosting and database services)
                                    required to keep the Service running. These providers are contractually obligated
                                    to keep your information confidential.
                                </p>
                            </div>
                        </div>

                        {/* 5. Retention & Security */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Lock size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    5. Data Retention and Security
                                </h3>
                                <ul className="space-y-3 text-gray-600 dark:text-gray-400 text-base">
                                    <li>
                                        <strong className="text-gray-900 dark:text-gray-200">Retention:</strong> Your data is stored for as long as your account exists on Network.
                                    </li>
                                    <li>
                                        <strong className="text-gray-900 dark:text-gray-200">Security:</strong> We employ reasonable technical measures including HTTPS encryption and cryptographic password hashing. However, no internet transmission is 100% secure.
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* 6. Limitation of Liability */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-red-600 dark:text-red-500 shrink-0">
                                <AlertTriangle size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    6. Limitation of Liability
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base mb-2">
                                    The "Network" Service is provided on an "AS IS" basis. We are not liable for:
                                </p>
                                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>Failures of hosting providers or infrastructure.</li>
                                    <li>Security breaches caused by circumstances beyond our control.</li>
                                    <li>Malfunctions of third-party authentication services.</li>
                                </ul>
                            </div>
                        </div>

                        {/* 7. Changes */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <RefreshCw size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    7. Changes to This Policy
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    We may update this Privacy Policy from time to time. Changes become effective immediately upon posting. Your continued use of the Service constitutes acceptance of the new Policy.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Mail size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    8. Contact Us
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    If you have any questions or wish to request account deletion, please contact us at: <br />
                                    <a href="mailto:support@network-vibe.fun" className="text-blue-600 dark:text-blue-400 hover:underline font-medium mt-1 inline-block">
                                        support@network-vibe.fun
                                    </a>
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                <div className="mt-16 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft size={24} />
                        Back to Home
                    </Link>
                </div>

            </div>
        </div>
    );
}