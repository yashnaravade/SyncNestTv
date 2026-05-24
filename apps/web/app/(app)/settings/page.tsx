'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { jellyfinApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const jellyfinSchema = z.object({
  serverUrl: z.string().url('Enter a valid Jellyfin server URL'),
  apiKey: z.string().min(16, 'API key must be at least 16 characters'),
  jellyfinUserId: z.string().min(1, 'Jellyfin user ID is required'),
});

type JellyfinFormValues = z.infer<typeof jellyfinSchema>;

export default function SettingsPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JellyfinFormValues>({
    resolver: zodResolver(jellyfinSchema),
    defaultValues: {
      serverUrl: '',
      apiKey: '',
      jellyfinUserId: '',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadConfig = async () => {
      try {
        const response = await jellyfinApi.getConfig();
        if (response?.config) {
          reset({
            serverUrl: response.config.serverUrl || '',
            apiKey: '',
            jellyfinUserId: response.config.jellyfinUserId || '',
          });
        }
      } catch {
        // ignore load errors; user can still submit a new config
      }
    };

    void loadConfig();
  }, [isAuthenticated, reset]);

  const onSubmit = async (values: JellyfinFormValues) => {
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSaving(true);

    try {
      await jellyfinApi.connect(values);
      setSuccessMessage('Jellyfin configuration saved successfully.');
      setSubmitError(null);
    } catch (error) {
      setSubmitError('Unable to save Jellyfin configuration. Check your values and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 space-y-3">
          <p className="text-sm uppercase tracking-[0.28em] text-violet-300">Settings</p>
          <h1 className="text-3xl font-semibold text-white">Jellyfin Connection</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Connect your Jellyfin server so SyncNest TV can proxy media and keep your library available securely.
          </p>
        </div>

        <Card className="border border-border bg-card p-8 shadow-lg shadow-black/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}
            {successMessage && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {successMessage}
              </div>
            )}

            <div className="grid gap-6">
              <div>
                <Label htmlFor="serverUrl">Jellyfin Server URL</Label>
                <Input
                  id="serverUrl"
                  type="url"
                  placeholder="https://your-jellyfin.example.com"
                  autoComplete="url"
                  {...register('serverUrl')}
                />
                {errors.serverUrl && <p className="mt-2 text-sm text-destructive">{errors.serverUrl.message}</p>}
              </div>

              <div>
                <Label htmlFor="apiKey">Jellyfin API Key</Label>
                <Input
                  id="apiKey"
                  type="text"
                  placeholder="Paste your Jellyfin API key"
                  autoComplete="off"
                  {...register('apiKey')}
                />
                {errors.apiKey && <p className="mt-2 text-sm text-destructive">{errors.apiKey.message}</p>}
              </div>

              <div>
                <Label htmlFor="jellyfinUserId">Jellyfin User ID</Label>
                <Input
                  id="jellyfinUserId"
                  type="text"
                  placeholder="Jellyfin user ID"
                  autoComplete="username"
                  {...register('jellyfinUserId')}
                />
                {errors.jellyfinUserId && (
                  <p className="mt-2 text-sm text-destructive">{errors.jellyfinUserId.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>Saved configuration will be stored for your account.</p>
                <p>Future features will proxy media requests through the backend.</p>
              </div>
              <Button type="submit" disabled={isSaving || isLoading} className="w-full sm:w-auto">
                {isSaving ? 'Saving…' : 'Save Jellyfin Settings'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
