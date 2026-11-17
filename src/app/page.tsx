import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { BookOpen, Check, CreditCard } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { Logo } from '@/components/logo';
import { buttonClass } from '@/components/ui/styles';

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect('/dashboard');

  return (
    <div className="min-h-dvh bg-ground px-4 pt-[max(16px,env(safe-area-inset-top))] sm:px-6 sm:pt-6">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-16 lg:gap-[72px]">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-surface py-3 pr-3.5 pl-5 shadow-[var(--shadow-card)]">
          <Logo />
          <nav aria-label="Main" className="flex flex-wrap items-center gap-1.5">
            <a href="#features" className="hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted no-underline hover:bg-mist sm:inline">
              Features
            </a>
            <a href="#how" className="hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted no-underline hover:bg-mist sm:inline">
              How it works
            </a>
            <Link href="/auth/signin" className="rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink no-underline hover:bg-mist">
              Sign in
            </Link>
            <Link href="/auth/register" className={buttonClass('primary', 'md', 'shadow-none')}>
              Get started
            </Link>
          </nav>
        </header>

        <section className="flex flex-wrap items-center gap-12">
          <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-5">
            <span className="self-start rounded-full bg-primary-soft px-3 py-2 text-[13px] font-bold text-primary-deep">For private tutors and their students</span>
            <h1 className="text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.05] font-extrabold tracking-[-0.03em]">
              Every class counted.
              <br />
              <span className="text-primary">Every month settled.</span>
            </h1>
            <p className="max-w-[44ch] text-lg leading-relaxed text-body">
              Log a class in one tap, see who’s on track this month, keep each month’s record and fee status, and share homework with your students.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/auth/register" className={buttonClass('primary', 'lg')}>
                Create a free account
              </Link>
              <Link href="/auth/signin" className={buttonClass('outline', 'lg', 'text-ink')}>
                Sign in
              </Link>
            </div>
            <span className="text-[13px] text-muted">Works in the browser. Add it to your home screen to use it like an app.</span>
          </div>

          <div aria-hidden className="relative grid min-h-[520px] flex-[1_1_380px] place-items-center">
            <div className="absolute h-[360px] w-[360px] rounded-full bg-[#DCE1FB]" />
            <div className="absolute top-10 right-10 h-[120px] w-[120px] rotate-[14deg] rounded-[36px] bg-coral" />
            <div className="absolute bottom-[60px] left-[50px] h-16 w-16 rounded-full bg-primary" />
            <div className="relative w-[270px] rounded-[36px] bg-surface p-3.5 shadow-[0_30px_60px_rgba(48,56,140,0.2)]">
              <div className="flex flex-col gap-3 rounded-[26px] bg-ground px-3.5 py-[18px]">
                <span className="text-base font-extrabold">Hi, Rafi</span>
                <div className="flex flex-col gap-1 rounded-[18px] bg-primary p-3.5 text-white">
                  <span className="text-[11px] font-semibold text-primary-soft">This month so far</span>
                  <span className="text-[17px] font-extrabold">38 of 52 classes</span>
                  <div className="h-[5px] rounded-full bg-white/25">
                    <div className="h-full w-[73%] rounded-full bg-white" />
                  </div>
                </div>
                <div className="flex flex-col gap-2.5 rounded-2xl bg-surface p-3">
                  <span className="text-[13px] font-bold">Physics · Ayesha</span>
                  <span className="grid h-9 place-items-center rounded-[11px] bg-primary text-xs font-bold text-white">Mark class done</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-surface p-3">
                  <span className="text-[13px] font-bold">October fee</span>
                  <span className="rounded-full bg-coral-soft px-2 py-1 text-[11px] font-bold text-coral-ink">Due</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="flex scroll-mt-6 flex-col gap-6">
          <h2 className="text-[32px] font-extrabold tracking-tight">Built around how tuition actually works</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[18px]">
            <Feature icon={<Check className="h-[22px] w-[22px]" strokeWidth={2.4} />} tone="bg-primary-soft text-primary-deep" title="One-tap class logging">
              Today’s classes come from each tuition’s weekly days. Tap “done” when you finish, or log a make-up class for any date.
            </Feature>
            <Feature icon={<CreditCard className="h-[22px] w-[22px]" />} tone="bg-coral-soft text-coral-ink" title="Months and fees, kept">
              Close a month and its record stays: classes taken against planned, and whether the fee is paid. Share a payment slip in one tap.
            </Feature>
            <Feature icon={<BookOpen className="h-[22px] w-[22px]" />} tone="bg-mint-soft text-mint-ink" title="Homework, together">
              Assign work with a due date. Your student sees it in their own app and can ask questions right on the task.
            </Feature>
          </div>
        </section>

        <section id="how" className="flex scroll-mt-6 flex-col gap-7 rounded-[32px] bg-ink p-8 text-white sm:p-10">
          <h2 className="text-[30px] font-extrabold tracking-tight">Set up in three steps</h2>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6 p-0">
            {[
              ['Create your account', 'Sign up as a teacher and verify your email with a 6-digit code.'],
              ['Add a tuition', 'Pick the subject, class days, time and monthly fee. Link your student by email.'],
              ['Log as you teach', 'Tap done after each class. Close the month and mark the fee paid.'],
            ].map(([title, body], i) => (
              <li key={title} className="flex flex-col gap-2.5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary font-extrabold">{i + 1}</span>
                <span className="text-[17px] font-bold">{title}</span>
                <span className="text-sm leading-relaxed text-primary-line">{body}</span>
              </li>
            ))}
          </ol>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 border-t border-line pt-6 pb-8 text-[13px] text-muted">
          <span>TuitionTrack</span>
          <span>Made for tutors and students.</span>
        </footer>
      </div>
    </div>
  );
}

function Feature({ icon, tone, title, children }: { icon: React.ReactNode; tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-surface p-6">
      <div aria-hidden className={`grid h-12 w-12 place-items-center rounded-[14px] ${tone}`}>
        {icon}
      </div>
      <h3 className="text-[19px] font-extrabold">{title}</h3>
      <p className="text-[15px] leading-relaxed text-body">{children}</p>
    </div>
  );
}
