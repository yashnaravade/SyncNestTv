'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Room } from '@/types/room';

interface CreateRoomModalProps {
  onCreate: (data: { name: string; description?: string }) => Promise<Room>;
}

export function CreateRoomModal({ onCreate }: CreateRoomModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Room name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onCreate({ name: name.trim(), description: description.trim() || undefined });
      setName('');
      setDescription('');
      setOpen(false);
    } catch {
      setError('Could not create room. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-2xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50">
        Create room
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new room</DialogTitle>
          <DialogDescription>Choose a name and optional description for the watch party.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="room-name">Room name</Label>
            <Input
              id="room-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Friday movie night"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="room-description">Description (optional)</Label>
            <Input
              id="room-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short summary for your guests"
            />
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Creating…' : 'Create room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
