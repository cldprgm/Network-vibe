import { getPosts } from '@/services/api';
import PostItem from './postItems';
import { headers } from 'next/headers';

export default async function PostList() {
  const headersList = await headers();
  const cookies = headersList.get('cookie') || '';
  const posts = await getPosts(cookies);

  return (
    <div className="max-w-[865px] mx-auto p-5 sm:p-10 md:p-16">
      <div className="border-b mb-5 flex justify-between text-sm dark:border-[var(--border)]" />
      {posts.map((post) => (
        <PostItem key={post.id} post={post} />
      ))}
    </div>
  );
}