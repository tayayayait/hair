import { useEffect } from "react";

export function useCompletionReset({
  resetAnswers,
  restart,
  delayMs = 15_000,
}: {
  resetAnswers: () => void;
  restart: () => void;
  delayMs?: number;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      resetAnswers();
      restart();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [delayMs, resetAnswers, restart]);
}
