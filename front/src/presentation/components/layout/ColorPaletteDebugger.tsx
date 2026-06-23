'use client';

import { IS_DEBUG_COLOR_ENABLED } from '@/core/constants';
import { COLOR_PALETTE, CATEGORY_LABELS, type ColorVariable } from '@/core/constants/color-palette.constants';
import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'debug-color-palette';

/**
 * 실시간 색상 팔레트 디버거
 *
 * CSS 변수를 실시간으로 조절하고 로컬스토리지에 저장합니다.
 */
/** 기본 색상 맵 생성 */
function buildDefaultColors(): Record<string, string> {
  const defaultColors: Record<string, string> = {};
  COLOR_PALETTE.forEach((color) => {
    defaultColors[color.cssVar] = color.defaultValue;
  });
  return defaultColors;
}

/** 로컬스토리지에서 저장된 색상을 읽고, 없거나 파싱 실패 시 기본값 반환 */
function loadInitialColors(): Record<string, string> {
  if (typeof window === 'undefined') {
    return buildDefaultColors();
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved) as Record<string, string>;
    } catch (e) {
      console.error('Failed to parse saved colors', e);
    }
  }
  return buildDefaultColors();
}

export function ColorPaletteDebugger() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // 로컬스토리지(외부 시스템)에서 lazy 초기화 — effect 내 setState 회피
  const [colors, setColors] = useState<Record<string, string>>(loadInitialColors);
  const [previewVar, setPreviewVar] = useState<string | null>(null);
  const [hardcodedColors, setHardcodedColors] = useState<Array<{ element: string; color: string }>>([]);

  // 색상 초기화
  const resetColors = useCallback(() => {
    const defaultColors = buildDefaultColors();
    Object.entries(defaultColors).forEach(([cssVar, value]) => {
      document.documentElement.style.setProperty(cssVar, value);
    });
    setColors(defaultColors);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultColors));
  }, []);

  // 현재 colors 상태를 CSS 변수에 동기화 (외부 시스템 = DOM 업데이트)
  useEffect(() => {
    Object.entries(colors).forEach(([cssVar, value]) => {
      document.documentElement.style.setProperty(cssVar, value);
    });
  }, [colors]);

  // 색상 변경
  const handleColorChange = useCallback((cssVar: string, value: string) => {
    setColors((prev) => {
      const updated = { ...prev, [cssVar]: value };
      // CSS 변수 즉시 적용
      document.documentElement.style.setProperty(cssVar, value);
      // 로컬스토리지 저장
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // CSS 변수 값 복사
  const handleCopyCSS = useCallback(() => {
    const cssText = Object.entries(colors)
      .map(([cssVar, value]) => `  ${cssVar}: ${value};`)
      .join('\n');
    const fullText = `:root {\n${cssText}\n}`;
    navigator.clipboard.writeText(fullText).then(() => {
      alert('CSS 변수가 클립보드에 복사되었습니다!');
    });
  }, [colors]);

  // 하드코딩된 색상 감지
  const detectHardcodedColors = useCallback(() => {
    const allElements = document.querySelectorAll('*');
    const detected: Array<{ element: string; color: string }> = [];
    const colorRegex = /#[0-9A-Fa-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/;

    allElements.forEach((el) => {
      const computed = window.getComputedStyle(el);
      const inlineStyle = (el as HTMLElement).style;

      // inline style에서 하드코딩된 색상 찾기
      ['color', 'backgroundColor', 'borderColor'].forEach((prop) => {
        const inlineValue = inlineStyle.getPropertyValue(prop);
        if (inlineValue && colorRegex.test(inlineValue)) {
          const elementDesc = el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ')[0]}` : '');
          detected.push({ element: elementDesc, color: `${prop}: ${inlineValue}` });
        }
      });
    });

    setHardcodedColors(detected.slice(0, 50)); // 최대 50개만 표시
    if (detected.length > 0) {
      alert(`${detected.length}개의 하드코딩된 색상을 발견했습니다!`);
    } else {
      alert('하드코딩된 색상이 없습니다!');
    }
  }, []);

  // Preview 모드 토글
  const handlePreview = useCallback((cssVar: string) => {
    if (previewVar === cssVar) {
      setPreviewVar(null);
    } else {
      setPreviewVar(cssVar);
    }
  }, [previewVar]);

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  }, [position]);

  // 드래그 중
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Preview 효과 적용
  useEffect(() => {
    if (!previewVar) return;

    const targetValue = getComputedStyle(document.documentElement).getPropertyValue(previewVar).trim();
    if (!targetValue) return;

    const allElements = document.querySelectorAll('*');
    const highlighted: HTMLElement[] = [];

    allElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const computed = window.getComputedStyle(htmlEl);

      // 색상 속성들을 확인
      const colorProps = [
        computed.color,
        computed.backgroundColor,
        computed.borderColor,
        computed.borderTopColor,
        computed.borderRightColor,
        computed.borderBottomColor,
        computed.borderLeftColor,
      ];

      const usesVar = colorProps.some((prop) => {
        // RGB 값 비교
        return prop && (prop === targetValue || prop.replace(/\s/g, '') === targetValue.replace(/\s/g, ''));
      });

      if (usesVar) {
        htmlEl.dataset.originalOutline = htmlEl.style.outline || '';
        htmlEl.dataset.originalOutlineOffset = htmlEl.style.outlineOffset || '';
        htmlEl.style.outline = '2px dashed #ff6b6b';
        htmlEl.style.outlineOffset = '2px';
        highlighted.push(htmlEl);
      }
    });

    console.log(`Preview: ${previewVar} = ${targetValue}, found ${highlighted.length} elements`);

    return () => {
      highlighted.forEach((el) => {
        el.style.outline = el.dataset.originalOutline || '';
        el.style.outlineOffset = el.dataset.originalOutlineOffset || '';
        delete el.dataset.originalOutline;
        delete el.dataset.originalOutlineOffset;
      });
    };
  }, [previewVar]);

  // 카테고리별로 그룹화
  const groupedColors = useMemo(() => {
    const groups: Record<ColorVariable['category'], ColorVariable[]> = {
      base: [],
      text: [],
      layout: [],
      category: [],
      other: [],
    };

    COLOR_PALETTE.forEach((color) => {
      groups[color.category].push(color);
    });

    return groups;
  }, []);

  if (!IS_DEBUG_COLOR_ENABLED) {
    return null;
  }

  return (
    <>
      {/* 토글 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#0C0C0C',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: 10001,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="색상 팔레트 열기"
        >
          🎨
        </button>
      )}

      {/* 색상 팔레트 패널 */}
      {isOpen && (
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '360px',
            maxHeight: '80vh',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            cursor: isDragging ? 'grabbing' : 'default',
          }}
        >
          {/* 헤더 */}
          <div
            className="drag-handle"
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #E5E5E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'grab',
              backgroundColor: '#F5F5F5',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>🎨</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Color Palette</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* 액션 버튼 */}
          <div
            style={{
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              borderBottom: '1px solid #E5E5E5',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={resetColors}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: '#0C0C0C',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                초기화
              </button>
              <button
                onClick={handleCopyCSS}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: '#FFFFFF',
                  color: '#0C0C0C',
                  border: '1px solid #E5E5E5',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                CSS 복사
              </button>
            </div>
            <button
              onClick={detectHardcodedColors}
              style={{
                width: '100%',
                padding: '6px 12px',
                fontSize: '12px',
                backgroundColor: '#ff6b6b',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              🔍 하드코딩 색상 감지
            </button>
            {previewVar && (
              <div
                style={{
                  padding: '8px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textAlign: 'center',
                }}
              >
                Preview: {previewVar}
              </div>
            )}
          </div>

          {/* 색상 목록 */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
            }}
          >
            {/* 하드코딩된 색상 목록 */}
            {hardcodedColors.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    color: '#ff6b6b',
                    marginBottom: '12px',
                    letterSpacing: '0.5px',
                  }}
                >
                  🚨 Hardcoded Colors ({hardcodedColors.length})
                </h3>
                <div
                  style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    backgroundColor: '#fff5f5',
                    padding: '8px',
                    borderRadius: '4px',
                  }}
                >
                  {hardcodedColors.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '4px', color: '#c92a2a' }}>
                      {item.element}: {item.color}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CSS 변수 목록 */}
            {Object.entries(groupedColors).map(([category, colorList]) => {
              if (colorList.length === 0) return null;

              return (
                <div key={category} style={{ marginBottom: '24px' }}>
                  <h3
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: '#737373',
                      marginBottom: '12px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {CATEGORY_LABELS[category as ColorVariable['category']]}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {colorList.map((color) => (
                      <div
                        key={color.cssVar}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          padding: '8px',
                          backgroundColor: previewVar === color.cssVar ? '#fff3cd' : 'transparent',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="color"
                            value={colors[color.cssVar] || color.defaultValue}
                            onChange={(e) => handleColorChange(color.cssVar, e.target.value)}
                            style={{
                              width: '32px',
                              height: '32px',
                              border: '1px solid #E5E5E5',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            }}
                          />
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#0C0C0C',
                              }}
                            >
                              {color.label}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#737373',
                                fontFamily: 'monospace',
                              }}
                            >
                              {colors[color.cssVar] || color.defaultValue}
                            </span>
                          </div>
                          <button
                            onClick={() => handlePreview(color.cssVar)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              backgroundColor: previewVar === color.cssVar ? '#ff6b6b' : '#E5E5E5',
                              color: previewVar === color.cssVar ? '#FFFFFF' : '#0C0C0C',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}
                            title="사용처 미리보기"
                          >
                            {previewVar === color.cssVar ? '✓' : '👁'}
                          </button>
                        </div>
                        {color.usage && (
                          <div
                            style={{
                              fontSize: '10px',
                              color: '#737373',
                              paddingLeft: '40px',
                              lineHeight: 1.4,
                            }}
                          >
                            💡 {color.usage}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
