"use client";

import { ReactLenis } from "lenis/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ScrollLockProvider } from "./ScrollLock";

type SmoothScrollProps = {
  children: ReactNode;
};

export default function SmoothScroll({ children }: SmoothScrollProps) {
  const pathname = usePathname();

  // The admin dashboard uses native scrolling — Lenis' root scroll hijacking
  // conflicts with Radix dialog/scroll-lock behaviour. Keep it on the public
  // marketing site only.
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login/admin")) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.085,
        duration: 1.25,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1,
        syncTouch: false,
        gestureOrientation: "vertical",
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      }}
    >
      <ScrollLockProvider>{children}</ScrollLockProvider>
    </ReactLenis>
  );
}
