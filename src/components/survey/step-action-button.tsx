import { Loader2 } from "lucide-react";

export function StepActionButton({
  label,
  onClick,
  disabled = false,
  busy = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-busy={busy}
      className="inline-flex h-14 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
    >
      {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
      {label}
    </button>
  );
}
