"use client";

import { useEffect } from "react";

/**
 * Observe elements with `.animate-on-scroll` or `.animate-rule` and add
 * `.is-visible` when they enter the viewport. Fires once per element.
 */
export function useScrollAnimation() {
  useEffect(() => {
    // Skip if user prefers reduced motion
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = document.querySelectorAll(
      ".animate-on-scroll, .animate-rule"
    );
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}
