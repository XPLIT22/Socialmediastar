import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import PostCard from '@/components/PostCard';
import type { Profile, Post } from '@/lib/types';
import { Loader2, Calendar, ArrowLeft, Edit2, Check, X, Camera } from 'lucide-react';

interface ProfilePageProps {
  userId: string;
  onProfileClick: (userId: string) => void;
  onBack: () => void;
}

export default function ProfilePage({ userId, onProfileClick, onBack }: ProfilePageProps) {
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const isOwn = user?.id === userId;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const [{ data: prof }, { data: userPosts }, { data: follows }, { data: following }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('posts')
          .select('*, profile:profiles(*), likes(user_id), comments(id)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('follows').select('follower_id').eq('following_id', userId),
        supabase.from('follows').select('following_id').eq('follower_id', userId),
      ]);

    setProfile(prof as Profile | null);
    setEditName(prof?.full_name ?? '');
    setEditBio(prof?.bio ?? '');
    setEditAvatar(prof?.avatar_url ?? '');
    setEditBanner(prof?.banner_url ?? '');

    const enriched = (userPosts ?? []).map((p) => ({
      ...p,
      profile: p.profile as unknown as Post['profile'],
      like_count: p.likes?.length ?? 0,
      comment_count: p.comments?.length ?? 0,
      liked_by_me: p.likes?.some((l: { user_id: string }) => l.user_id === user?.id) ?? false,
    })) as Post[];
    setPosts(enriched);

    setFollowerCount(follows?.length ?? 0);
    setFollowingCount(following?.length ?? 0);

    if (user && !isOwn) {
      const { data: existing } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
      setIsFollowing(!!existing);
    }

    setLoading(false);
  }, [userId, user, isOwn]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function toggleFollow() {
    if (!user) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
  }

  async function uploadPhoto(file: File, type: 'avatar' | 'banner') {
    if (!user) return;
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${type}_${Date.now()}.${ext}`;

    if (type === 'avatar') setUploadingAvatar(true);
    else setUploadingBanner(true);

    const { error: upErr } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { cacheControl: '3600', upsert: true });

    if (upErr) {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
      return;
    }

    const { data: pub } = supabase.storage.from('profile-photos').getPublicUrl(path);
    const url = pub.publicUrl;

    if (type === 'avatar') {
      setEditAvatar(url);
      setUploadingAvatar(false);
    } else {
      setEditBanner(url);
      setUploadingBanner(false);
    }
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file, 'avatar');
    e.target.value = '';
  }

  function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadPhoto(file, 'banner');
    e.target.value = '';
  }

  async function saveEdit() {
    if (!profile) return;
    await supabase
      .from('profiles')
      .update({
        full_name: editName.trim() || profile.full_name,
        bio: editBio.trim() || null,
        avatar_url: editAvatar.trim() || null,
        banner_url: editBanner.trim() || null,
      })
      .eq('id', profile.id);
    setEditing(false);
    await loadProfile();
    await refreshProfile();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-white" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 text-neutral-500">User not found.</div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to feed
      </button>

      {/* Profile card */}
      <div className="bg-neutral-800 rounded-2xl shadow-sm border border-white/5 overflow-hidden mb-4">
        {/* Banner */}
        <div className="relative h-28 overflow-hidden">
          {editing && editBanner ? (
            <img src={editBanner} alt="banner" className="w-full h-full object-cover" />
          ) : profile.banner_url ? (
            <img src={profile.banner_url} alt="banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-600" />
          )}
          {editing && isOwn && (
            <button
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition"
            >
              {uploadingBanner ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
          )}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerFile}
            className="hidden"
          />
        </div>

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-14">
            {/* Avatar with camera overlay */}
            <div className="relative">
              {editing && isOwn ? (
                <div className="relative">
                  <Avatar
                    name={profile.full_name}
                    id={profile.id}
                    url={editAvatar || profile.avatar_url}
                    size="xl"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 hover:bg-black/50 transition"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
              ) : (
                <Avatar
                  name={profile.full_name}
                  id={profile.id}
                  url={profile.avatar_url}
                  size="xl"
                />
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </div>

            {isOwn ? (
              <button
                onClick={() => setEditing((e) => !e)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition"
              >
                <Edit2 className="w-4 h-4" />
                {editing ? 'Cancel' : 'Edit profile'}
              </button>
            ) : (
              <button
                onClick={toggleFollow}
                className={`px-5 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.98] ${
                  isFollowing
                    ? 'bg-white/10 text-neutral-300 hover:bg-rose-500/10 hover:text-rose-400'
                    : 'bg-white text-neutral-900 hover:bg-neutral-200 shadow-md shadow-white/20'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {editing ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Full name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">Bio</label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none text-sm text-white resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-200 transition"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mt-3">{profile.full_name}</h2>
              <p className="text-sm text-neutral-500">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sm text-neutral-300 mt-2 leading-relaxed">{profile.bio}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-neutral-500 mt-3">
                <Calendar className="w-3.5 h-3.5" />
                Joined {new Date(profile.created_at).toLocaleDateString('en', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>
              <div className="flex gap-6 mt-4 pt-4 border-t border-white/5">
                <div>
                  <span className="text-lg font-bold text-white">{followerCount}</span>{' '}
                  <span className="text-sm text-neutral-500">followers</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-white">{followingCount}</span>{' '}
                  <span className="text-sm text-neutral-500">following</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-white">{posts.length}</span>{' '}
                  <span className="text-sm text-neutral-500">posts</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-neutral-500 text-sm">
          {isOwn ? "You haven't posted yet." : "No posts yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostChanged={loadProfile}
              onProfileClick={onProfileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
