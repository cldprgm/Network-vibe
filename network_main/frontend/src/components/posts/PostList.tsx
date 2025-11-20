import PostsSection from './PostSection';
import { headers } from 'next/headers';
import { Post } from '@/services/types';

export default async function PostList() {
  const headersList = await headers();
  const host = headersList.get('host');
  if (!host) {
    throw new Error('Error in getting "host"');
  }

  // fix later
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const url = new URL(`http://frontend:3000/api/proxy/posts`);
  url.searchParams.append('page', '1')

  const cookieHeader = headersList.get('cookie') || '';
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
    },
    cache: 'no-store'
  });

  const data: { results: Post[]; next_cursor: string | number | null } = await res.json();

  return <PostsSection initialPosts={data.results} initialNextCursor={data.next_cursor} />;
}
