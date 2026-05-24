'use client';

import { useEffect, useState } from 'react';
import { jellyfinApi } from '@/lib/api';

interface JellyfinItem {
  Id: string;
  Name: string;
  Type?: string;
  SeriesName?: string;
  ProductionYear?: number;
}

export default function MediaPage() {
  const [items, setItems] = useState<JellyfinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const response = await jellyfinApi.getLibrary({
          Recursive: true,
          IncludeItemTypes: 'Movie,Series,Episode',
          Limit: 60,
        });

        setItems(response.Items ?? []);
      } catch (err) {
        setError('Unable to load Jellyfin media. Please check your settings and try again.');
      } finally {
        setLoading(false);
      }
    };

    void loadLibrary();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[.32em] text-violet-400/80">Media Library</p>
        <h1 className="text-3xl font-semibold text-white">Jellyfin Content</h1>
        <p className="max-w-2xl text-sm text-slate-400">
          Browse media from your connected Jellyfin server. Select an item to continue building playback and sync features.
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center text-slate-300">
          Loading your Jellyfin library...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-950/70 p-8 text-center text-rose-200">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-center text-slate-300">
          No media items found. Please connect a Jellyfin server in Settings.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.Id}
              className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-5 transition hover:-translate-y-0.5 hover:border-violet-500/50"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[.24em] text-slate-400">
                    {item.Type ?? 'Media'}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-white">{item.Name}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                {item.SeriesName ? `Series: ${item.SeriesName}` : 'Item from your Jellyfin library.'}
              </p>
              {item.ProductionYear ? (
                <p className="mt-3 text-sm text-slate-500">Released in {item.ProductionYear}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
