'use client';

import { useSiteSettings } from '@/domain';

export default function Footer() {
  const { data: settings } = useSiteSettings();

  return (
    <footer
      style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-muted)',
      }}
    >
      {settings?.footerText || ''}
    </footer>
  );
}
