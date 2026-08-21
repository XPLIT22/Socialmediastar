import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import PostComposer from '@/components/PostComposer';
import PostCard from '@/components/PostCard';
import type { Post } from '@/lib/types';
import { Loader2, Sparkles } from 'lucide-react';

interface FeedProps {
  onProfileClick: (userId: string) => void;
}

export default function Feed({ onProfileClick }: FeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(
        '*, profile:profiles(*), likes(user_id), comments(id)'
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const enriched = (data ?? []).map((p) => ({
      ...p,
      profile: p.profile as unknown as Post['profile'],
      like_count: p.likes?.length ?? 0,
      comment_count: p.comments?.length ?? 0,
      liked_by_me: p.likes?.some((l: { user_id: string }) => l.user_id === user?.id) ?? false,
    })) as Post[];

    setPosts(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
      <PostComposer onPostCreated={loadPosts} />

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-white/20">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-200 mb-1">No posts yet</h3>
          <p className="text-neutral-500 text-sm">Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onPostChanged={loadPosts}
            onProfileClick={onProfileClick}
          />
        ))
      )}
    </div>
  );
}
