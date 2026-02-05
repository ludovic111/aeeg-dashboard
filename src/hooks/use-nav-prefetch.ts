"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_NAV_ITEMS } from "@/lib/navigation";

export function useNavPrefetch() {
  const router = useRouter();

  const prefetchRoute = useCallback(
    (href: string) => {
      router.prefetch(href);
    },
    [router]
  );

  useEffect(() => {
    APP_NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  return prefetchRoute;
}
