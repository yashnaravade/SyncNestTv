export type RoomRole = 'OWNER' | 'CO_HOST' | 'VIEWER';

export interface RoomMemberUser {
  id: string;
  email: string;
  username: string;
}

export interface RoomMember {
  id: string;
  userId: string;
  roomId: string;
  role: RoomRole;
  joinedAt: string;
  user: RoomMemberUser;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  code: string;
  codeExpiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members?: RoomMember[] | Array<{ id: string; userId: string; roomId: string; role: RoomRole; joinedAt: string }>;
}
