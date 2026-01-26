/**
 * Debug mode configuration
 *
 * 한 곳에서 디버그 레이아웃 박스 표시를 제어합니다.
 *
 * Usage:
 * ```typescript
 * import { IS_DEBUG_LAYOUT_ENABLED } from '@/core/constants';
 *
 * const isDebugMode = IS_DEBUG_LAYOUT_ENABLED;
 * ```
 */

/**
 * 디버그 레이아웃 박스 표시 여부
 * - true: 개발 환경에서 레이아웃 박스 표시
 * - false: 레이아웃 박스 숨김
 */
export const IS_DEBUG_LAYOUT_ENABLED = true;

/**
 * 디버그 그리드 표시 여부
 * - true: 화면 전체에 10px 정방형 그리드 표시
 * - false: 그리드 숨김
 */
export const IS_DEBUG_GRID_ENABLED = true;

/**
 * 색상 팔레트 디버거 표시 여부
 * - true: 실시간 색상 조절 패널 표시
 * - false: 패널 숨김
 */
export const IS_DEBUG_COLOR_ENABLED = true;
