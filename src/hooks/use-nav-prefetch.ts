"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MOBILE_PRIMARY_NAV_ITEMS } from "@/lib/navigation";

export function useNavPrefetch() {
  const router = useRouter();

  const prefetchRoute = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  useEffect(() => {
    const runPrefetch = () => {
      MOBILE_PRIMARY_NAV_ITEMS.forEach((item) => {
        router.prefetch(item.href);
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => runPrefetch(), {
        timeout: 1500,
      });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(runPrefetch, 1200);
    return () => clearTimeout(timeoutId);
  }, [router]);

  return prefetchRoute;
}
