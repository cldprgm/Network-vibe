import { notFound } from "next/navigation";
import { headers } from 'next/headers';
import PostDetailItems from './postDetailItems';

export default async function PostDetail({ params }: { params: { slug: string } }) {
    const headersList = await headers();
    const host = headersList.get('host');
    if (!host) {
        throw new Error('Error in getting "host"');
    }
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const url = `${protocol}://${host}/api/proxy/posts/${params.slug}`;

    const cookieHeader = headersList.get('cookie') || '';
    const res = await fetch(url, {
        headers: {
            Cookie: cookieHeader,
        },
    });

    if (res.status === 404) {
        notFound();
    }

    const post = await res.json();

    if (!post) {
        notFound();
    }

    return (
        <div className="max-w-[865px] mx-auto p-5 sm:p-10 md:p-16">
            <PostDetailItems postData={post} />
        </div>
    );
};