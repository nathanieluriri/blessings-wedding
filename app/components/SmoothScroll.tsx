"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";
import { ScrollLockProvider } from "./ScrollLock";

type SmoothScrollProps = {
  children: ReactNode;
};

export default function SmoothScroll({ children }: SmoothScrollProps) {
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
