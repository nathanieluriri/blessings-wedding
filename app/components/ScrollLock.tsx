"use client";

import { useLenis } from "lenis/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ScrollLockApi = {
  lock: (id: string) => void;
  unlock: (id: string) => void;
  isLocked: boolean;
};

const ScrollLockContext = createContext<ScrollLockApi | null>(null);

export function ScrollLockProvider({ children }: { children: ReactNode }) {
  const idsRef = useRef<Set<string>>(new Set());
  const [count, setCount] = useState(0);
  const lenis = useLenis();

  const lock = useCallback((id: string) => {
    if (idsRef.current.has(id)) return;
    idsRef.current.add(id);
    setCount(idsRef.current.size);
  }, []);

  const unlock = useCallback((id: string) => {
    if (!idsRef.current.has(id)) return;
    idsRef.current.delete(id);
    setCount(idsRef.current.size);
  }, []);

  useEffect(() => {
    const locked = count > 0;
    if (locked) {
      lenis?.stop();
      const root = document.documentElement;
      const body = document.body;
      root.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
  }, [count, lenis]);

  return (
    <ScrollLockContext.Provider value={{ lock, unlock, isLocked: count > 0 }}>
      {children}
    </ScrollLockContext.Provider>
  );
}

export function useScrollLockApi(): ScrollLockApi {
  const ctx = useContext(ScrollLockContext);
  if (!ctx) {
    return {
      lock: () => {},
      unlock: () => {},
      isLocked: false,
    };
  }
  return ctx;
}

export function useScrollLock(id: string, locked: boolean) {
  const api = useScrollLockApi();
  useEffect(() => {
    if (locked) {
      api.lock(id);
      return () => api.unlock(id);
    }
    api.unlock(id);
  }, [id, locked, api]);
}
