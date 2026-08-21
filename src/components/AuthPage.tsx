import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Users, Heart, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName);
      if (error) setError(error);
      else setSuccess('Account created! Welcome to _star.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side — branding */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <img src="/Polish_20260820_130034511.png" alt="_star" className="logo-mark w-14 h-14 rounded-2xl object-cover" />
            <span className="text-3xl font-bold text-white tracking-tight">_star</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Connect with the people who matter to you.
          </h1>
          <p className="text-lg text-neutral-400 mb-8">
            Share posts, follow friends, and stay in the loop with what's happening in your circle.
          </p>
          <div className="space-y-4">
            {[
              { icon: Sparkles, text: 'Share posts and photos with your network' },
              { icon: Heart, text: 'Like and comment on what your friends share' },
              { icon: Users, text: 'Follow people and build your community' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-neutral-300">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/10">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side — form */}
        <div className="bg-neutral-800 rounded-3xl shadow-2xl shadow-black/40 p-8 border border-white/10">
          <div className="flex items-center gap-3 mb-6 md:hidden">
            <img src="/Polish_20260820_130034511.png" alt="_star" className="logo-mark w-12 h-12 rounded-2xl object-cover" />
            <span className="text-2xl font-bold text-white tracking-tight">_star</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-neutral-500 text-sm mb-6">
            {mode === 'signin'
              ? 'Sign in to see what your friends are up to.'
              : 'Join _star and start sharing today.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Jane Doe"
                  className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none transition text-white placeholder:text-neutral-600"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none transition text-white placeholder:text-neutral-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 focus:border-white/50 focus:ring-2 focus:ring-white/20 outline-none transition text-white placeholder:text-neutral-600"
              />
            </div>

            {error && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-white text-neutral-900 font-semibold hover:bg-neutral-200 active:scale-[0.98] transition shadow-lg shadow-white/20 disabled:opacity-50"
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-500">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-white font-semibold hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-white font-semibold hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
