'use client';

import { SessionProvider } from 'next-auth/react';
import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { ServiceWorker } from '@/components/pwa';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <SWRConfig value={{ revalidateOnFocus: true, dedupingInterval: 4_000 }}>
        <ToastProvider>
          {children}
          <ServiceWorker />
        </ToastProvider>
      </SWRConfig>
    </SessionProvider>
  );
}
