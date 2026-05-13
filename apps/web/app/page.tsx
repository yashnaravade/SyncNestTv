import { Button } from '../components/ui/button';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <section className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">StreamTogether</h1>
          <p className="mt-4 text-lg text-slate-300">
            Self-hosted watch-together experience built on a monorepo foundation.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl shadow-slate-950/20">
          <p className="mb-4 text-slate-300">Your platform skeleton is ready. Start building the Web and API apps from here.</p>
          <Button>Launch app shell</Button>
        </div>
      </section>
    </main>
  );
}
