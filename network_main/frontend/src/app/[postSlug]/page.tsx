// app/[postSlug]/page.tsx
import PostDetail from "@/components/post_detail";

export default async function PostDetailPage({ params }: { params: Promise<{ postSlug: string }> }) {
  const resolvedParams = await params;
  return (
    <div>
      <PostDetail params={{ slug: resolvedParams.postSlug }} />
    </div>
  );
}