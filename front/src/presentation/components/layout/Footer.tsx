'use client';

import {useSiteSettings} from '@/domain';

export default function Footer() {
    const {data: settings} = useSiteSettings();

    return (
        <footer
            style={{
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',   // 오른쪽 정렬
                paddingRight: 'var(--space-6)',
                paddingBottom: 'var(--space-4)', // 원하면
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
            }}
        >
            {settings?.footerText || ''}
        </footer>
    );
}
