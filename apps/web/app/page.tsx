import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(56,189,248,0.16),_transparent_18%),var(--background)] text-foreground">
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.5fr_0.9fr] lg:items-center">
          <section className="space-y-8">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                Sync-first video watch parties
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Stream together with modern sync, chat, and room controls.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Build the next shared viewing experience on a solid foundation: App Router, Tailwind, shadcn/ui,
                Socket.IO realtime, and a backend designed for rooms, invites, and playback state.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/register" className="inline-flex">
                <Button className="rounded-2xl px-6 py-3 text-sm font-semibold">
                  Get started
                </Button>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/80 px-6 py-3 text-sm font-medium text-foreground transition hover:bg-card"
              >
                Learn more
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-border bg-card/85 p-8 shadow-[0_30px_120px_-45px_rgba(15,23,42,0.85)] backdrop-blur-xl">
            <div className="space-y-6">
              <div className="rounded-3xl bg-background/70 p-6 shadow-inner shadow-black/20">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Landing room preview</p>
                <h2 className="mt-4 text-2xl font-semibold text-white">Invite friends instantly</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Create a watch room, share a code, and keep everyone in sync with live chat and presence.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Rooms', value: 'Real-time membership' },
                  { label: 'Chat', value: 'Persistent and typing-aware' },
                ].map((feature) => (
                  <div key={feature.label} className="rounded-3xl border border-border bg-muted p-4">
                    <p className="text-sm font-medium text-muted-foreground">{feature.label}</p>
                    <p className="mt-2 text-base font-semibold text-white">{feature.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
