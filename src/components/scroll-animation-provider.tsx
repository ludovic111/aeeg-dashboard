"use client";

import { useScrollAnimation } from "@/hooks/use-scroll-animation";

export function ScrollAnimationProvider({ children }: { children: React.ReactNode }) {
  useScrollAnimation();
  return <>{children}</>;
}
