"use client";

import AppErrorFallback from "@/components/system/AppErrorFallback";

export default function GlobalApplicationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><AppErrorFallback error={error} reset={reset} /></body></html>;
}
