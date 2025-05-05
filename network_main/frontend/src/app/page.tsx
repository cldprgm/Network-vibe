import Image from "next/image";
import { getPosts } from '@/services/api';
import PostList from '@/components/posts_list'

export default async function Home() {

  return (
    <div>
      <PostList />
    </div>
  );
}
