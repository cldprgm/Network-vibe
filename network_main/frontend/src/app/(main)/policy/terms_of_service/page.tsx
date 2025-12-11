import {
    Scale,
    UserCheck,
    FileText,
    UserX,
    AlertTriangle,
    RefreshCw,
    ArrowLeft,
    Mail
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Rules and regulations regarding the use of Network.",
};

export default function TermsPage() {
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
                        Terms of Service
                    </h1>
                    <p className="mt-5 text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
                        Last Updated: {lastUpdated}
                    </p>
                </header>

                {/* Intro Block */}
                <div className="bg-gray-50 dark:bg-gray-800/20 backdrop-blur-sm rounded-xl shadow-lg p-10 mb-16 border border-gray-200 dark:border-[var(--border)]">
                    <div className="flex items-start gap-6">
                        <div className="hidden sm:block text-blue-600 dark:text-blue-500 shrink-0 mt-1">
                            <Scale size={40} />
                        </div>
                        <div>
                            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the <strong>"Network"</strong> web application (the "Service") operated by us.
                            </p>
                            <p className="mt-4 text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Terms Sections Grid */}
                <section>
                    <div className="grid grid-cols-1 gap-8">

                        {/* 1. Accounts */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <UserCheck size={36} />
                            </div>
                            <div className="w-full">
                                <h3 className="text-2xl font-bold mb-4">
                                    1. Accounts & Registration
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base mb-4">
                                    When you create an account with us, you must provide information that is accurate, complete, and current at all times.
                                </p>

                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-black/20 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h4 className="font-bold text-lg mb-2 text-gray-800 dark:text-gray-200">Your Responsibilities</h4>
                                        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                                            <li>You are responsible for safeguarding the password that you use to access the Service.</li>
                                            <li>You agree not to disclose your password to any third party.</li>
                                            <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Content */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <FileText size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    2. User Content
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base mb-3">
                                    Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material ("Content").
                                </p>
                                <ul className="list-disc pl-5 mb-4 text-gray-600 dark:text-gray-400 space-y-1">
                                    <li><strong>Ownership:</strong> You retain ownership of the content you post.</li>
                                    <li><strong>License:</strong> By posting, you grant us the right to use and display such content on the Service.</li>
                                    <li><strong>Prohibited:</strong> You may not post content that is illegal, offensive, threatening, libelous, or defamatory.</li>
                                    <li><strong>Responsibility:</strong> You are solely responsible for the content you post. We do not endorse or verify any user content and are not liable for any loss, damage, or legal claims arising from it.</li>
                                    <li><strong>Moderation:</strong> We may remove or restrict access to content at our discretion, but we do not guarantee prior review or monitoring.</li>
                                </ul>
                            </div>
                        </div>

                        {/* 3. Termination */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <UserX size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    3. Termination
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                                    All provisions of the Terms which by their nature should survive termination shall survive termination.
                                </p>
                            </div>
                        </div>

                        {/* 4. Limitation of Liability */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-red-600 dark:text-red-500 shrink-0">
                                <AlertTriangle size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    4. Limitation of Liability
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base mb-2">
                                    In no event shall Network, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation:
                                </p>
                                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-400 space-y-1">
                                    <li>Loss of profits, data, use, goodwill, or other intangible losses.</li>
                                    <li>Any conduct or content of any third party on the Service.</li>
                                    <li>Unauthorized access, use or alteration of your transmissions or content.</li>
                                </ul>
                            </div>
                        </div>

                        {/* 5. Changes */}
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <RefreshCw size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    5. Changes to Terms
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Mail size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    6. Contact Us
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    If you have any questions about these Terms, or if you wish to report concerns, complaints, or potentially problematic content, please contact us at: <br />
                                    <a href="mailto:support@network-vibe.fun" className="text-blue-600 dark:text-blue-400 hover:underline font-medium mt-1 inline-block">
                                        support@network-vibe.fun
                                    </a>
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                                    Please note that while we review and may act on complaints, we do not guarantee immediate action and are not responsible for user-generated content.
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