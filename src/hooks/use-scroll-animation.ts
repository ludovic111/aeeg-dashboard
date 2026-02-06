"use client";

import { useEffect } from "react";

/**
 * Observe elements with `.animate-on-scroll` or `.animate-rule` and add
 * `.is-visible` when they enter the viewport. Fires once per element.
 * Uses a MutationObserver to pick up dynamically-rendered elements.
 */
export function useScrollAnimation() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observed = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    function track(el: Element) {
      if (observed.has(el)) return;
      observed.add(el);
      io.observe(el);
    }

    // Initial pass
    document
      .querySelectorAll(".animate-on-scroll, .animate-rule")
      .forEach(track);

    // Watch for dynamically-added elements
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          if (
            node.classList.contains("animate-on-scroll") ||
            node.classList.contains("animate-rule")
          ) {
            track(node);
          }
          node
            .querySelectorAll(".animate-on-scroll, .animate-rule")
            .forEach(track);
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
