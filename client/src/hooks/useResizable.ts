import { useState, useEffect, useCallback } from 'react';

export type ResizeDirection = 'horizontal' | 'vertical';

export interface UseResizableOptions {
  direction: ResizeDirection;
  initialSize: number;
  minSize: number;
  maxSize?: number;
  localStorageKey: string;
  reverse?: boolean; // If true, dragging down/right DECREASES size (e.g. element is pinned to right/bottom)
}

export function useResizable({
  direction,
  initialSize,
  minSize,
  maxSize = 9999,
  localStorageKey,
  reverse = false,
}: UseResizableOptions) {
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem(localStorageKey);
    return saved ? parseFloat(saved) : initialSize;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ pos: number; size: number } | null>(null);

  useEffect(() => {
    localStorage.setItem(localStorageKey, size.toString());
  }, [size, localStorageKey]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only left click
      if (e.button !== 0) return;

      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      setIsDragging(true);
      setDragStart({
        pos: direction === 'horizontal' ? e.clientX : e.clientY,
        size,
      });
    },
    [direction, size],
  );

  useEffect(() => {
    if (!isDragging || !dragStart) return;

    const handlePointerMove = (e: PointerEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - dragStart.pos;

      let newSize = dragStart.size + (reverse ? -delta : delta);

      // Calculate max size dynamically if it's based on window
      const currentMaxSize = Math.min(
        maxSize,
        direction === 'horizontal' ? window.innerWidth * 0.9 : window.innerHeight * 0.9,
      );

      if (newSize < minSize) newSize = minSize;
      if (newSize > currentMaxSize) newSize = currentMaxSize;

      // Update state without triggering massive re-renders if not needed,
      // but we do need React to rerender to apply the width/height style.
      setSize(newSize);
    };

    const handlePointerUp = (e: PointerEvent) => {
      setIsDragging(false);
      setDragStart(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        return;
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    // Disable body selection and set cursor
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart, direction, reverse, minSize, maxSize]);

  // A direct setter is useful for Reset Layout
  const resetSize = useCallback(
    (newSize: number) => {
      setSize(newSize);
      localStorage.setItem(localStorageKey, newSize.toString());
    },
    [localStorageKey],
  );

  return { size, handlePointerDown, isDragging, resetSize };
}
