"use client";

import { useEffect, useRef, useState } from "react";

export interface Dimensions {
  width: number;
  height: number;
}

/**
 * Observes an element's size and returns its dimensions.
 * D3 charts use this to know their available drawing area.
 *
 * Usage:
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const dims = useResizeObserver(containerRef);
 */
export function useResizeObserver(
  ref: React.RefObject<HTMLElement | null>
): Dimensions | null {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    observerRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Only update if dimensions actually changed (avoids re-render loops)
        setDimensions((prev) => {
          if (prev && prev.width === width && prev.height === height) {
            return prev;
          }
          return { width, height };
        });
      }
    });

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [ref]);

  return dimensions;
}