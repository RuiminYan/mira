"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function StudioJobPoller({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      router.refresh();
    }, 1200);
    return () => clearInterval(id);
  }, [active, router]);
  return null;
}
