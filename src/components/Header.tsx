import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import { Search, Home, User, LogOut } from 'lucide-react';

interface HeaderProps {
  onNavigate: (page: 'feed' | 'profile', userId?: string) => void;
  onSearch: (query: string) => void;
  currentPage: 'feed' | 'profile';
}

export default function Header({ onNavigate, onSearch, currentPage }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) onSearch(searchQuery.trim());
  }

  return (
    <header className="sticky top-0 z-50 glass-header backdrop-blur-md border-b shadow-lg shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate('feed')}
          className="flex items-center gap-2.5 shrink-0"
        >
          <img
            src="/Polish_20260820_130034511.png"
            alt="_star"
            className="logo-mark w-9 h-9 rounded-xl object-cover"
          />
          <span className="text-xl font-bold text-white tracking-tight hidden sm:block">_star</span>
        </button>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/5 border border-white/10 text-white placeholder:text-neutral-500 focus:bg-white/10 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none transition text-sm"
            />
          </div>
        </form>

        {/* Nav */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onNavigate('feed')}
            className={`p-2.5 rounded-xl transition ${
              currentPage === 'feed'
                ? 'bg-white/15 text-white'
                : 'text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
            title="Home"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={() => onNavigate('profile')}
            className={`p-2.5 rounded-xl transition ${
              currentPage === 'profile'
                ? 'bg-white/15 text-white'
                : 'text-neutral-400 hover:bg-white/10 hover:text-white'
            }`}
            title="Profile"
          >
            <User className="w-5 h-5" />
          </button>
          {profile && (
            <button
              onClick={() => onNavigate('profile')}
              className="ml-1 shrink-0"
              title={profile.full_name}
            >
              <Avatar name={profile.full_name} id={profile.id} url={profile.avatar_url} size="sm" />
            </button>
          )}
          <button
            onClick={signOut}
            className="p-2.5 rounded-xl text-neutral-400 hover:bg-rose-500/15 hover:text-rose-300 transition ml-1"
            title="Sign out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
