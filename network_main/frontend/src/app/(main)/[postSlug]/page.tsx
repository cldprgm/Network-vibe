import { headers } from "next/headers";
import { notFound } from "next/navigation";
import PostDetailItems from "@/components/posts/PostDetailItems";
import { Metadata } from "next";

async function getPostData(postSlug: string) {
  if (!postSlug || postSlug === 'null') {
    return notFound();
  }

  const headersList = await headers();
  const host = headersList.get('host');
  if (!host) {
    throw new Error('Error in getting "host"');
  }
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const url = `http://${host}/api/proxy/posts/${postSlug}`;

  const cookieHeader = headersList.get('cookie') || '';
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  if (!res.ok) {
    return notFound();
  }

  const post = await res.json();

  if (!post) notFound();

  return post;
}

export async function generateMetadata({ params }: { params: Promise<{ postSlug: string }>; }): Promise<Metadata> {
  const { postSlug } = await params;
  const post = await getPostData(postSlug);

  return {
    title: post.title,
    description: post.description?.slice(0, 100),
  };
}

export default async function PostDetailPage({ params }: { params: Promise<{ postSlug: string }> }) {
  const { postSlug } = await params;
  const post = await getPostData(postSlug);

  return (
    <div className="flex">
      <div className="flex-[5] max-w-[875px] mx-auto p-5 sm:p-10 md:p-16">
        <PostDetailItems postData={post} />
      </div>
      <div className="w-[250px] hidden xl:block"></div>

    </div>

  );
}