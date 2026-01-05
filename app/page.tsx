import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Monitor, Settings } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-8 bg-slate-950 text-white">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-blue-500">P&S Reminder App</h1>
        <p className="text-slate-400">Select an interface to continue</p>
      </div>

      <div className="flex gap-8">
        <Link href="/display">
          <Button variant="secondary" size="lg" className="h-32 w-48 flex flex-col gap-4 text-xl">
            <Monitor className="h-10 w-10" />
            Display
          </Button>
        </Link>

        <Link href="/admin/login">
          <Button variant="outline" size="lg" className="h-32 w-48 flex flex-col gap-4 text-xl border-slate-700 hover:bg-slate-900 text-slate-300">
            <Settings className="h-10 w-10" />
            Admin
          </Button>
        </Link>
      </div>
    </div>
  );
}
