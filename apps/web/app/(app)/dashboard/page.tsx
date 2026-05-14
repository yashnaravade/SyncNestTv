'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CreateRoomModal } from '@/components/CreateRoomModal';
import { JoinRoomModal } from '@/components/JoinRoomModal';
import { useRoomStore } from '@/stores/roomStore';

export default function DashboardPage() {
  const rooms = useRoomStore((state) => state.rooms);
  const isLoading = useRoomStore((state) => state.isLoading);
  const error = useRoomStore((state) => state.error);
  const fetchRooms = useRoomStore((state) => state.fetchRooms);
  const createRoom = useRoomStore((state) => state.createRoom);

  useEffect(() => {
    void fetchRooms();
  }, [fetchRooms]);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-black/20 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-violet-300">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Your rooms</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Manage the rooms you own or join, create a new watch party, and open the room lobby by code.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <CreateRoomModal onCreate={createRoom} />
          <JoinRoomModal />
          <Link href="/rooms" className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-violet-500 hover:text-white">
            Browse legacy rooms
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-950/30 p-6 text-sm text-red-200">{error}</div>
      ) : null}

      {isLoading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 text-slate-400">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            Loading rooms…
          </div>
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-8 text-slate-400">
          <p className="text-lg font-semibold text-white">No rooms yet</p>
          <p className="mt-2 text-sm text-slate-500">Create a room to start a shared watch session and invite friends.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={`/rooms/${room.code}`}
              className="group rounded-3xl border border-slate-800 bg-slate-950/90 p-6 transition hover:border-violet-500/60 hover:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-white">{room.name}</p>
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{room.description || 'No description provided.'}</p>
                </div>
                <span className="rounded-full bg-violet-950/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
                  {room.code}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <span>{room.members?.length ?? 0} member{room.members?.length === 1 ? '' : 's'}</span>
                <span className="text-violet-300 group-hover:text-violet-200">Open lobby →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
