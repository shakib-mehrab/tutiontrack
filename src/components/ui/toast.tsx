'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from './core';

type ToastInput = {
  message: string;
  tone?: 'success' | 'error' | 'info';
  action?: { label: string; onClick: () => void };
  duration?: number;
};
type ToastItem = ToastInput & { id: number };

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const push = useCallback((t: ToastInput) => {
    const id = nextId.current++;
    setItems((xs) => [...xs.slice(-2), { ...t, id }]);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(104px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-8"
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ item, onDone }: { item: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const ms = item.duration ?? (item.action ? 10_000 : 3_500);
    const timer = setTimeout(onDone, ms);
    return () => clearTimeout(timer);
  }, [item, onDone]);

  const error = item.tone === 'error';
  return (
    <div
      role={error ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm animate-toast-in items-center gap-3 rounded-2xl px-4 py-3 shadow-[0_14px_30px_rgba(20,22,60,0.25)]',
        error ? 'bg-coral-ink text-white' : 'bg-ink text-white'
      )}
    >
      {error ? <AlertCircle className="h-5 w-5 shrink-0" aria-hidden /> : <Check className="h-5 w-5 shrink-0 text-[#9FE3CC]" aria-hidden />}
      <span className="flex-1 text-sm font-semibold">{item.message}</span>
      {item.action ? (
        <button
          type="button"
          onClick={() => {
            item.action!.onClick();
            onDone();
          }}
          className="rounded-lg px-2 py-1 text-sm font-extrabold text-[#AEB9FF] hover:bg-white/10"
        >
          {item.action.label}
        </button>
      ) : null}
    </div>
  );
}
