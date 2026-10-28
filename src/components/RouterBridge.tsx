"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NAVIGATE_EVENT } from "@/lib/navigationBridge";

// Renders nothing — exists only to own a router reference from outside the
// Canvas/dynamic-import tree. See navigationBridge.ts for why this indirection
// is necessary.
export default function RouterBridge() {
  const router = useRouter();

  useEffect(() => {
    const handleNavigate = (event: Event) => {
      const path = (event as CustomEvent<string>).detail;
      if (path) router.push(path);
    };
    window.addEventListener(NAVIGATE_EVENT, handleNavigate);
    return () => window.removeEventListener(NAVIGATE_EVENT, handleNavigate);
  }, [router]);

  return null;
}
