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
    const url = `http://localhost:3000/api/proxy/communities/${communitySlug}`;

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
        <div className="mx-auto py-10 px-4 mt-10">
            <CommunityEditForm community={community} />
        </div>
    );
}
