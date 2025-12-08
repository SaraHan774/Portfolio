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
        justifyContent: 'flex-end',
        paddingLeft: 'var(--container-padding)',
        paddingRight: 'var(--container-padding)',
      }}
    >
      {/* 모바일 메뉴 버튼 - 좌측에 유지 */}
      <button
        onClick={onMenuClick}
        className="lg:hidden"
        style={{
          position: 'absolute',
          left: 'var(--container-padding)',
          fontSize: '18px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 'var(--space-1)',
        }}
      >
        ☰
      </button>

      {/* 홈 아이콘 - 우측 상단 */}
      <Link
        href="/"
        className="hover:opacity-70 transition-opacity"
        style={{
          color: 'var(--color-text-primary)',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="홈으로 이동"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </Link>
    </header>
  );
}

