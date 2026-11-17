import { cn } from '@/components/ui/styles';

export function LogoMark({ className, size = 38 }: { className?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center rounded-xl bg-primary', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.53} height={size * 0.53} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="m9 10 2 2 4-4" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[17px] font-extrabold">TuitionTrack</span>
    </span>
  );
}
