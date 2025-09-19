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
  const url = new URL(`http://${host}/api/proxy/posts`);

  const cookieHeader = headersList.get('cookie') || '';
  const res = await fetch(url, {
    headers: {
      Cookie: cookieHeader,
    },
  });

  const data: { results: Post[]; next: string | null; previous: string | null } = await res.json();


  const nextCursor = data.next ? new URL(data.next).searchParams.get('cursor') : null;
  const previousCursor = data.previous ? new URL(data.previous).searchParams.get('cursor') : null;

  return (
    <PostsSection
      initialPosts={data.results}
      initialNextCursor={nextCursor}
      initialPreviousCursor={previousCursor}
    />
  );
}