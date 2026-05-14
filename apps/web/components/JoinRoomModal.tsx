'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { roomsApi } from '@/lib/api';

export function JoinRoomModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedCode = inviteCode.trim();
    if (!trimmedCode) {
      setError('Enter an invite code to join a room.');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const result = await roomsApi.joinRoom(trimmedCode);
      setInviteCode('');
      setOpen(false);
      router.push(`/rooms/${result.room.code}`);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      const serverMessage = axiosError.response?.data?.message;
      setError(
        serverMessage || 'Unable to join room with that invite code. Please check the code and try again.'
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:opacity-50">
        Join room
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>Enter the invite code from your host to join the room.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="invite-code">Invite code</Label>
            <Input
              id="invite-code"
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="Enter invite code"
              autoComplete="off"
            />
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isJoining}>
              {isJoining ? 'Joining…' : 'Join room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
