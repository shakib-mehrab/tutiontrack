import Link from 'next/link';
import { buttonClass } from '@/components/ui/styles';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-ground p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-[28px] bg-surface p-8 text-center shadow-[var(--shadow-card)]">
        <span className="text-5xl font-extrabold text-primary">404</span>
        <h1 className="text-xl font-extrabold">This page doesn’t exist</h1>
        <p className="text-sm text-muted">The link may be old or mistyped.</p>
        <Link href="/dashboard" className={buttonClass('primary', 'lg', 'mt-2 w-full')}>
          Go to TuitionTrack
        </Link>
      </div>
    </main>
  );
}
