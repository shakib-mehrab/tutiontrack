'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { BookOpen, CalendarDays, CreditCard, Home, Plus, Users } from 'lucide-react';
import { cn } from '@/components/ui/core';
import { initials } from '@/lib/client/format';
import { LogClassProvider, useLogClass } from './log-class';
import { Logo } from './logo';

type Role = 'teacher' | 'student';
type NavItem = { href: string; label: string; icon: typeof Home };

const NAV: Record<Role, NavItem[]> = {
  teacher: [
    { href: '/dashboard', label: 'Today', icon: CalendarDays },
    { href: '/tuitions', label: 'Tuitions', icon: Users },
    { href: '/homework', label: 'Homework', icon: BookOpen },
    { href: '/payments', label: 'Payments', icon: CreditCard },
  ],
  student: [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/tuitions', label: 'Classes', icon: CalendarDays },
    { href: '/homework', label: 'Homework', icon: BookOpen },
    { href: '/payments', label: 'Fees', icon: CreditCard },
  ],
};

function isActive(pathname: string, href: string) {
  return href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(href + '/');
}

export function AppShell({ role, name, children }: { role: Role; name: string; children: ReactNode }) {
  return (
    <LogClassProvider enabled={role === 'teacher'}>
      <div className="min-h-dvh lg:pl-[248px]">
        <Sidebar role={role} name={name} />
        <main className="pb-tabbar mx-auto w-full max-w-[1240px] px-5 pt-[max(20px,env(safe-area-inset-top))] sm:px-8 lg:px-10 lg:pt-8 lg:pb-12">
          {children}
        </main>
        <TabBar role={role} />
      </div>
    </LogClassProvider>
  );
}

function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col gap-7 border-r border-line-soft bg-surface px-[18px] py-7 lg:flex">
      <Link href="/dashboard" className="px-2 text-ink no-underline">
        <Logo />
      </Link>
      <nav aria-label="Main" className="flex flex-col gap-1">
        {NAV[role].map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-11 items-center gap-3 rounded-xl px-3 text-sm no-underline transition-colors',
                active ? 'bg-primary-soft font-bold text-primary-deep' : 'font-semibold text-muted hover:bg-mist hover:text-ink'
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.2 : 2} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
      {role === 'teacher' ? <SidebarLogButton /> : null}
      <Link
        href="/profile"
        aria-current={isActive(pathname, '/profile') ? 'page' : undefined}
        className="mt-auto flex items-center gap-2.5 rounded-2xl bg-mist p-3 text-ink no-underline hover:bg-line-soft/60"
      >
        <span aria-hidden className="grid h-[38px] w-[38px] place-items-center rounded-xl bg-ink text-[13px] font-extrabold text-white">
          {initials(name)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-bold">{name}</span>
          <span className="text-xs text-muted">{role === 'teacher' ? 'Teacher' : 'Student'}</span>
        </span>
      </Link>
    </aside>
  );
}

function SidebarLogButton() {
  const { open } = useLogClass();
  return (
    <button
      type="button"
      onClick={() => open()}
      className="flex h-11 items-center justify-center gap-2 rounded-[14px] bg-primary text-sm font-bold text-white shadow-[var(--shadow-float)] hover:bg-primary-hover"
    >
      <Plus className="h-[18px] w-[18px]" strokeWidth={2.6} aria-hidden />
      Log a class
    </button>
  );
}

function TabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const { open } = useLogClass();
  const items = NAV[role];
  const teacher = role === 'teacher';
  const cells: (NavItem | 'fab')[] = teacher ? [items[0], items[1], 'fab', items[2], items[3]] : [...items];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid items-center rounded-t-[28px] bg-surface px-2 pt-2 shadow-[var(--shadow-bar)] lg:hidden"
      style={{
        gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {cells.map((cell) =>
        cell === 'fab' ? (
          <div key="fab" className="grid place-items-center">
            <button
              type="button"
              onClick={() => open()}
              aria-label="Log a class"
              className="-mt-9 grid h-[60px] w-[60px] place-items-center rounded-[20px] border-[5px] border-ground bg-primary text-white shadow-[0_12px_24px_rgba(84,104,240,0.4)] active:scale-95"
            >
              <Plus className="h-[26px] w-[26px]" strokeWidth={2.6} aria-hidden />
            </button>
          </div>
        ) : (
          <TabLink key={cell.href} item={cell} active={isActive(pathname, cell.href)} />
        )
      )}
    </nav>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-h-[52px] flex-col items-center justify-center gap-1 text-[11px] no-underline',
        active ? 'font-bold text-primary' : 'font-semibold text-muted'
      )}
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.2 : 2} aria-hidden />
      {item.label}
    </Link>
  );
}

/** Page header used by every screen: title, optional subtitle and actions. */
export function PageHeader({
  title,
  eyebrow,
  actions,
  back,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {back}
        <div className="flex min-w-0 flex-col gap-0.5">
          {eyebrow ? <span className="text-[13px] font-medium text-muted lg:text-sm lg:font-semibold">{eyebrow}</span> : null}
          <h1 className="truncate text-2xl font-extrabold tracking-tight lg:text-[30px]">{title}</h1>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

/** Avatar button to /profile, shown in the phone header (desktop has it in the sidebar). */
export function ProfileLink({ name }: { name: string }) {
  return (
    <Link
      href="/profile"
      aria-label="Profile"
      className="grid h-11 w-11 place-items-center rounded-[14px] bg-surface text-sm font-extrabold text-ink no-underline shadow-[var(--shadow-card)] lg:hidden"
    >
      {initials(name)}
    </Link>
  );
}
