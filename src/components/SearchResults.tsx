import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Avatar from '@/components/Avatar';
import type { Profile } from '@/lib/types';
import { Loader2, ArrowLeft, Search as SearchIcon } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  onProfileClick: (userId: string) => void;
  onBack: () => void;
}

export default function SearchResults({ query, onProfileClick, onBack }: SearchResultsProps) {
  const [results, setResults] = useState<Profile[] | null>(null);
  const [loading, setLoading] = useState(false);

  if (results === null && !loading) {
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(20)
      .then(({ data }) => {
        setResults((data as Profile[]) ?? []);
        setLoading(false);
      });
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

      <h2 className="text-lg font-bold text-white mb-4">
        Search results for "{query}"
      </h2>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      ) : results && results.length === 0 ? (
        <div className="text-center py-16">
          <SearchIcon className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">No people found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {results?.map((p) => (
            <button
              key={p.id}
              onClick={() => onProfileClick(p.id)}
              className="w-full flex items-center gap-3 p-4 bg-neutral-800 rounded-2xl shadow-sm border border-white/5 hover:border-white/30 hover:shadow-md transition text-left"
            >
              <Avatar name={p.full_name} id={p.id} url={p.avatar_url} size="lg" />
              <div>
                <p className="font-semibold text-white">{p.full_name}</p>
                <p className="text-sm text-neutral-500">@{p.username}</p>
                {p.bio && (
                  <p className="text-sm text-neutral-400 mt-1 line-clamp-1">{p.bio}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
