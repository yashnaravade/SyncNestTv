import { create } from 'zustand';
import { roomsApi } from '@/lib/api';
import type { Room } from '@/types/room';

interface CreateRoomData {
  name: string;
  description?: string;
}

interface RoomStore {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<Room>;
  loadRoomByCode: (code: string) => Promise<Room>;
  clearCurrentRoom: () => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,
  fetchRooms: async () => {
    set({ isLoading: true, error: null });

    try {
      const rooms = await roomsApi.list();
      set({ rooms, isLoading: false });
    } catch {
      set({ error: 'Unable to load rooms.', isLoading: false });
    }
  },
  createRoom: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const room = await roomsApi.create(data);
      set((state) => ({ rooms: [room, ...state.rooms], isLoading: false }));
      return room;
    } catch {
      set({ error: 'Could not create room.', isLoading: false });
      throw new Error('Could not create room.');
    }
  },
  loadRoomByCode: async (code) => {
    set({ isLoading: true, error: null });

    try {
      const room = await roomsApi.getByCode(code);
      set({ currentRoom: room, isLoading: false });
      return room;
    } catch {
      set({ error: 'Room not found or access is denied.', isLoading: false });
      throw new Error('Room not found or access is denied.');
    }
  },
  clearCurrentRoom: () => set({ currentRoom: null, error: null }),
}));
