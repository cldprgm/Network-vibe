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
  const url = new URL(`http://${host}:3000/api/proxy/posts`);
  url.searchParams.append('page', '1')

  const cookieHeader = headersList.get('cookie') || '';
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  const data: { results: Post[]; next: string | null } = await res.json();

  const nextPage = data.next
    ? Number(new URL(data.next).searchParams.get('page'))
    : null;

  return <PostsSection initialPosts={data.results} initialNextPage={nextPage} />;
}