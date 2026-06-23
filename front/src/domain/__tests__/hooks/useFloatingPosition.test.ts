import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFloatingPosition } from '../../hooks/useFloatingPosition';

describe('useFloatingPosition', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it('should left-align element below position by default (x = position.x + offsetX)', () => {
    const { result } = renderHook(() =>
      useFloatingPosition({
        position: { x: 500, y: 300 },
        dimensions: { width: 200, height: 100 },
      })
    );

    // x is left-aligned with offsetX (default offsetX=0): 500 + 0 = 500
    // y is positioned ABOVE the target by default (enough space above):
    //   300 - height(100) - offsetY(8) = 192
    expect(result.current).toEqual({
      x: 500,
      y: 192,
    });
  });

  it('should apply custom offset', () => {
    const { result } = renderHook(() =>
      useFloatingPosition({
        position: { x: 500, y: 300 },
        dimensions: { width: 200, height: 100 },
        offset: { x: 20, y: 15 },
      })
    );

    expect(result.current).toEqual({
      x: 520, // Left alignment with offsetX: 500 + 20
      y: 185, // Positioned above: 300 - height(100) - offsetY(15)
    });
  });

  it('should respect custom edge padding', () => {
    const { result } = renderHook(() =>
      useFloatingPosition({
        position: { x: 5, y: 5 }, // Near top-left corner
        dimensions: { width: 200, height: 100 },
        edgePadding: 20, // Custom padding
      })
    );

    // Should be pushed away from edge by edgePadding
    expect(result.current.x).toBeGreaterThanOrEqual(20);
    expect(result.current.y).toBeGreaterThanOrEqual(20);
  });

  it('should prevent overflow on right edge', () => {
    const { result } = renderHook(() =>
      useFloatingPosition({
        position: { x: 950, y: 300 }, // Near right edge
        dimensions: { width: 200, height: 100 },
      })
    );

    // Should be constrained to not exceed right edge
    // Max x = 1024 - 200 - 10 = 814
    expect(result.current.x).toBeLessThanOrEqual(814);
  });

  it('should prevent overflow on bottom edge', () => {
    const { result } = renderHook(() =>
      useFloatingPosition({
        position: { x: 500, y: 720 }, // Near bottom edge
        dimensions: { width: 200, height: 100 },
      })
    );

    // Should position above the target when overflowing bottom
    // y should be less than original position
    expect(result.current.y).toBeLessThan(720);
  });

  it('should prevent overflow on left edge', () => {
    const { result } = renderHook(() =>
      useFloatingPosition({
        position: { x: 5, y: 300 }, // Near left edge
        dimensions: { width: 200, height: 100 },
      })
    );

    // Should be constrained to edge padding
    expect(result.current.x).toBeGreaterThanOrEqual(10);
  });

  it('should prevent overflow on top edge', () => {
    const { result } = renderHook(() =>
      useFloatingPosition({
        position: { x: 500, y: 5 }, // Near top edge
        dimensions: { width: 200, height: 100 },
      })
    );

    // Should be constrained to edge padding
    expect(result.current.y).toBeGreaterThanOrEqual(10);
  });

  it('should recalculate position when dependencies change', () => {
    const { result, rerender } = renderHook(
      ({ position }) =>
        useFloatingPosition({
          position,
          dimensions: { width: 200, height: 100 },
        }),
      {
        initialProps: { position: { x: 500, y: 300 } },
      }
    );

    const initialPosition = result.current;

    rerender({ position: { x: 600, y: 400 } });

    expect(result.current).not.toEqual(initialPosition);
    expect(result.current.x).toBe(600); // 600 + offsetX(0) — left aligned
    expect(result.current.y).toBe(292); // Positioned above: 400 - height(100) - offsetY(8)
  });

  it('should handle window resize events', async () => {
    const { result } = renderHook(() =>
      useFloatingPosition({
        position: { x: 900, y: 300 },
        dimensions: { width: 200, height: 100 },
      })
    );

    const initialPosition = result.current;

    // Simulate window resize
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true });
    window.dispatchEvent(new Event('resize'));

    // Wait for effect to run
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Position should have been recalculated for narrower viewport
    // Note: The exact value may vary based on implementation
    expect(result.current.x).toBeLessThanOrEqual(800 - 200 - 10);
  });

  it('should cleanup resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useFloatingPosition({
        position: { x: 500, y: 300 },
        dimensions: { width: 200, height: 100 },
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
