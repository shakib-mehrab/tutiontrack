import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoMark } from './logo';

/**
 * Phone: colour panel with shapes on top, white form sheet rising from the bottom.
 * Desktop: split screen — the colour panel on the left, the form on the right.
 */
export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-primary lg:flex-row">
      <div className="relative flex min-h-[260px] flex-1 overflow-hidden px-6 pt-[max(28px,env(safe-area-inset-top))] pb-10 text-white lg:min-h-dvh lg:max-w-[46%] lg:px-14 lg:py-14">
        <div aria-hidden className="absolute -top-16 -right-20 h-[260px] w-[260px] rounded-full bg-[#6A7CF4] lg:h-[420px] lg:w-[420px]" />
        <div aria-hidden className="absolute top-[130px] -left-10 h-[140px] w-[140px] rotate-[18deg] rounded-[40px] bg-coral lg:top-auto lg:bottom-24 lg:h-[200px] lg:w-[200px]" />
        <div aria-hidden className="absolute top-[70px] left-[190px] h-[70px] w-[70px] rounded-full bg-primary-line lg:top-40 lg:left-[60%]" />
        <div className="relative z-10 mt-auto flex flex-col gap-3 lg:mt-0 lg:h-full">
          <Link href="/" className="flex items-center gap-3 text-white no-underline" aria-label="TuitionTrack home">
            <LogoMark size={52} className="rounded-2xl bg-white [&_svg]:stroke-primary" />
            <span className="hidden text-xl font-extrabold lg:inline">TuitionTrack</span>
          </Link>
          <p className="text-[28px] leading-[1.15] font-extrabold tracking-tight lg:mt-auto lg:text-5xl">
            Every class counted.
            <br />
            Every month settled.
          </p>
        </div>
      </div>

      <main className="relative z-10 -mt-8 flex flex-col rounded-t-[32px] bg-surface px-6 pt-7 lg:mt-0 lg:flex-1 lg:items-center lg:justify-center lg:rounded-none lg:px-14">
        <div className="pb-safe flex w-full max-w-md flex-col gap-5 pb-8">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[22px] font-extrabold tracking-tight lg:text-[28px]">{title}</h1>
            {subtitle ? <p className="text-sm leading-relaxed text-muted">{subtitle}</p> : null}
          </div>
          {children}
          {footer ? <div className="text-center text-sm text-muted">{footer}</div> : null}
        </div>
      </main>
    </div>
  );
}
