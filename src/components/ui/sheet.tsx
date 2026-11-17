'use client';

import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button, cn } from './core';

/**
 * Bottom sheet on phones, centered dialog on larger screens.
 * Closes on Escape and backdrop click; locks page scroll; returns focus on close.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button[data-autofocus]');
      (first ?? panelRef.current)?.focus();
    });
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-[rgba(20,22,60,0.45)]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full animate-sheet-up flex-col bg-surface outline-none',
          'rounded-t-[28px] sm:rounded-[28px]',
          size === 'lg' ? 'sm:max-w-xl' : 'sm:max-w-md'
        )}
      >
        <div className="mx-auto mt-3 h-[5px] w-10 shrink-0 rounded-full bg-line sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-5 pt-4 sm:px-6 sm:pt-6">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-[22px] font-extrabold tracking-tight">
              {title}
            </h2>
            {description ? <p className="text-sm text-muted">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose} className="bg-ground">
            <X className="h-[18px] w-[18px]" aria-hidden />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2 sm:px-6">{children}</div>
        {footer ? <div className="pb-safe flex flex-col gap-2 px-5 pt-3 sm:px-6 sm:pb-6">{footer}</div> : <div className="pb-safe" />}
      </div>
    </div>,
    document.body
  );
}

/** Yes/no confirmation built on Sheet. */
export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel,
  tone = 'primary',
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  tone?: 'primary' | 'danger';
  loading?: boolean;
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === 'danger' ? 'dark' : 'primary'}
            size="lg"
            onClick={onConfirm}
            loading={loading}
            data-autofocus
            className={tone === 'danger' ? 'bg-coral-ink hover:bg-coral-ink/90' : undefined}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-[15px] leading-relaxed text-body">{children}</div>
    </Sheet>
  );
}
