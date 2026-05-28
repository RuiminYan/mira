"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = "mira.pwa.installPromptDismissed";

export function PwaInstallButton({ label }: { label: string }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(KEY) === "1") {
      setDismissed(true);
      return;
    }
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (dismissed || !evt) return null;

  async function install() {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    window.localStorage.setItem(KEY, "1");
    setEvt(null);
    setDismissed(true);
  }

  function close() {
    window.localStorage.setItem(KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)]">
      <div className="glass rounded-full pl-4 pr-2 py-2 inline-flex items-center gap-3 shadow-2xl">
        <button
          type="button"
          onClick={install}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink"
        >
          <Download size={14} className="text-brand-2" /> {label}
        </button>
        <button
          type="button"
          onClick={close}
          aria-label="Dismiss"
          className="grid h-7 w-7 place-items-center rounded-full text-ink-3 hover:bg-white/[0.08] hover:text-ink"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
