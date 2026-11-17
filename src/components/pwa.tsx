'use client';

import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button, Card } from '@/components/ui/core';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Registers /sw.js in production builds. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);
  return null;
}

let deferred: BeforeInstallPromptEvent | null = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
  });
}

function isStandalone() {
  return (
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIOS() {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** "Install the app" card. Hidden once installed or dismissed. */
export function InstallCard({ dismissible = true }: { dismissible?: boolean }) {
  const [state, setState] = useState<'hidden' | 'prompt' | 'ios'>('hidden');

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = dismissible && localStorage.getItem('tt-install-dismissed') === '1';
    } catch {
      // storage unavailable
    }
    if (dismissed || isStandalone()) return;
    const check = () => setState(deferred ? 'prompt' : isIOS() ? 'ios' : 'hidden');
    check();
    window.addEventListener('beforeinstallprompt', check);
    return () => window.removeEventListener('beforeinstallprompt', check);
  }, [dismissible]);

  if (state === 'hidden') return null;

  const dismiss = () => {
    try {
      localStorage.setItem('tt-install-dismissed', '1');
    } catch {
      // ignore
    }
    setState('hidden');
  };

  return (
    <Card className="flex items-center gap-3.5 p-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-primary-soft text-primary">
        <Download className="h-[22px] w-[22px]" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-bold">Install TuitionTrack</span>
        <span className="text-[13px] text-muted">
          {state === 'ios' ? (
            <>
              Tap <Share className="inline h-3.5 w-3.5 align-[-2px]" aria-label="Share" /> then “Add to Home Screen”.
            </>
          ) : (
            'Open it from your home screen like any app.'
          )}
        </span>
      </div>
      {state === 'prompt' ? (
        <Button
          size="sm"
          onClick={async () => {
            await deferred?.prompt();
            const choice = await deferred?.userChoice;
            deferred = null;
            if (choice?.outcome === 'accepted') setState('hidden');
          }}
        >
          Install
        </Button>
      ) : null}
      {dismissible ? (
        <Button variant="ghost" size="icon-sm" aria-label="Dismiss" onClick={dismiss}>
          <X className="h-4 w-4" aria-hidden />
        </Button>
      ) : null}
    </Card>
  );
}
