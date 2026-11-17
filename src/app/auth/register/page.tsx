'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { GraduationCap, Presentation } from 'lucide-react';
import { AuthLayout } from '@/components/auth-layout';
import { Button, cn } from '@/components/ui/core';
import { Field, FormError, Input } from '@/components/ui/form';
import { errorMessage, send } from '@/lib/client/api';

type Role = 'teacher' | 'student';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('teacher');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('Add your name');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    setBusy(true);
    try {
      await send('/api/auth/register', 'POST', { name: name.trim(), email: email.trim(), password, role });
      router.push(`/auth/verify?email=${encodeURIComponent(email.trim())}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link href="/auth/signin" className="font-bold no-underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="mb-2 text-[13px] font-bold text-muted">I am a…</legend>
          <RoleCard active={role === 'teacher'} onClick={() => setRole('teacher')} icon={<Presentation className="h-6 w-6" aria-hidden />} title="Teacher">
            I give tuition
          </RoleCard>
          <RoleCard active={role === 'student'} onClick={() => setRole('student')} icon={<GraduationCap className="h-6 w-6" aria-hidden />} title="Student">
            I take tuition
          </RoleCard>
        </fieldset>
        <Field label="Full name">
          {(id) => <Input id={id} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-mist" />}
        </Field>
        <Field label="Email">
          {(id) => (
            <Input id={id} type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-mist" />
          )}
        </Field>
        <Field label="Password" hint="At least 8 characters">
          {(id, describedBy) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-mist"
            />
          )}
        </Field>
        <FormError>{error}</FormError>
        <Button type="submit" size="lg" loading={busy} disabled={!email || !password || !name}>
          Create account
        </Button>
        <p className="text-center text-xs text-muted">We’ll email you a 6-digit code to verify your address.</p>
      </form>
    </AuthLayout>
  );
}

function RoleCard({ active, onClick, icon, title, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-colors',
        active ? 'bg-primary-soft text-primary-deep outline-2 outline-primary' : 'bg-mist text-ink hover:bg-line-soft/60'
      )}
    >
      {icon}
      <span className="text-[15px] font-extrabold">{title}</span>
      <span className="text-xs text-muted">{children}</span>
    </button>
  );
}
