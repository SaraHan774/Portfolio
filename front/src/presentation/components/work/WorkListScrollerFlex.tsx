'use client';

import {useState, useRef, useEffect} from 'react';
import {useWorkListScroll} from '@/domain';
import type {Work} from '@/types';
import WorkTitleButton from './WorkTitleButton';

interface WorkListScrollerProps {
    works: Work[];
    selectedWorkId: string | null;
    onWorkSelect: (workId: string) => void;
    showThumbnail: boolean;
    direction?: 'ltr' | 'rtl';
    hideOverflowIndicators?: boolean; // 모바일에서 overflow indicator 숨김
    fullWidth?: boolean; // 모바일에서 화면 전체 너비 사용
}

/**
 * Horizontal scrollable work list with scroll indicators
 *
 * Features:
 * - Left/right scroll indicators using flexbox layout
 * - Fading edges on overflow
 * - Supports both LTR and RTL directions
 * - Thumbnail visibility control on hover with delay
 */
export default function WorkListScroller({
                                             works,
                                             selectedWorkId,
                                             onWorkSelect,
                                             showThumbnail,
                                             direction = 'ltr',
                                             hideOverflowIndicators = false,
                                             fullWidth = false,
                                         }: WorkListScrollerProps) {
    const {scrollContainerRef, showLeftArrow, showRightArrow, scroll} = useWorkListScroll({
        direction,
        itemCount: works.length,
    });

    const [isMouseInContainer, setIsMouseInContainer] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const anyWorkHovered = showThumbnail || isMouseInContainer;

    // Client-side mount state (for hydration-safe debug labels)
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    // Debug mode (development only)
    const isDebugMode = process.env.NODE_ENV === 'development';

    // Delayed mouse leave to prevent flickering
    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setIsMouseInContainer(false);
        }, 200);
    };

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setIsMouseInContainer(true);
    };

    // Cleanup timeout on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                justifyContent: direction === 'ltr' ? 'flex-start' : 'flex-end',
                paddingLeft: fullWidth ? 'var(--category-margin-left)' : (direction === 'ltr' ? 'var(--category-margin-left)' : '0'),
                paddingRight: fullWidth ? 'var(--category-margin-right)' : (direction === 'rtl' ? 'var(--category-margin-right)' : '0'),
                ...(isDebugMode && {
                    backgroundColor: 'rgba(0, 0, 255, 0.1)', // 파란색 반투명
                    border: '1px dashed blue',
                }),
                position: 'relative',
            }}
        >
            {/* 디버그 라벨 */}
            {mounted && isDebugMode && (
                <div style={{
                    position: 'absolute',
                    top: 2,
                    left: 4,
                    fontSize: '9px',
                    color: 'blue',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    zIndex: 1000,
                }}>
                    WorkListScrollerFlex
                </div>
            )}

            {/* Scroll container with fading edges and overlapping indicators */}
            <div
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{
                    position: 'relative',
                    maxWidth: fullWidth ? '100vw' : '70vw',
                    width: 'fit-content',
                    overflow: 'hidden',
                }}
            >
                {/* Left indicators - overlapping */}
                {!hideOverflowIndicators && (
                    <div
                        onMouseEnter={() => {
                            if (anyWorkHovered) return;
                            if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                            }
                            setIsMouseInContainer(false);
                        }}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            display: 'flex',
                            flexDirection: anyWorkHovered ? 'column' : 'row',
                            alignItems: anyWorkHovered ? 'flex-start' : 'flex-start',
                            gap: '4px',
                            paddingBottom: anyWorkHovered ? '24px' : '0',
                            opacity: showLeftArrow ? 1 : 0,
                            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 0.3s ease',
                            pointerEvents: showLeftArrow ? 'auto' : 'none',
                            zIndex: 20,
                            ...(isDebugMode && {
                                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                border: '1px dashed red',
                            }),
                        }}
                    >
                        <button
                            onClick={() => scroll('left')}
                            disabled={!showLeftArrow}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.7';
                            }}
                            style={{
                                background: 'var(--color-white)',
                                border: 'none',
                                cursor: showLeftArrow ? 'pointer' : 'default',
                                padding: '4px 8px',
                                fontSize: '14px',
                                color: '#000000',
                                opacity: 0.7,
                            }}
                            aria-label="Scroll left"
                        >
                            {'<<'}
                        </button>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#B3B3B3',
                                opacity: 0.7,
                                letterSpacing: '2px',
                                userSelect: 'none',
                                marginTop: anyWorkHovered ? '30px' : '0',
                                transition: 'margin-top 0.3s ease',
                                alignSelf: anyWorkHovered ? 'flex-end' : 'flex-start',
                            }}
                        >
                            ...
                        </div>
                    </div>
                )}

                {/* Left fade */}
                {!hideOverflowIndicators && (
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '140px',
                            background: 'linear-gradient(to right, var(--color-white) 0%, var(--color-white) 40%, rgba(255, 255, 255, 0.6) 70%, transparent 100%)',
                            pointerEvents: 'none',
                            zIndex: 10,
                            opacity: showLeftArrow ? 1 : 0,
                            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            ...(isDebugMode && {
                                border: '1px dashed orange',
                            }),
                        }}
                    />
                )}

                {/* Scrollable work list */}
                <div
                    ref={scrollContainerRef}
                    style={{
                        display: 'flex',
                        flexDirection: direction === 'rtl' ? 'row-reverse' : 'row',
                        gap: '32px',
                        alignItems: 'flex-start',
                        overflowX: 'auto',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        paddingBottom: '4px',
                    }}
                >
                    {works.map((w) => (
                        <WorkTitleButton
                            key={w.id}
                            work={w}
                            isSelected={selectedWorkId === w.id}
                            onClick={() => onWorkSelect(w.id)}
                            showThumbnail={showThumbnail}
                            anyWorkHovered={anyWorkHovered}
                        />
                    ))}
                </div>

                {/* Right fade */}
                {!hideOverflowIndicators && (
                    <div
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '140px',
                            background: 'linear-gradient(to left, var(--color-white) 0%, var(--color-white) 40%, rgba(255, 255, 255, 0.6) 70%, transparent 100%)',
                            pointerEvents: 'none',
                            zIndex: 10,
                            opacity: showRightArrow ? 1 : 0,
                            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                            ...(isDebugMode && {
                                border: '1px dashed purple',
                            }),
                        }}
                    />
                )}

                {/* Right indicators - overlapping */}
                {!hideOverflowIndicators && (
                    <div
                        onMouseEnter={() => {
                            if (anyWorkHovered) return;
                            if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                            }
                            setIsMouseInContainer(false);
                        }}
                        style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            display: 'flex',
                            flexDirection: anyWorkHovered ? 'column' : 'row-reverse',
                            alignItems: anyWorkHovered ? 'flex-end' : 'flex-start',
                            gap: '4px',
                            paddingBottom: anyWorkHovered ? '24px' : '0',
                            opacity: showRightArrow ? 1 : 0,
                            transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), padding-bottom 0.3s ease',
                            pointerEvents: showRightArrow ? 'auto' : 'none',
                            zIndex: 20,
                            ...(isDebugMode && {
                                backgroundColor: 'rgba(0, 255, 0, 0.1)',
                                border: '1px dashed green',
                            }),
                        }}
                    >
                        <button
                            onClick={() => scroll('right')}
                            disabled={!showRightArrow}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '0.7';
                            }}
                            style={{
                                background: 'var(--color-white)',
                                border: 'none',
                                cursor: showRightArrow ? 'pointer' : 'default',
                                padding: '4px 8px',
                                fontSize: '14px',
                                color: '#000000',
                                opacity: 0.7,
                            }}
                            aria-label="Scroll right"
                        >
                            {'>>'}
                        </button>
                        <div
                            style={{
                                fontSize: '12px',
                                color: '#B3B3B3',
                                opacity: 0.7,
                                letterSpacing: '2px',
                                userSelect: 'none',
                                marginTop: anyWorkHovered ? '30px' : '0',
                                transition: 'margin-top 0.3s ease',
                                alignSelf: 'flex-start',
                            }}
                        >
                            ...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}