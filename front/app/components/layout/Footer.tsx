'use client';

import { useEffect, useState } from 'react';
import { getSiteSettings } from '@/lib/services/settingsService';

export default function Footer() {
  const [footerText, setFooterText] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSiteSettings();
      setFooterText(settings.footerText);
    };
    loadSettings();
  }, []);

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
      {footerText}
    </footer>
  );
}
