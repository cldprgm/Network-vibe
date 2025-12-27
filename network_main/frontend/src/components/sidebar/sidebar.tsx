'use client';

import React, { useState, useEffect } from "react"
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx"
import CreateCommunityModal from "./CreateCommunityModal";
import { useRouter, usePathname } from "next/navigation";
import { CommunityType } from "@/services/types";
import {
    Home,
    Flame,
    Compass,
    List,
    PlusCircle,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ChevronDown,
    Star,
    BookText,
    Code,
    Scale,
    Shield,
    X,
    Snowflake
} from "lucide-react";
import "@/styles/SidebarCustomScrollbar.css"
import { fetchCommunitiesForUserProfile } from "@/services/api";
import { useAuthStore } from "@/zustand_store/authStore";
import { useSidebarStore } from "@/zustand_store/sidebarStore";
import { useSnowStore } from "@/zustand_store/snowStore"

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { user } = useAuthStore();

    const { isMobileOpen, closeMobile } = useSidebarStore();

    const { isSnowing, toggleSnow } = useSnowStore();

    const [mounted, setMounted] = useState(false);

    const [subscribedCommunities, setSubscribedCommunities] = useState<CommunityType[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [isCommunityOpen, setIsCommunityOpen] = useState(true);
    const [isMoreOnNetworkOpen, setIsMoreOnNetworkOpen] = useState(true);
    const [isResourcesOpen, setIsResourcesOpen] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        closeMobile();
    }, [pathname, closeMobile]);

    useEffect(() => {
        const handleResize = () => {
            setCollapsed(window.innerWidth < 850);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!user?.slug) return;

        const loadCommunities = async () => {
            setLoading(true);
            try {
                const { results, nextCursor: cursor } = await fetchCommunitiesForUserProfile(user.slug);
                setSubscribedCommunities(results);
                setNextCursor(cursor);
            } catch (error) {
                console.error('Failed to load subscribed communities:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCommunities();
    }, [user?.slug]);

    const loadMoreCommunities = async () => {
        if (!nextCursor || loading || !user?.slug) return;

        setLoading(true);
        try {
            const { results, nextCursor: cursor } = await fetchCommunitiesForUserProfile(user.slug, nextCursor);
            setSubscribedCommunities(prev => [...prev, ...results]);
            setNextCursor(cursor);
        } catch (error) {
            console.error('Failed to load more communities:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => {
        setCollapsed((prev) => !prev);
    };

    const handleCommunityCreate = (community: CommunityType) => {
        setIsModalOpen(false);

        if (community?.slug) {
            router.push(`/communities/${community.slug}`);
        }
    };

    const hoverBg = "hover:bg-gray-100 dark:hover:bg-[var(--button-sidebar-background-hover)]";
    const icon = "text-gray-500 transition-colors duration-100 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"

    return (
        <>
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeMobile}
                />
            )}

            <aside
                id="logo-sidebar"
                className={clsx(
                    "fixed top-0 left-0 h-full transition-all duration-300 border-r z-50",
                    "bg-white border-gray-200 dark:bg-[var(--background)] dark:border-[var(--border)]",
                    "w-64",

                    (mounted && isMobileOpen) ? "translate-x-0 pt-13" : "-translate-x-full pt-20",

                    "md:translate-x-0 md:sticky md:top-0 md:h-screen md:z-40",

                    collapsed ? "md:w-10" : "md:w-64"
                )}
                aria-label="Sidebar"
            >
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="cursor-pointer hidden md:flex absolute -right-4.5 z-50 w-9 h-9 items-center justify-center bg-gray-200 dark:bg-[var(--background)] border border-gray-300 dark:border-[var(--border)] rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    title={collapsed ? "Expand navigation" : "Collapse navigation"}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                </button>

                <div className="md:hidden absolute top-4 right-4 z-50">
                    <button onClick={closeMobile} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className={clsx(
                    "h-full px-4 pr-1 pb-4 overflow-y-auto bg-white dark:bg-[var(--background)]",
                    "sidebar-custom-scrollbar",
                    (isMobileOpen || !collapsed) ? "block" : "hidden"
                )}>
                    <ul className="space-y-1">
                        <li>
                            <Link href="/" className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}>
                                <Home className={clsx("ms-2 w-5 h-5 ", icon)} />
                                <span className="ms-3">Home</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="#" prefetch={false} className={clsx("cursor-not-allowed flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-500 group", hoverBg)}>
                                <Flame className={clsx("ms-2 w-5 h-5 ", icon)} />
                                <span className="ms-3">Popular(Not working)</span>
                            </Link>
                        </li>
                        <li>
                            <Link href={'/communities/'} className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}>
                                <Compass className={clsx("ms-2 w-5 h-5 ", icon)} />
                                <span className="ms-3">Explore communities</span>
                            </Link>
                        </li>
                        <li>
                            <Link href="#" prefetch={false} className={clsx("cursor-not-allowed flex items-center p-2 text-gray-900 rounded-lg dark:text-gray-500 group", hoverBg)}>
                                <List className={clsx("ms-2 w-5 h-5 ", icon)} />
                                <span className="ms-3">All(Not working)</span>
                            </Link>
                        </li>
                        <hr className="border-[var(--border)] mt-4 mb-4"></hr>

                        <li>
                            <button
                                onClick={toggleSnow}
                                className={clsx("w-full flex items-center p-2 text-gray-900 rounded-lg dark:text-white group cursor-pointer", hoverBg)}
                            >
                                <Snowflake className={clsx(
                                    "ms-2 w-5 h-5 transition-colors",
                                    icon,
                                    isSnowing && "text-blue-400 dark:text-blue-300 fill-blue-100"
                                )} />
                                <span className="ms-3">Let it snow</span>
                            </button>
                        </li>
                        <hr className="border-[var(--border)] mt-4 mb-4"></hr>

                        <li>
                            <button onClick={() => setIsCommunityOpen(!isCommunityOpen)} className={clsx(
                                "w-full flex justify-between items-center p-2 rounded-lg",
                                "uppercase text-[rgba(194,194,194,0.75)] dark:text-[rgba(194,194,194,0.75)]",
                                "hover:text-gray-900 dark:hover:text-white transition-colors",
                                hoverBg
                            )}>
                                <span className="ms-2">Communities</span>
                                <ChevronDown className={clsx("w-4 h-4 transition-transform", !isCommunityOpen && "transform -rotate-90")} />
                            </button>
                        </li>
                        {isCommunityOpen && (
                            <>
                                <li>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className={clsx("cursor-pointer w-full flex items-center gap-[6px] px-3 p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}
                                    >
                                        <PlusCircle className={clsx("ms-1 w-5 h-5 ", icon)} />
                                        <span className="ml-1">Create community</span>
                                    </button>
                                </li>
                                {subscribedCommunities.length > 0 ? (
                                    <>
                                        <ul className="space-y-1">
                                            {subscribedCommunities.map((community) => (
                                                <li key={community.id || community.slug}>
                                                    <Link href={`/communities/${community.slug}`} className={clsx("flex max-h-10 items-center p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}>
                                                        <div className="relative ms-2 shrink-0 w-7 h-7 rounded-full overflow-hidden">
                                                            <Image src={community.icon} alt={community.name || "Community icon"} fill className="object-cover" sizes="28" priority={false} />
                                                        </div>
                                                        <span className="ms-3 truncate">{community.name}</span>
                                                    </Link>
                                                </li>
                                            ))}
                                            {nextCursor && (
                                                <li>
                                                    <button onClick={loadMoreCommunities} disabled={loading} className={clsx("cursor-pointer w-full flex items-center justify-center p-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg group", hoverBg, loading && "opacity-50 cursor-not-allowed")}>
                                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <span>Load more</span>}
                                                    </button>
                                                </li>
                                            )}
                                        </ul>
                                    </>
                                ) : !loading && (
                                    <li className="list-none">
                                        <div className="text-center px-2 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            No communities yet. Create one to get started!
                                        </div>
                                    </li>
                                )}
                            </>
                        )}
                        <hr className="border-[var(--border)] mt-4 mb-4"></hr>

                        <li>
                            <button onClick={() => setIsMoreOnNetworkOpen(!isMoreOnNetworkOpen)} className={clsx(
                                "w-full flex justify-between items-center p-2 rounded-lg",
                                "uppercase text-[rgba(194,194,194,0.75)] dark:text-[rgba(194,194,194,0.75)]",
                                "hover:text-gray-900 dark:hover:text-white transition-colors",
                                hoverBg
                            )}>
                                <span className="ms-2">More On Network</span>
                                <ChevronDown className={clsx("w-4 h-4 transition-transform", !isMoreOnNetworkOpen && "transform -rotate-90")} />
                            </button>
                        </li>
                        {isMoreOnNetworkOpen && (
                            <li>
                                <Link href="/best/communities/" prefetch={false} className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}>
                                    <Star className={clsx("ms-2 w-5 h-5 ", icon)} />
                                    <span className="ms-3">Best Of Network</span>
                                </Link>
                            </li>
                        )}
                        <hr className="border-[var(--border)] mt-4 mb-4"></hr>

                        <li>
                            <button onClick={() => setIsResourcesOpen(!isResourcesOpen)} className={clsx(
                                "w-full flex justify-between items-center p-2 rounded-lg",
                                "uppercase text-[rgba(194,194,194,0.75)] dark:text-[rgba(194,194,194,0.75)]",
                                "hover:text-gray-900 dark:hover:text-white transition-colors",
                                hoverBg
                            )}>
                                <span className="ms-2">Resources</span>
                                <ChevronDown className={clsx("w-4 h-4 transition-transform", !isResourcesOpen && "transform -rotate-90")} />
                            </button>
                        </li>
                        {isResourcesOpen && (
                            <>
                                <li>
                                    <Link href="/policy/rules/" prefetch={false} className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}>
                                        <BookText className={clsx("ms-2 w-5 h-5 ", icon)} />
                                        <span className="ms-3">Network Rules</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/policy/privacy_policy" prefetch={false} className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}>
                                        <Shield className={clsx("ms-2 w-5 h-5 ", icon)} />
                                        <span className="ms-3">Privacy Policy</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/policy/terms_of_service" prefetch={false} className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}>
                                        <Scale className={clsx("ms-2 w-5 h-5 ", icon)} />
                                        <span className="ms-3">Terms of Service</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href="https://github.com/cldprgm/Network-vibe" prefetch={false} className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group", hoverBg)}>
                                        <Code className={clsx("ms-2 w-5 h-5 ", icon)} />
                                        <span className="ms-3">Source Code</span>
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>

                    <div className="mt-8 px-2 pb-6 pt-2 border-t border-[var(--border)]">
                        <p className="text-[11px] leading-4 text-gray-400 dark:text-gray-500">
                            By using this website, you agree to our{' '}
                            <Link
                                href="/policy/terms_of_service"
                                prefetch={false}
                                className="underline hover:text-gray-600 dark:hover:text-gray-300">
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link
                                href="/policy/privacy_policy"
                                prefetch={false}
                                className="underline hover:text-gray-600 dark:hover:text-gray-300">
                                Privacy Policy
                            </Link>.
                        </p>
                    </div>

                </div>
            </aside>
            <CreateCommunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCommunityCreate}
            />
        </>
    )
}