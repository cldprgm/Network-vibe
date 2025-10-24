'use client';

import React, { useState, useEffect } from "react"
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx"
import CreateCommunityModal from "./CreateCommunityModal";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { fetchCommunitiesForUserProfile } from "@/services/api";
import { useAuthStore } from "@/zustand_store/authStore";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();
    const { user } = useAuthStore();

    const [subscribedCommunities, setSubscribedCommunities] = useState<CommunityType[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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
        <div>
            <aside
                id="logo-sidebar"
                className={clsx(
                    "relative sticky top-0 left-0 z-40 h-screen pt-20 transition-all duration-300 border-r dark:bg-[var(--background)] dark:border-[var(--border)]",
                    collapsed ? "w-10" : "w-64",
                    "bg-white border-gray-200"
                )}
                aria-label="Sidebar"
            >
                <button
                    type="button"
                    onClick={toggleSidebar}
                    className="cursor-pointer absolute -right-4.5 z-50 w-9 h-9 flex items-center justify-center bg-gray-200 dark:bg-[var(--background)] border border-gray-300 dark:border-[var(--border)] rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    title={collapsed ? "Expand navigation" : "Collapse navigation"}
                >
                    {collapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    ) : (
                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    )}
                </button>
                {!collapsed && (
                    <div className="h-full px-4 pb-4 overflow-y-auto bg-white dark:bg-[var(--background)]">
                        <ul className="space-y-1">
                            <li>
                                <Link
                                    href="/"
                                    className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group",
                                        hoverBg
                                    )}
                                >
                                    <Home className={clsx("ms-2 w-5 h-5 ", icon)} />
                                    <span className="ms-3">Home</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group",
                                        hoverBg
                                    )}
                                >
                                    <Flame className={clsx("ms-2 w-5 h-5 ", icon)} />
                                    <span className="ms-3">Popular</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={'/communities/'}
                                    className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group",
                                        hoverBg
                                    )}
                                >
                                    <Compass className={clsx("ms-2 w-5 h-5 ", icon)} />
                                    <span className="ms-3">Explore communities</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className={clsx("flex items-center p-2 text-gray-900 rounded-lg dark:text-white group",
                                        hoverBg
                                    )}
                                >
                                    <List className={clsx("ms-2 w-5 h-5 ", icon)} />
                                    <span className="ms-3">All</span>
                                </Link>
                            </li>
                            <hr className="border-[var(--border)] mt-4 mb-4"></hr>
                            <h6 className="uppercase text-[rgba(194,194,194,0.75)]">Communities</h6>
                            <li>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className={clsx("cursor-pointer w-full flex items-center gap-[6px] px-3 p-2 text-gray-900 rounded-lg dark:text-white group",
                                        hoverBg
                                    )}
                                >
                                    <PlusCircle className={clsx("ms-1 w-5 h-5 ", icon)} />
                                    <span className="ml-1">Create community</span>
                                </button>
                            </li>
                            {subscribedCommunities.length > 0 ? (
                                <>
                                    <ul className="space-y-1 mt-2">
                                        {subscribedCommunities.map((community) => (
                                            <li key={community.id || community.slug}>
                                                <Link
                                                    href={`/communities/${community.slug}`}
                                                    className={clsx(
                                                        "flex items-center p-2 text-gray-900 rounded-lg dark:text-white group",
                                                        hoverBg
                                                    )}
                                                >
                                                    <div className="relative ms-2 shrink-0 w-7 h-7 rounded-full overflow-hidden">
                                                        <Image
                                                            src={community.icon}
                                                            alt={community.name || "Community icon"}
                                                            fill
                                                            className="object-cover"
                                                            sizes="28"
                                                            priority={false}
                                                        />
                                                    </div>
                                                    <span className="ms-3 truncate">{community.name}</span>
                                                </Link>
                                            </li>
                                        ))}
                                        {nextCursor && (
                                            <li>
                                                <button
                                                    onClick={loadMoreCommunities}
                                                    disabled={loading}
                                                    className={clsx(
                                                        "w-full flex items-center justify-center p-2 text-sm text-gray-600 dark:text-gray-400 rounded-lg group",
                                                        hoverBg,
                                                        loading && "opacity-50 cursor-not-allowed"
                                                    )}
                                                >
                                                    {loading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                    ) : (
                                                        <span>Load more</span>
                                                    )}
                                                </button>
                                            </li>
                                        )}
                                    </ul>
                                </>
                            ) : !loading && (
                                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                                    No communities yet. Create one to get started!
                                </div>
                            )}
                            <hr className="border-[var(--border)] mt-4 mb-4"></hr>

                        </ul>
                    </div>
                )}
            </aside>
            <CreateCommunityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCommunityCreate}
            />
        </div>
    )
}