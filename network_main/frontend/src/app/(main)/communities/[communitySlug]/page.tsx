import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import Image from "next/image";
import CommunityActions from "@/components/communities/CommunityActions";
import { Calendar, Lock, Globe, Flag, Shield } from "lucide-react";
import { Post } from "@/services/types";
import CommunityPostList from '@/components/communities/CommunityPostList';

const containerUrl = process.env.NEXT_PUBLIC_API_BASE_CONTAINER_URL;

async function getCommunityData(communitySlug: string) {
    if (!communitySlug || communitySlug === 'null') {
        return notFound();
    }

    const headersList = await headers();
    const host = headersList.get('host');
    if (!host) {
        throw new Error('Error in getting "host"');
    }
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const url = `http://localhost:3000/api/proxy/communities/${communitySlug}`;

    const cookieHeader = headersList.get('cookie') || '';
    const res = await fetch(url, {
        headers: {
            Cookie: cookieHeader,
        },
    });

    if (res.status === 404) notFound();

    const community = await res.json();

    if (!community) notFound();

    return community;
}

async function getCommunityPosts(communitySlug: string) {
    const headersList = await headers();
    const host = headersList.get('host');
    if (!host) {
        throw new Error('Error in getting "host"');
    }
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const url = new URL(`http://localhost:3000/api/proxy/communities/${communitySlug}/posts`);
    url.searchParams.append('page', '1')


    const cookieHeader = headersList.get('cookie') || '';
    const res = await fetch(url, {
        headers: {
            Cookie: cookieHeader,
        },
    });

    if (res.status === 404) notFound();

    const data: { results: Post[]; next: string | null } = await res.json();

    const nextPage = data.next
        ? Number(new URL(data.next).searchParams.get('page'))
        : null;

    if (!data) notFound();

    return { data, nextPage };
}

export async function generateMetadata({ params }: { params: Promise<{ communitySlug: string }>; }): Promise<Metadata> {
    const { communitySlug } = await params;
    const community = await getCommunityData(communitySlug);

    return {
        title: community.name,
        description: community.description?.slice(0, 100),
    };
}

