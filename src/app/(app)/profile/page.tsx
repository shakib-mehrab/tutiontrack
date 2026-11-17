'use client';

import { signOut, useSession } from 'next-auth/react';
import { LogOut } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { InstallCard } from '@/components/pwa';
import { Badge, Button, Card } from '@/components/ui/core';
import { initials } from '@/lib/client/format';

export default function ProfilePage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <PageHeader title="Profile" />
      <Card className="flex items-center gap-4 rounded-[var(--radius-panel)] p-5">
        <span aria-hidden className="grid h-16 w-16 place-items-center rounded-[20px] bg-ink text-xl font-extrabold text-white">
          {initials(user?.name)}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-lg font-extrabold">{user?.name}</span>
          <span className="truncate text-sm text-muted">{user?.email}</span>
          <Badge className="self-start">{user?.role === 'teacher' ? 'Teacher account' : 'Student account'}</Badge>
        </div>
      </Card>

      <InstallCard dismissible={false} />

      <Button variant="outline" size="lg" onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
        <LogOut className="h-5 w-5" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}
