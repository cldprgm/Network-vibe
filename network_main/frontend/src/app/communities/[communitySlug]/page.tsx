import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import Image from "next/image";
import CommunityActions from "@/components/communities/CommunityActions";
import { Calendar, Lock, Globe, Flag, ArrowUp, MessageCircle, Share } from "lucide-react";

async function getCommunityData(communitySlug: string) {
    const headersList = await headers();
    const host = headersList.get('host');
    if (!host) {
        throw new Error('Error in getting "host"');
    }
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const url = `http://${host}/api/proxy/communities/${communitySlug}`;

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

    const formattedDate = format(new Date(community.created), "d MMMM yyyy", { locale: enUS });

    return (
        <div className="min-h-screen bg-gray-900 dark:bg-[var(--background)] text-gray-100 ">
            {/* Banner */}
            <div
                className="relative h-64 bg-gray-800"
                style={{
                    backgroundImage: `url(${community.banner})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}
            >
                <div
                    className="absolute inset-0"
                    style={{
                        background: `
        linear-gradient(
          to bottom, 
          rgba(0, 0, 0, 0.2) 0%, 
          rgba(22, 26, 29, 0.6) 60%, 
          rgba(22, 26, 29, 1) 100%
        )
      `
                    }}
                ></div>

                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="relative w-27 h-27 rounded-full border-4 border-[var(--background)] overflow-hidden bg-[var(--background)]">
                        <Image
                            src={community.icon}
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
                creator={community.creator}
            />

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row max-w-6xl mx-auto mt-10 px-4 lg:px-0">
                {/* Posts Column */}
                <div className="flex-1 lg:pr-8 space-y-6">
                    {/* Test Post */}
                    <div className="bg-gray-800 rounded-lg overflow-hidden mb-6">
                        <div className="p-4">
                            <div className="flex items-center text-gray-500 text-xs mb-2">
                                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded mr-2">BEST</span>
                                <span>Posted by <span className="text-blue-400">u/Worddspace</span></span>
                                <span className="mx-1">•</span>
                                <span>7 hours ago</span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-3">Peruvian jockeys racing without horses for charity</h2>
                            <div className="text-gray-400 text-sm mb-3">
                                <p className="font-bold mb-1">Note:</p>
                                <p>CARREERA DE JINETES A PIE 2025</p>
                                <p>22-06-25</p>
                                <p className="mt-2">Time: 4:43</p>
                            </div>
                        </div>

                        <div className="bg-black aspect-video flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-50"></div>
                            <div className="bg-gray-800 w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <div className="bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <span className="text-white">0:21 / 0:32</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 flex items-center">
                            <div className="flex items-center mr-4">
                                <button className="bg-gray-700 p-1.5 rounded-l hover:bg-gray-600">
                                    <ArrowUp className="w-5 h-5 text-gray-300" />
                                </button>
                                <span className="bg-gray-700 px-3 py-1.5 text-gray-300 font-medium">42</span>
                                <button className="bg-gray-700 p-1.5 rounded-r hover:bg-gray-600">
                                    <ArrowUp className="w-5 h-5 text-gray-300 rotate-180" />
                                </button>
                            </div>
                            <button className="flex items-center text-gray-400 hover:text-gray-300 mr-4">
                                <MessageCircle className="w-5 h-5 mr-1" />
                                <span>42 comments</span>
                            </button>
                            <button className="flex items-center text-gray-400 hover:text-gray-300">
                                <Share className="w-5 h-5 mr-1" />
                                <span>Share</span>
                            </button>
                        </div>
                    </div>
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
                                <div className="text-white font-bold">15M</div>
                                <div className="text-gray-400 text-xs">Members</div>
                            </div>
                            <div className="text-center">
                                <div className="text-white font-bold">2.4K</div>
                                <div className="text-gray-400 text-xs">Online</div>
                            </div>
                            <div className="text-center">
                                <div className="text-white font-bold">Top 1%</div>
                                <div className="text-gray-400 text-xs">Rating</div>
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
                                ) : (
                                    <Globe className="w-4 h-4 mr-2" />
                                )}
                                <span>{community.visibility === "PRIVATE" ? "Private" : "Public"} community</span>
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