export default async function CommunityDetailPage({ params }: { params: Promise<{ communitySlug: string }> }) {
    const { communitySlug } = await params;
    const community = await getCommunityData(communitySlug);
    const postList = await getCommunityPosts(communitySlug)

    const formattedDate = format(new Date(community.created), "d MMMM yyyy", { locale: enUS });

    return (
        <div className="min-h-screen bg-gray-900 dark:bg-[var(--background)] text-gray-100 ">
            {/* Banner */}
            <div className="relative h-90 sm:h-64 md:h-90">
                <Image
                    src={`${containerUrl}${community.banner}`}
                    alt={`${community.name} banner`}
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />

                <div
                    className="absolute inset-0"
                    style={{
                        background: `
        linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.2) 0%,
          rgba(22, 26, 29, 0.4) 95%,
          rgba(22, 26, 29, 1) 100%
        )
    `,
                    }}
                />

                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="relative w-27 h-27 rounded-full border-4 border-[var(--background)] overflow-hidden bg-[var(--background)]">
                        <Image
                            src={`${containerUrl}${community.icon}`}
                            alt={community.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="mt-16 text-center px-4">
                <h1 className="text-4xl font-bold tracking-tight">n/{community.name}</h1>
                <p className="mt-2 text-lg text-gray-400 break-words whitespace-pre-wrap break-all overflow-hidden">{community.description}</p>
            </div>

            {/* Actions */}
            <CommunityActions
                community={community}
                isMember={community.is_member}
            />

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row max-w-6xl mx-auto mt-10 px-4 lg:px-0">
                {/* Posts Column */}
                <div className="flex-1 lg:pr-8 space-y-6">

                    <CommunityPostList
                        initialPosts={postList.data.results}
                        initialNextPage={postList.nextPage}
                        communitySlug={communitySlug}
                    />

                </div>



                {/* Sidebar */}
                <aside className="mt-10 lg:mt-0 w-full lg:w-80">
                    <div className="p-6 bg-[var(--hover-post-background)] rounded-lg shadow space-y-4 mb-4">
                        <h3 className="text-lg font-semibold">About Community</h3>
                        <div className="flex items-center space-x-2 text-gray-400">
                            <span className="break-words whitespace-pre-wrap overflow-hidden">{community.description}</span>
                        </div>
                        <div className="text-sm text-gray-500">Created by u/{community.creator}</div>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="text-center">
                                <div className="text-white font-bold">{community.members_count}</div>
                                <div className="text-gray-400 text-xs">Members</div>
                            </div>
                            <div className="text-center">
                                <div className="text-white font-bold">2.4K</div>
                                <div className="text-gray-400 text-xs">Online(Not Working yet)</div>
                            </div>
                            <div className="text-center">
                                <div className="text-white font-bold">Top 1%</div>
                                <div className="text-gray-400 text-xs">Rank by size</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <div className="flex items-center text-gray-400 text-sm mb-2">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>Created {formattedDate}</span>
                            </div>
                            <div className="flex items-center text-gray-400 text-sm">
                                {community.visibility === "PRIVATE" ? (
                                    <Lock className="w-4 h-4 mr-2" />
                                ) : community.visibility === "RESTRICTED" ? (
                                    <Shield className="w-4 h-4 mr-2" />
                                ) : (
                                    <Globe className="w-4 h-4 mr-2" />
                                )}
                                <span>
                                    {community.visibility === "PRIVATE"
                                        ? "Private"
                                        : community.visibility === "RESTRICTED"
                                            ? "Restricted"
                                            : "Public"}{" "}
                                    community
                                </span>
                            </div>
                        </div>
                    </div>


                    {/* Community Rules */}
                    <div className="bg-[var(--hover-post-background)] rounded-lg p-4 mb-4">
                        <h3 className="font-bold text-white mb-3 flex items-center">
                            <Flag className="w-5 h-5 mr-2 text-orange-500" />
                            n/{community.name} Rules
                        </h3>

                        <div className="mb-3">
                            <h4 className="text-orange-500 text-sm font-bold mb-1">1. Posts SHOULD be INTERESTING</h4>
                            <p className="text-gray-400 text-sm">
                                All content should show something objectively interesting.What you find interesting will not necessarily be interesting to others.
                            </p>
                        </div>

                        <div className="mb-3">
                            <h4 className="text-orange-500 text-sm font-bold mb-1">2. Original content</h4>
                            <p className="text-gray-400 text-sm">
                                Original content is preferred. Reposts are allowed, but with an indication of the source.
                            </p>
                        </div>

                        <div className="mb-3">
                            <h4 className="text-orange-500 text-sm font-bold mb-1">3. Prohibited content</h4>
                            <p className="text-gray-400 text-sm">
                                Prohibited: violence, cruelty, adult materials, incitement to hatred.
                            </p>
                        </div>

                        <button className="text-blue-500 text-sm font-medium hover:text-blue-400 mt-2">
                            Show all rules
                        </button>
                    </div>

                    {/* Moderators */}
                    <div className="bg-[var(--hover-post-background)] rounded-lg p-4">
                        <h3 className="font-bold text-white mb-3">Moderators</h3>
                        <div className="flex items-center mb-3">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
                            <span className="text-blue-500 text-sm">u/{community.creator}</span>
                        </div>
                        <div className="flex items-center mb-3">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
                            <span className="text-blue-500 text-sm">u/Moderator1</span>
                        </div>
                        <div className="flex items-center">
                            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8 mr-2" />
                            <span className="text-blue-500 text-sm">u/Moderator2</span>
                        </div>
                        <button className="text-blue-500 text-sm font-medium hover:text-blue-400 mt-3">
                            Report a violation
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
