'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-violet-950/30 text-slate-100">
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="text-center sm:text-left">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400/90">SyncNest TV</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Watch together, stay in sync
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400 sm:mx-0">
            Sign in to manage rooms, invite friends with roles, and get ready for shared playback and voice when those
            features land.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-start">
          {isLoading ? (
            <div className="flex h-12 items-center gap-2 text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              Loading…
            </div>
          ) : isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => router.push('/rooms')}
                className={cn(
                  'w-full rounded-2xl bg-violet-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-violet-950/50',
                  'transition hover:bg-violet-500 sm:w-auto',
                )}
              >
                Go to rooms
              </button>
              <Link
                href="/rooms"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-8 py-4 text-center text-base font-medium text-slate-200 hover:border-slate-600 sm:w-auto"
              >
                Browse dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className={cn(
                  'w-full rounded-2xl bg-violet-600 px-8 py-4 text-center text-base font-semibold text-white shadow-lg shadow-violet-950/50',
                  'transition hover:bg-violet-500 sm:w-auto',
                )}
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 px-8 py-4 text-center text-base font-medium text-slate-200 hover:border-slate-600 sm:w-auto"
              >
                Sign in
              </Link>
            </>
          )}
        </div>

        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {[
            { title: 'Secure auth', body: 'JWT access tokens and rotating HttpOnly refresh cookies.' },
            { title: 'Rooms & roles', body: 'Owners, co-hosts, and viewers with membership you control.' },
            { title: 'API-first', body: 'NestJS + Prisma backend ready for realtime and media next.' },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 text-left shadow-inner shadow-black/20"
            >
              <h3 className="font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
