import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Monitor, Settings, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-12 bg-background text-foreground transition-colors duration-500 p-6">

      {/* Hero / Header */}
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-6xl font-bold tracking-tighter sm:text-7xl">
          Simple Reminder
        </h1>
        <p className="text-xl text-muted-foreground font-medium uppercase tracking-widest">
          High-Visibility Display System
        </p>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl">

        {/* Display Card */}
        <Link href="/display" className="group relative overflow-hidden rounded-[2rem] border-4 border-neutral-200 dark:border-neutral-800 bg-card p-8 transition-all hover:scale-105 hover:border-black dark:hover:border-white">
          <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-foreground">
              <Monitor className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Display Mode</h2>
              <p className="text-muted-foreground">Launch the full-screen reminder view for monitors.</p>
            </div>
          </div>
        </Link>

        {/* Admin Card */}
        <Link href="/admin/login" className="group relative overflow-hidden rounded-[2rem] border-4 border-neutral-200 dark:border-neutral-800 bg-card p-8 transition-all hover:scale-105 hover:border-black dark:hover:border-white">
          <div className="absolute inset-0 bg-neutral-100 dark:bg-neutral-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-foreground">
              <Settings className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Admin Panel</h2>
              <p className="text-muted-foreground">Manage schedule, warning rules, and app settings.</p>
            </div>
          </div>
        </Link>

      </div>

      <div className="absolute bottom-6 text-sm text-neutral-400 dark:text-neutral-600 uppercase tracking-widest">
        v1.0.0 &bull; Secure &bull; Fast
      </div>
    </div>
  );
}
