"use client";

import { useEffect, useRef, useCallback } from "react";

interface TooltipContent {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "positive" | "negative";
}

/**
 * Creates and manages a tooltip DOM element for D3 chart hover interactions.
 *
 * Returns show/hide/move functions that D3 mouse event handlers can call.
 * The tooltip element uses the .d3-tooltip CSS class defined in globals.css.
 *
 * Usage in a D3 useEffect:
 *   selection
 *     .on("mouseover", (event, d) => {
 *       showTooltip({ label: "2023", value: "25.8%" });
 *     })
 *     .on("mousemove", (event) => {
 *       moveTooltip(event.clientX, event.clientY);
 *     })
 *     .on("mouseout", hideTooltip);
 */
export function useTooltip() {
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // Create tooltip element on mount, remove on unmount
  useEffect(() => {
    const el = document.createElement("div");
    el.className = "d3-tooltip";
    document.body.appendChild(el);
    tooltipRef.current = el;

    return () => {
      el.remove();
      tooltipRef.current = null;
    };
  }, []);

  const showTooltip = useCallback((content: TooltipContent) => {
    const el = tooltipRef.current;
    if (!el) return;

    let html = `<div class="label">${content.label}</div>`;
    html += `<div class="value">${content.value}</div>`;
    if (content.delta) {
      const cls = content.deltaDirection ?? "positive";
      html += `<div class="delta ${cls}">${content.delta}</div>`;
    }

    el.innerHTML = html;
    el.classList.add("visible");
  }, []);

  const moveTooltip = useCallback((clientX: number, clientY: number) => {
    const el = tooltipRef.current;
    if (!el) return;

    const offsetX = 12;
    const offsetY = -12;

    // Keep tooltip within viewport
    const rect = el.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let x = clientX + offsetX;
    let y = clientY + offsetY;

    // Flip horizontally if overflowing right
    if (x + rect.width > viewportW - 8) {
      x = clientX - rect.width - offsetX;
    }
    // Flip vertically if overflowing top
    if (y - rect.height < 8) {
      y = clientY + Math.abs(offsetY) + 8;
    }

    el.style.left = `${x}px`;
    el.style.top = `${y - rect.height}px`;
  }, []);

  const hideTooltip = useCallback(() => {
    const el = tooltipRef.current;
    if (!el) return;
    el.classList.remove("visible");
  }, []);

  return { showTooltip, moveTooltip, hideTooltip };
}