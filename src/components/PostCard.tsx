import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import { timeAgo, formatCount } from '@/lib/utils';
import type { Post, Comment as CommentType } from '@/lib/types';
import { Heart, MessageCircle, Trash2, Send, Loader2 } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onPostChanged: () => void;
  onProfileClick: (userId: string) => void;
}

export default function PostCard({ post, onPostChanged, onProfileClick }: PostCardProps) {
  const { user, profile } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentType[]>(post.comments ?? []);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [liking, setLiking] = useState(false);

  const liked = post.liked_by_me ?? false;
  const likeCount = post.like_count ?? post.likes?.length ?? 0;
  const commentCount = post.comment_count ?? comments.length;

  async function toggleLike() {
    if (!user || liking) return;
    setLiking(true);
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
    }
    onPostChanged();
    setLiking(false);
  }

  async function loadComments() {
    setLoadingComments(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profile:profiles(*)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    if (data) setComments(data as unknown as CommentType[]);
    setLoadingComments(false);
  }

  async function toggleComments() {
    if (!showComments) await loadComments();
    setShowComments((s) => !s);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    setPostingComment(true);
    const { data } = await supabase
      .from('comments')
      .insert({ post_id: post.id, content: commentText.trim() })
      .select('*, profile:profiles(*)')
      .single();
    if (data) {
      setComments((prev) => [...prev, data as unknown as CommentType]);
      setCommentText('');
    }
    setPostingComment(false);
    onPostChanged();
  }

  async function deletePost() {
    await supabase.from('posts').delete().eq('id', post.id);
    onPostChanged();
  }

  async function deleteComment(id: string) {
    await supabase.from('comments').delete().eq('id', id);
    setComments((prev) => prev.filter((c) => c.id !== id));
    onPostChanged();
  }

  const postProfile = post.profile;

  return (
    <div className="bg-neutral-800 rounded-2xl shadow-sm border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => postProfile && onProfileClick(postProfile.id)}
          className="flex items-center gap-3 group"
        >
          <Avatar
            name={postProfile?.full_name ?? 'Unknown'}
            id={postProfile?.id ?? post.user_id}
            url={postProfile?.avatar_url}
          />
          <div className="text-left">
            <p className="font-semibold text-neutral-100 text-sm group-hover:underline">
              {postProfile?.full_name ?? 'Unknown User'}
            </p>
            <p className="text-xs text-neutral-500">{timeAgo(post.created_at)}</p>
          </div>
        </button>
        {user?.id === post.user_id && (
          <button
            onClick={deletePost}
            className="p-2 rounded-lg text-neutral-500 hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
            {post.content}
          </p>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="w-full max-h-[500px] overflow-hidden bg-neutral-900">
          <img
            src={post.image_url}
            alt="post"
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Stats */}
      {(likeCount > 0 || commentCount > 0) && (
        <div className="flex items-center justify-between px-4 py-2.5 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            {likeCount > 0 && (
              <>
                <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                  <Heart className="w-2.5 h-2.5 text-white fill-white" />
                </span>
                {formatCount(likeCount)}
              </>
            )}
          </span>
          {commentCount > 0 && (
            <span>{formatCount(commentCount)} comment{commentCount !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 py-1 border-t border-white/5">
        <button
          onClick={toggleLike}
          disabled={liking}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition ${
            liked
              ? 'text-rose-400 hover:bg-rose-500/10'
              : 'text-neutral-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
          Like
        </button>
        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-white/5 hover:text-white transition"
        >
          <MessageCircle className="w-4 h-4" />
          Comment
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-white/5 px-4 py-3 space-y-3 bg-neutral-900/50">
          {loadingComments && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
            </div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 group">
              <Avatar
                name={c.profile?.full_name ?? 'Unknown'}
                id={c.profile?.id ?? c.user_id}
                url={c.profile?.avatar_url}
                size="sm"
              />
              <div className="flex-1">
                <div className="bg-neutral-800 rounded-2xl px-3 py-2 inline-block max-w-full">
                  <p className="text-xs font-semibold text-neutral-100">
                    {c.profile?.full_name ?? 'Unknown'}
                  </p>
                  <p className="text-sm text-neutral-300 break-words">{c.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1 px-1">
                  <span className="text-xs text-neutral-500">{timeAgo(c.created_at)}</span>
                  {user?.id === c.user_id && (
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-xs text-neutral-500 hover:text-rose-400 transition opacity-0 group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Comment input */}
          {profile && (
            <form onSubmit={submitComment} className="flex gap-2 items-center pt-1">
              <Avatar name={profile.full_name} id={profile.id} url={profile.avatar_url} size="sm" />
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full pl-4 pr-10 py-2 rounded-full bg-neutral-800 border border-white/10 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none transition text-sm text-neutral-100 placeholder:text-neutral-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || postingComment}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-white hover:bg-white/10 transition disabled:opacity-40"
                >
                  {postingComment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
