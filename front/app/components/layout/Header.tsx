'use client';

import Link from 'next/link';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 bg-white"
      style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 'var(--container-padding)',
        paddingRight: 'var(--container-padding)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {/* 모바일 메뉴 버튼 */}
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{
            fontSize: '18px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 'var(--space-1)',
          }}
        >
          ☰
        </button>
        <Link href="/" className="text-xl font-bold">
          Portfolio
        </Link>
      </div>
      <Link
        href="/"
        className="text-sm hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Home
      </Link>
    </header>
  );
}

