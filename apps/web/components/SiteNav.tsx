'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLink =
  'text-sm font-medium text-slate-300 transition hover:text-white';

export function SiteNav() {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-white">SyncNest TV</span>
          <span className="hidden text-xs font-medium text-violet-400/90 sm:inline">watch together</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className={cn(navLink)}>
                Dashboard
              </Link>
              <Link href="/rooms" className={cn(navLink)}>
                Rooms
              </Link>
              <span className="hidden max-w-[140px] truncate text-xs text-slate-500 sm:inline" title={user?.email}>
                {user?.username}
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={cn(navLink)}>
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500"
              >
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
