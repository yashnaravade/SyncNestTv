'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useRoomStore } from '@/stores/roomStore';
import { useAuth } from '@/hooks/useAuth';
import { roomsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import type { RoomMember } from '@/types/room';

function getMembersWithUser(members: unknown): RoomMember[] {
  if (!Array.isArray(members)) {
    return [];
  }

  return members.filter(
    (member): member is RoomMember =>
      typeof member === 'object' &&
      member !== null &&
      'user' in member &&
      typeof (member as Record<string, unknown>).user === 'object' &&
      (member as Record<string, unknown>).user !== null,
  );
}

export default function RoomLobbyPage() {
  const params = useParams();
  const code = typeof params.code === 'string' ? params.code : '';
  const { user: currentUser } = useAuth();
  const room = useRoomStore((state) => state.currentRoom);
  const roomMembers = getMembersWithUser(room?.members);
  const isLoading = useRoomStore((state) => state.isLoading);
  const error = useRoomStore((state) => state.error);
  const loadRoomByCode = useRoomStore((state) => state.loadRoomByCode);
  const clearCurrentRoom = useRoomStore((state) => state.clearCurrentRoom);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const myRole = roomMembers.find((member) => member.userId === currentUser?.id)?.role;
  const canGenerateInvite = myRole === 'OWNER' || myRole === 'CO_HOST';

  const handleGenerateInvite = async () => {
    if (!room?.id) return;
    setInviteError(null);
    setIsCopied(false);
    setIsGeneratingInvite(true);

    try {
      const result = await roomsApi.generateInvite(room.id);
      setInviteCode(result.code);
      try {
        await navigator.clipboard.writeText(result.code);
        setIsCopied(true);
        window.setTimeout(() => setIsCopied(false), 2000);
      } catch {
        setInviteError('Invite generated, but clipboard copy failed. Please copy it manually.');
      }
    } catch (error) {
      setInviteError('Unable to generate invite. Please refresh and try again.');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInviteCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      setInviteError('Could not copy invite code. Please try again.');
    }
  };

  useEffect(() => {
    if (!code) return;
    void loadRoomByCode(code);
    return () => clearCurrentRoom();
  }, [code, clearCurrentRoom, loadRoomByCode]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-violet-300">Room lobby</p>
          <h1 className="text-3xl font-semibold text-white">{room?.name || 'Room details'}</h1>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-violet-500 hover:text-white"
        >
          Back to dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            Loading room…
          </div>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-950/30 p-6 text-sm text-red-200">{error}</div>
      ) : room ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-violet-300">Invite code</p>
                <p className="mt-2 text-2xl font-semibold text-white">{room.code}</p>
              </div>
              <div className="rounded-3xl bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                <p className="font-medium text-white">Status</p>
                <p className="mt-1 text-slate-400">{room.isActive ? 'Active' : 'Closed'}</p>
              </div>
            </div>
            {room.description ? <p className="mt-6 text-slate-400">{room.description}</p> : null}

          {canGenerateInvite ? (
            <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Add people</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Generate an invite code to share with friends so they can join this room.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateInvite}
                  disabled={isGeneratingInvite}
                  className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {isGeneratingInvite ? 'Generating…' : 'Generate invite code'}
                </button>
              </div>
              {inviteCode ? (
                <div className="mt-4 rounded-3xl border border-violet-500/30 bg-violet-950/10 p-4 text-sm text-slate-100">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">Invite code copied to clipboard:</p>
                      <p className="mt-2 break-all font-mono text-violet-200">{inviteCode}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyInviteCode}
                      className="mt-2 sm:mt-0"
                    >
                      {isCopied ? (
                        <span className="inline-flex items-center gap-2">
                          <Check className="h-4 w-4" /> Copied!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <Copy className="h-4 w-4" /> Copy
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
              {inviteError ? (
                <p className="mt-3 text-sm text-red-300">{inviteError}</p>
              ) : null}
            </div>
          ) : null}
          </div>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">Members</h2>
              <span className="rounded-full bg-slate-950/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                {room.members?.length ?? 0}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {roomMembers.length ? (
                roomMembers.map((member) => (
                  <div key={member.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{member.user.username}</p>
                      <p className="mt-1 text-sm text-slate-500">{member.user.email}</p>
                    </div>
                    <span className="mt-4 inline-flex rounded-full bg-violet-950/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-200 sm:mt-0">
                      {member.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/80 p-6 text-sm text-slate-500">
                  No members found for this room.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-slate-400">No room data available.</div>
      )}
    </section>
  );
}
