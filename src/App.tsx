import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import AuthPage from '@/components/AuthPage';
import Header from '@/components/Header';
import Feed from '@/components/Feed';
import ProfilePage from '@/components/ProfilePage';
import SearchResults from '@/components/SearchResults';
import { Loader2 } from 'lucide-react';

type Page = 'feed' | 'profile' | 'search';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState<Page>('feed');
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  function navigate(p: 'feed' | 'profile', userId?: string) {
    if (p === 'profile') {
      setProfileUserId(userId ?? user?.id ?? null);
    }
    setPage(p);
  }

  function handleProfileClick(userId: string) {
    setProfileUserId(userId);
    setPage('profile');
  }

  function handleSearch(query: string) {
    setSearchQuery(query);
    setPage('search');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <Header
        onNavigate={navigate}
        onSearch={handleSearch}
        currentPage={page === 'profile' ? 'profile' : 'feed'}
      />
      {page === 'feed' && <Feed onProfileClick={handleProfileClick} />}
      {page === 'profile' && profileUserId && (
        <ProfilePage
          userId={profileUserId}
          onProfileClick={handleProfileClick}
          onBack={() => setPage('feed')}
        />
      )}
      {page === 'search' && (
        <SearchResults
          query={searchQuery}
          onProfileClick={handleProfileClick}
          onBack={() => setPage('feed')}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
