'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SiteNav } from '@/components/SiteNav';
import { roomsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { Room } from '@/types/room';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await roomsApi.list();
      setRooms(data);
    } catch {
      setError('Could not load rooms. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await roomsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      await load();
    } catch {
      setError('Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-violet-950/20 text-slate-100">
        <SiteNav />
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white">Your rooms</h1>
            <p className="mt-2 text-slate-400">
              Create a space, then open it to manage members and roles (owner, co-host, viewer).
            </p>
          </div>

          <section className="mb-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl shadow-black/20">
            <h2 className="text-lg font-semibold text-white">Create a room</h2>
            <form onSubmit={onCreate} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2">
                <label htmlFor="room-name" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Name
                </label>
                <input
                  id="room-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Friday movie night"
                  className={cn(
                    'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600',
                    'focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30',
                  )}
                />
              </div>
              <div className="flex-[2] space-y-2">
                <label htmlFor="room-desc" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Description <span className="text-slate-600">(optional)</span>
                </label>
                <input
                  id="room-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional short description"
                  className={cn(
                    'w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600',
                    'focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30',
                  )}
                />
              </div>
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {creating ? 'Creating…' : 'Create'}
              </button>
            </form>
          </section>

          {error && (
            <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <section>
            <h2 className="mb-4 text-lg font-semibold text-white">Active rooms</h2>
            {loading ? (
              <div className="flex items-center gap-3 text-slate-400">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                Loading…
              </div>
            ) : rooms.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center text-slate-500">
                No rooms yet. Create one above to get started.
              </p>
            ) : (
              <ul className="space-y-3">
                {rooms.map((room) => (
                  <li key={room.id}>
                    <Link
                      href={`/rooms/${room.id}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 transition hover:border-violet-500/40 hover:bg-slate-900"
                    >
                      <div>
                        <p className="font-medium text-white">{room.name}</p>
                        <p className="text-xs text-slate-500">
                          Code <span className="font-mono text-violet-300">{room.code}</span>
                          {Array.isArray(room.members) && room.members[0] && 'role' in room.members[0] && (
                            <span className="ml-2 text-slate-600">
                              · You are <span className="text-slate-400">{room.members[0].role}</span>
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-slate-500">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
