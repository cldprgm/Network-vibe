import { getPostDetail } from "@/services/api";
import { notFound } from "next/navigation";
import { headers } from 'next/headers';
import PostDetailItems from './postDetailItems';

export default async function PostDetail({ params }: { params: { slug: string } }) {
    const headersList = await headers();
    const cookies = headersList.get('cookie') || '';
    const post = await getPostDetail(params.slug, cookies);

    if (!post) {
        notFound();
    }

    return (
        <div className="max-w-[865px] mx-auto p-5 sm:p-10 md:p-16">
            <PostDetailItems postData={post} />
        </div>
    );
};