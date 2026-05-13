'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SiteNav } from '@/components/SiteNav';
import { roomsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import type { Room, RoomMember, RoomRole } from '@/types/room';

function membersWithUser(members: unknown): RoomMember[] {
  if (!members || !Array.isArray(members)) return [];
  return members.filter(
    (m): m is RoomMember =>
      typeof m === 'object' &&
      m !== null &&
      'user' in m &&
      typeof (m as RoomMember).user === 'object' &&
      (m as RoomMember).user !== null,
  );
}

export default function RoomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === 'string' ? params.id : '';
  const { user: currentUser } = useAuth();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberUserId, setMemberUserId] = useState('');
  const [memberRole, setMemberRole] = useState<RoomRole>('VIEWER');
  const [adding, setAdding] = useState(false);
  const [closing, setClosing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await roomsApi.get(id);
      setRoom(data);
    } catch {
      setError('Room not found or you are not a member.');
      setRoom(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const myRole = room?.members?.find((m) => m.userId === currentUser?.id)?.role;

  const onAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !memberUserId.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await roomsApi.addMember(id, memberUserId.trim(), memberRole);
      setMemberUserId('');
      await load();
    } catch {
      setError('Could not add member. Check the user id and your permissions (owner or co-host for viewers).');
    } finally {
      setAdding(false);
    }
  };

  const onCloseRoom = async () => {
    if (!id || !confirm('Close this room for everyone? You can still see it in the database as inactive.')) return;
    setClosing(true);
    setError(null);
    try {
      await roomsApi.remove(id);
      router.push('/rooms');
    } catch {
      setError('Only the room owner can close the room.');
    } finally {
      setClosing(false);
    }
  };

  const membersList = room ? membersWithUser(room.members) : [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-violet-950/20 text-slate-100">
        <SiteNav />
        <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link href="/rooms" className="text-sm font-medium text-violet-400 hover:text-violet-300">
            ← Back to rooms
          </Link>

          {loading ? (
            <div className="mt-10 flex items-center gap-3 text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              Loading room…
            </div>
          ) : !room ? (
            <p className="mt-10 text-red-300">{error || 'Room not found.'}</p>
          ) : (
            <>
              <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
                <h1 className="text-2xl font-bold text-white">{room.name}</h1>
                {room.description && <p className="mt-2 text-slate-400">{room.description}</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                    Invite code
                  </span>
                  <code className="rounded-lg bg-violet-950/80 px-3 py-1 font-mono text-sm text-violet-200">{room.code}</code>
                  {myRole && (
                    <span className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-400">
                      Your role: <span className="text-white">{myRole}</span>
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
                  {error}
                </div>
              )}

              <section className="mt-10">
                <h2 className="text-lg font-semibold text-white">Members</h2>
                <ul className="mt-4 divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/50">
                  {membersList.map((m) => (
                    <li key={m.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{m.user.username}</p>
                        <p className="text-xs text-slate-500">{m.user.email}</p>
                      </div>
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-medium text-violet-200">{m.role}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {(myRole === 'OWNER' || myRole === 'CO_HOST') && (
                <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                  <h2 className="text-lg font-semibold text-white">Add member</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Paste another user&apos;s id (from their profile or database). Co-hosts can add viewers; only the owner
                    can add co-hosts.
                  </p>
                  <form onSubmit={onAddMember} className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">User id</label>
                      <input
                        value={memberUserId}
                        onChange={(e) => setMemberUserId(e.target.value)}
                        placeholder="clxxxxxxxx…"
                        className={cn(
                          'mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white',
                          'focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30',
                        )}
                      />
                    </div>
                    <div className="sm:w-40">
                      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</label>
                      <select
                        value={memberRole}
                        onChange={(e) => setMemberRole(e.target.value as RoomRole)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white focus:border-violet-500 focus:outline-none"
                      >
                        <option value="VIEWER">Viewer</option>
                        <option value="CO_HOST">Co-host</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={adding || !memberUserId.trim()}
                      className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40"
                    >
                      {adding ? 'Adding…' : 'Add'}
                    </button>
                  </form>
                </section>
              )}

              {myRole === 'OWNER' && (
                <div className="mt-10 border-t border-slate-800 pt-8">
                  <button
                    type="button"
                    onClick={() => void onCloseRoom()}
                    disabled={closing}
                    className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-950/50 disabled:opacity-40"
                  >
                    {closing ? 'Closing…' : 'Close room (owner)'}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
