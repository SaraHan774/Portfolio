'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Z_INDEX } from '@/core/constants';

interface HomeIconProps {
  defaultIconUrl: string;
  hoverIconUrl: string;
  size?: number; // 아이콘 크기 (px, 기본값 48)
  onReset?: () => void; // 선택 상태 초기화 콜백
}

/**
 * 홈 아이콘 컴포넌트
 * - 웹/태블릿 화면 (md 이상, 768px+)에서만 표시
 * - 호버 시 다른 이미지 표시
 * - 클릭 시 홈으로 이동 및 선택 상태 초기화
 */
const HomeIcon = memo(function HomeIcon({ defaultIconUrl, hoverIconUrl, size = 48, onReset }: HomeIconProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    // 선택 상태 초기화
    onReset?.();
    // 홈으로 이동
    router.push('/');
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="hidden md:block fixed top-8 left-1/2 transform -translate-x-1/2 cursor-pointer transition-opacity duration-200 hover:opacity-90"
      aria-label="홈으로 이동"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        zIndex: Z_INDEX.HOME_ICON,
      }}
    >
      <div className="relative w-full h-full">
        <Image
          src={isHovered ? hoverIconUrl : defaultIconUrl}
          alt="홈 아이콘"
          fill
          className="object-contain"
          priority
        />
      </div>
    </button>
  );
});

export default HomeIcon;
