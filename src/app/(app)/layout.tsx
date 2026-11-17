import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AppShell } from '@/components/app-shell';

// Everything inside (app) needs a signed-in user; the shell adapts to the role.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/auth/signin');

  return (
    <AppShell role={session.user.role} name={session.user.name ?? 'You'}>
      {children}
    </AppShell>
  );
}
