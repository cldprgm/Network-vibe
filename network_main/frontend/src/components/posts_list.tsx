import PostItem from './postItems';
import { headers } from 'next/headers';
import { Post } from '@/services/types';

export default async function PostList() {
  const headersList = await headers();
  const host = headersList.get('host');
  if (!host) {
    throw new Error('Error in getting "host"');
  }

  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const url = `http://${host}/api/proxy/posts`;

  const cookieHeader = headersList.get('cookie') || '';
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  const posts = await res.json();

  return (
    <div className="max-w-[865px] mx-auto p-5 sm:p-10 md:p-16">
      <div className="border-b mb-5 flex justify-between text-sm dark:border-[var(--border)]" />
      {posts.map((post: Post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
}