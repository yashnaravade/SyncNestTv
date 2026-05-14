'use client';

import type { ReactNode } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SiteNav } from '@/components/SiteNav';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-violet-950/20 text-slate-100">
        <SiteNav />
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
