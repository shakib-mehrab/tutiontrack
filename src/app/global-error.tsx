'use client';

import { useEffect } from 'react';

// Replaces the root layout when it crashes, so it can't rely on globals.css: inline styles only.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  const button: React.CSSProperties = {
    height: 50,
    borderRadius: 16,
    border: 0,
    font: 'inherit',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
  };

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
          background: '#EEF1FB',
          color: '#1E2048',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <main style={{ maxWidth: 380, width: '100%', background: '#fff', borderRadius: 28, padding: 28, textAlign: 'center' }}>
          <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ margin: '0 0 24px', color: '#4A5078', lineHeight: 1.5 }}>The page hit an unexpected error. Try again, or go back to the start.</p>
          <div style={{ display: 'grid', gap: 10 }}>
            <button onClick={reset} style={{ ...button, background: '#5468F0', color: '#fff' }}>
              Try again
            </button>
            {/* A full page load is intended here: the root layout is broken. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ ...button, background: '#F6F7FD', color: '#1E2048', display: 'grid', placeItems: 'center', textDecoration: 'none' }}>
              Go to start
            </a>
          </div>
          {process.env.NODE_ENV === 'development' ? (
            <pre style={{ marginTop: 20, textAlign: 'left', fontSize: 11, color: '#9E3020', whiteSpace: 'pre-wrap' }}>{error.message}</pre>
          ) : null}
        </main>
      </body>
    </html>
  );
}
