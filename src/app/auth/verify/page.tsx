'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { ChevronLeft, Mail } from 'lucide-react';
import { Button, buttonClass, cn } from '@/components/ui/core';
import { FormError } from '@/components/ui/form';
import { errorMessage, send } from '@/lib/client/api';

const COOLDOWN = 60;

export default function VerifyPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 2)}•••@${domain}`;
}

function Verify() {
  const router = useRouter();
  const email = useSearchParams().get('email') ?? '';
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(COOLDOWN);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => refs.current[0]?.focus(), []);

  const code = digits.join('');

  const verify = async (value = code) => {
    if (value.length !== 6) return;
    setError(null);
    setBusy(true);
    try {
      await send('/api/auth/verify-otp', 'POST', { email, otp: value });
      router.replace(`/auth/signin?verified=1&email=${encodeURIComponent(email)}`);
    } catch (e) {
      setError(errorMessage(e));
      setDigits(Array(6).fill(''));
      refs.current[0]?.focus();
      setBusy(false);
    }
  };

  const setAt = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  };

  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length: 6 }, (_, i) => text[i] ?? '');
    setDigits(next);
    refs.current[Math.min(text.length, 5)]?.focus();
    if (text.length === 6) verify(text);
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      const res = await send<{ message?: string }>('/api/auth/resend-verification', 'POST', { email });
      setInfo(res.message ?? 'A new code is on its way.');
      setWait(COOLDOWN);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ground px-6 pt-[max(24px,env(safe-area-inset-top))] lg:items-center lg:justify-center">
      <div className="pb-safe mx-auto flex w-full max-w-md flex-1 flex-col gap-6 pb-8 lg:flex-none lg:rounded-[32px] lg:bg-surface lg:p-10 lg:shadow-[var(--shadow-card)]">
        <Link href="/auth/signin" aria-label="Back to sign in" className={buttonClass('outline', 'icon', 'border-0 bg-surface lg:bg-mist')}>
          <ChevronLeft className="h-5 w-5 text-ink" aria-hidden />
        </Link>

        <div className="flex flex-col items-center gap-3.5 pt-6 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-[32px] bg-surface text-primary shadow-[0_14px_30px_rgba(84,104,240,0.18)]">
            <Mail className="h-11 w-11" strokeWidth={1.8} aria-hidden />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Check your email</h1>
          <p className="max-w-[30ch] text-sm leading-relaxed text-muted">
            We sent a 6-digit code to <strong className="text-ink">{maskEmail(email) || 'your email'}</strong>. It expires in 10 minutes.
          </p>
        </div>

        <fieldset>
          <legend className="sr-only">Verification code</legend>
          <div className="grid grid-cols-6 gap-2" onPaste={onPaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                aria-label={`Digit ${i + 1}`}
                value={d}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                className={cn(
                  'h-14 min-w-0 rounded-[14px] border-[1.5px] bg-surface text-center text-[22px] font-extrabold text-ink outline-none transition-colors',
                  'focus:border-2 focus:border-primary focus:ring-4 focus:ring-primary-soft',
                  d ? 'border-primary-line' : 'border-line'
                )}
              />
            ))}
          </div>
        </fieldset>

        <FormError>{error}</FormError>
        {info ? <p className="rounded-2xl bg-mint-soft px-4 py-3 text-sm font-semibold text-mint-ink">{info}</p> : null}

        <div className="flex-1" />

        <Button size="lg" loading={busy} disabled={code.length !== 6 || !email} onClick={() => verify()}>
          Verify email
        </Button>
        <p className="text-center text-sm text-muted">
          Didn’t get it?{' '}
          {wait > 0 ? (
            <span className="font-bold text-primary-deep">Resend in 0:{String(wait).padStart(2, '0')}</span>
          ) : (
            <button type="button" onClick={resend} className="font-bold text-primary">
              Resend code
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
