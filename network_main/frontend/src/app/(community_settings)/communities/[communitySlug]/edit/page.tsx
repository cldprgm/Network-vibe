import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import CommunityEditForm from "@/components/communities/CommunityEditForm";
import { CommunityType } from "@/services/types";

async function getCommunityData(communitySlug: string): Promise<CommunityType> {
    if (!communitySlug || communitySlug === 'null') {
        return notFound();
    }

    const headersList = await headers();
    const host = headersList.get('host');
    if (!host) {
        throw new Error('Error in getting "host"');
    }

    const cookieHeader = headersList.get('cookie') || '';
    const url = `http://${host}/api/proxy/communities/${communitySlug}`;

    const res = await fetch(url, {
        headers: { Cookie: cookieHeader },
        cache: 'no-store',
    });

    if (res.status === 404) notFound();
    if (!res.ok) throw new Error('Failed to fetch community data');

    const community = await res.json();
    if (!community) notFound();

    return community;
}


export default async function CommunityEditPage({ params }: { params: Promise<{ communitySlug: string }> }) {
    const { communitySlug } = await params;
    const community = await getCommunityData(communitySlug);

    const canEdit = community.current_user_permissions?.includes('edit_community');
    if (!canEdit) {
        redirect(`/communities/${community.slug}`);
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-4 mt-12">
            <h1 className="text-3xl font-bold text-white mb-2">Manage Community</h1>
            <p className="text-gray-400 mb-8">Settings for n/{community.name}</p>

            <CommunityEditForm community={community} />
        </div>
    );
}