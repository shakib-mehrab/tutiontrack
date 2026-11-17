'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { buttonClass, cn } from './styles';
import type { Size, Variant } from './styles';

export { buttonClass, cn };

type ButtonProps = ComponentProps<'button'> & { variant?: Variant; size?: Size; loading?: boolean };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClass(variant, size, className)} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/* ---------- Card ---------- */

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return <div className={cn('bg-surface rounded-[var(--radius-card)] shadow-[var(--shadow-card)]', className)} {...rest} />;
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-3', className)}>
      <h2 className="text-lg font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

/* ---------- Badge ---------- */

type Tone = 'primary' | 'coral' | 'mint' | 'neutral' | 'dark';
const tones: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary-deep',
  coral: 'bg-coral-soft text-coral-ink',
  mint: 'bg-mint-soft text-mint-ink',
  neutral: 'bg-mist text-muted',
  dark: 'bg-ink text-white',
};

export function Badge({ tone = 'primary', className, ...rest }: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap', tones[tone], className)}
      {...rest}
    />
  );
}

/* ---------- Progress ring ---------- */

export function Ring({
  value,
  size = 72,
  stroke = 8,
  label,
  track = 'var(--color-primary-soft)',
  color = 'var(--color-primary)',
  className,
  labelClassName,
}: {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: ReactNode;
  track?: string;
  color?: string;
  className?: string;
  labelClassName?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${v * c} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 400ms ease' }}
        />
      </svg>
      {label !== undefined ? (
        <span className={cn('absolute inset-0 grid place-items-center font-extrabold', labelClassName)}>{label}</span>
      ) : null}
    </div>
  );
}

export function Bar({ value, className, fill = 'bg-primary', track = 'bg-ground' }: { value: number; className?: string; fill?: string; track?: string }) {
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full', track, className)}>
      <div className={cn('h-full rounded-full transition-[width] duration-500', fill)} style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

/* ---------- Subject tile ---------- */

const tileTones = [
  'bg-primary-soft text-primary-deep',
  'bg-coral-soft text-coral-ink',
  'bg-mint-soft text-mint-ink',
  'bg-[#EDE7FB] text-[#4B2F94]',
  'bg-[#FFF1D6] text-[#7A4A00]',
];

export function toneFor(seed: string): string {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tileTones[h % tileTones.length];
}

export function Tile({ text, seed, className }: { text: string; seed: string; className?: string }) {
  return (
    <div aria-hidden className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-[14px] text-[13px] font-extrabold', toneFor(seed), className)}>
      {text}
    </div>
  );
}

/* ---------- Skeleton & empty state ---------- */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[var(--radius-card)] bg-line-soft/70', className)} />;
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {icon ? <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">{icon}</div> : null}
      <h3 className="text-base font-extrabold">{title}</h3>
      {children ? <p className="max-w-[36ch] text-sm leading-relaxed text-muted">{children}</p> : null}
      {action}
    </Card>
  );
}
