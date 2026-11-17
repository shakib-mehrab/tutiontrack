'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Button } from '@/components/ui/core';
import { Field, FormError, Input } from '@/components/ui/form';

const MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Wrong email or password.',
  CredentialsSignin: 'Wrong email or password.',
  USER_NOT_FOUND: 'No account found with this email.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait a few minutes and try again.',
};

export default function SignInPage() {
  return (
    <Suspense>
      <SignIn />
    </Suspense>
  );
}

function SignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);
  const verified = params.get('verified') === '1';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnverified(false);
    setBusy(true);
    try {
      const res = await signIn('credentials', { email: email.trim(), password, redirect: false });
      if (res?.error) {
        if (res.error === 'UNVERIFIED_EMAIL') {
          setUnverified(true);
          setError('Please verify your email first.');
        } else {
          setError(MESSAGES[res.error] ?? 'Could not sign in. Please try again.');
        }
        return;
      }
      const next = params.get('callbackUrl');
      router.replace(next && next.startsWith('/') ? next : '/dashboard');
      router.refresh();
    } catch {
      setError('Could not sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verifyNow = async () => {
    // Send a fresh code (the API answers the same whether or not the account exists).
    await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    }).catch(() => {});
    router.push(`/auth/verify?email=${encodeURIComponent(email.trim())}`);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={verified ? 'Your email is verified. Sign in to get started.' : undefined}
      footer={
        <>
          New to TuitionTrack?{' '}
          <Link href="/auth/register" className="font-bold no-underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Email">
          {(id) => (
            <Input id={id} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-mist" />
          )}
        </Field>
        <Field label="Password">
          {(id) => (
            <div className="relative flex">
              <Input
                id={id}
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-mist pr-12"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                className="absolute top-0.5 right-1 grid h-11 w-11 place-items-center text-muted"
              >
                {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          )}
        </Field>
        {error ? (
          <FormError>
            {error}
            {unverified ? (
              <>
                {' '}
                <button type="button" onClick={verifyNow} className="font-extrabold underline">
                  Send me a code
                </button>
              </>
            ) : null}
          </FormError>
        ) : null}
        <Button type="submit" size="lg" loading={busy} disabled={!email || !password} className="mt-1">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
