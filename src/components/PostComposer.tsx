import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import { ImagePlus, Loader2, X } from 'lucide-react';

interface PostComposerProps {
  onPostCreated: () => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
  const { profile } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImage, setShowImage] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !profile) return;
    setLoading(true);
    const { error } = await supabase.from('posts').insert({
      content: content.trim(),
      image_url: imageUrl.trim() || null,
    });
    if (!error) {
      setContent('');
      setImageUrl('');
      setShowImage(false);
      onPostCreated();
    }
    setLoading(false);
  }

  if (!profile) return null;

  return (
    <div className="bg-neutral-800 rounded-2xl shadow-sm border border-white/5 p-4">
      <div className="flex gap-3">
        <Avatar name={profile.full_name} id={profile.id} url={profile.avatar_url} />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`What's on your mind, ${profile.full_name.split(' ')[0]}?`}
            rows={2}
            className="w-full resize-none px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/5 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none transition text-neutral-100 placeholder:text-neutral-500 text-sm"
          />
          {showImage && (
            <div className="mt-2 flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                className="flex-1 px-4 py-2 rounded-xl bg-neutral-900 border border-white/5 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none transition text-sm text-neutral-100 placeholder:text-neutral-500"
              />
              <button
                onClick={() => {
                  setShowImage(false);
                  setImageUrl('');
                }}
                className="p-2 rounded-xl text-neutral-500 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {imageUrl && (
            <div className="mt-2 rounded-xl overflow-hidden border border-white/5">
              <img src={imageUrl} alt="preview" className="w-full max-h-80 object-cover" />
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setShowImage((s) => !s)}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Photo</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || loading}
              className="px-5 py-2 rounded-xl bg-white text-neutral-900 text-sm font-semibold hover:bg-neutral-200 active:scale-[0.98] transition shadow-sm shadow-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Post'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
