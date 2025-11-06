import {
    Users,
    EyeOff,
    Scale,
    Code,
    AlertTriangle,
    User,
    UserCheck,
    FileText,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Network Rules",
    description:
        "An overview of the guiding principles and content standards for the Network platform.",
};

export default function RulesPage() {
    return (
        <div className="mt-15 bg-white dark:bg-[var(--background)] text-gray-900 dark:text-white font-sans">
            <div className="container mx-auto px-6 py-16">
                <header className="text-center mb-16">
                    <h1 className="text-6xl font-black tracking-tighter text-gray-900 dark:text-white">
                        Network Community Guidelines
                    </h1>
                    <p className="mt-5 text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
                        A guide to the core principles and standards that shape our
                        community.
                    </p>
                </header>

                <div className="bg-gray-50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-10 mb-16 border border-gray-200 dark:border-[var(--border)]">
                    <p className="mb-5 text-gray-700 dark:text-gray-300 text-lg">
                        Welcome to Network, a vibrant ecosystem of communities, each created,
                        managed, and enriched by its users.
                    </p>
                    <p className="mb-5 text-gray-700 dark:text-gray-300 text-lg">
                        Within these diverse spaces, you have the power to share ideas,
                        engage in discussions, offer support, and forge connections with
                        like-minded individuals. We encourage you to discover your niche or
                        even build a new home for your interests on Network.
                    </p>
                    <p className="mb-5 text-gray-700 dark:text-gray-300 text-lg">
                        While you may encounter communities or content that you find
                        disagreeable, it is crucial that no community is ever used as a tool
                        for harm. The primary purpose of our communities is to foster a
                        sense of belonging, not to diminish it for others. Every user on
                        Network is entitled to a reasonable expectation of privacy and
                        security.
                    </p>
                    <p className="mb-5 text-gray-700 dark:text-gray-300 text-lg">
                        The character of each community is defined by its members. Moderators,
                        who are also users, help guide and manage these spaces. The culture
                        is a blend of formal rules and the informal norms established through
                        community interactions. We ask that you respect the rules of the
                        communities you join and refrain from disrupting those you are not a
                        part of.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-lg">
                        The spirit of Network is a collaborative creation. Its existence
                        depends on our collective adherence to a shared set of principles.
                        We urge you to embrace not just the letter of these rules, but their
                        underlying spirit as well.
                    </p>
                </div>

                <section>
                    <h2 className="text-5xl font-extrabold mb-12 text-center text-gray-900 dark:text-white">
                        Core Principles
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <User size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    Principle 1: Acknowledge the Individual
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    Network is a platform for building connections and fostering a
                                    sense of community. It is not a venue for targeting marginalized
                                    or vulnerable individuals. All users have the right to a safe
                                    experience, free from harassment, intimidation, and threats.
                                    Any communities or users promoting violence or hatred based on
                                    identity will face a permanent ban.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Users size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    Principle 2: Respect Community Norms
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    Engage genuinely in communities that align with your passions.
                                    Refrain from spamming, manipulating content, or any other
                                    disruptive behavior that detracts from the community
                                    experience.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <EyeOff size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    Principle 3: Uphold Personal Privacy
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    Inciting harassment by disclosing someone's private or
                                    confidential information is strictly forbidden. Never disseminate
                                    or threaten to disseminate intimate or sexually explicit media of
                                    an individual without their explicit consent.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-red-600 dark:text-red-500 shrink-0">
                                <AlertTriangle size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    Principle 4: Safeguard Minors
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    Do not share or promote any content that is sexual, abusive, or
                                    inappropriately suggestive involving minors. All forms of
                                    predatory behavior toward minors are strictly prohibited.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <UserCheck size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    Principle 5: Maintain Authenticity
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    While the use of your real name is not required, do not
                                    deliberately misinform others or fraudulently impersonate any
                                    individual or organization.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <FileText size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    Principle 6: Ensure Clarity
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    Help maintain a predictable environment by accurately labeling
                                    content and communities, especially when the material is
                                    graphic, sexually explicit, or could be considered offensive.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Scale size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    Principle 7: Act Lawfully
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    Refrain from posting unlawful content and from soliciting or
                                    enabling illegal or prohibited activities.
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-[var(--background-secondary)] rounded-xl shadow-lg p-8 flex items-start hover:bg-gray-100 dark:hover:bg-gray-600/10 transition-colors duration-300 border border-gray-200 dark:border-[var(--border)]">
                            <div className="mr-6 text-gray-500 dark:text-gray-400 shrink-0">
                                <Code size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-3">
                                    Principle 8: Preserve Platform Integrity
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-base">
                                    Do not disrupt the site or engage in any activity that impedes
                                    the standard functioning of Network.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>


            </div>
        </div>
    );
}