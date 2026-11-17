'use client';

import { forwardRef, useId } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from './core';
import { WEEKDAY_LETTER, WEEKDAY_SHORT } from '@/lib/client/format';

export const inputClass =
  'h-12 w-full min-w-0 rounded-[14px] border-[1.5px] border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted/70 ' +
  'outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary-soft aria-[invalid=true]:border-coral-strong';

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: (id: string, describedBy?: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[13px] font-bold text-muted">
        {label}
      </label>
      {children(id, hint || error ? msgId : undefined)}
      {error ? (
        <p id={msgId} className="text-xs font-semibold text-coral-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(inputClass, className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(inputClass, 'h-auto min-h-24 py-3 leading-relaxed', className)} {...rest} />;
});

export function Select({ className, ...rest }: ComponentProps<'select'>) {
  return <select className={cn(inputClass, 'appearance-none bg-[length:16px] pr-9', className)} {...rest} />;
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-2xl bg-coral-soft px-4 py-3 text-sm font-semibold text-coral-ink">
      {children}
    </div>
  );
}

/** Seven toggle buttons, Sunday first. */
export function WeekdayPicker({ value, onChange, label = 'Class days' }: { value: number[]; onChange: (v: number[]) => void; label?: string }) {
  const toggle = (d: number) => onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b));
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[13px] font-bold text-muted">{label}</legend>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LETTER.map((letter, d) => {
          const on = value.includes(d);
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              aria-label={WEEKDAY_SHORT[d]}
              onClick={() => toggle(d)}
              className={cn(
                'h-11 rounded-xl text-[13px] transition-colors',
                on ? 'bg-primary font-bold text-white' : 'bg-ground font-semibold text-muted hover:bg-line-soft'
              )}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Pill-style segmented control / tabs. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('grid gap-1 rounded-[14px] bg-[#DFE4F8] p-1', className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-[38px] rounded-[11px] px-2 text-[13px] transition-colors',
              on ? 'bg-surface font-bold text-ink shadow-[0_2px_6px_rgba(48,56,140,0.10)]' : 'font-semibold text-muted hover:text-ink'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Row of choice chips (single select). */
export function Chips<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-9 rounded-full px-4 text-[13px] transition-colors',
              on ? 'bg-ink font-bold text-white' : 'bg-surface font-semibold text-ink hover:bg-mist'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
