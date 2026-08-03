import type { ReactNode } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Check, ChevronLeft, Loader2 } from "lucide-react";
import { useSurvey } from "@/lib/survey-store";
import { StepActionButton } from "./step-action-button";

const STEPS = [
  { path: "basic", label: "기본 정보" },
  { path: "preference", label: "방문·상담" },
  { path: "condition", label: "모발·두피" },
  { path: "review", label: "검토" },
] as const;

export function StepLayout({
  step,
  title,
  description,
  children,
  onNext,
  nextLabel = "다음",
  nextDisabled = false,
  nextBusy = false,
  backTo,
}: {
  step?: 1 | 2 | 3 | 4 | undefined;
  title: string;
  description?: string | undefined;
  children: ReactNode;
  onNext: () => void;
  nextLabel?: string | undefined;
  nextDisabled?: boolean | undefined;
  nextBusy?: boolean | undefined;
  backTo?: string | undefined;
}) {
  const navigate = useNavigate();
  const { session: sessionId } = useParams({ from: "/s/$session" });
  const { session, saveState } = useSurvey();
  const progress = step ? (step / STEPS.length) * 100 : 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[900px] items-center justify-between px-5 md:px-8">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">아이디헤어</span>
            <span className="text-sm text-muted-foreground">
              {session ? `${session.storeName} · ${session.designerName}` : "신규 고객 설문"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {step ? (
              <span className="font-medium text-foreground">
                단계 {step}/{STEPS.length}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              {saveState === "saving" ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> 저장 중…
                </>
              ) : saveState === "saved" ? (
                <>
                  <Check className="size-4 text-success" aria-hidden /> 저장됨
                </>
              ) : null}
            </span>
          </div>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-1 bg-accent transition-[width] duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="설문 진행률"
          />
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-[900px] flex-1 px-5 pb-32 pt-8 md:px-8"
      >
        <h1 className="text-[30px] font-bold leading-10 text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 text-lg leading-7 text-muted-foreground">{description}</p>
        ) : null}
        <div className="mt-8 space-y-5">{children}</div>
      </main>

      <div className="sticky bottom-0 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex max-w-[900px] items-center justify-between gap-3 px-5 py-4 md:px-8">
          {backTo ? (
            <button
              type="button"
              onClick={() => navigate({ to: backTo, params: { session: sessionId } })}
              className="inline-flex h-14 items-center gap-1 rounded-xl border-2 border-input px-5 text-base font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <ChevronLeft className="size-5" aria-hidden /> 이전
            </button>
          ) : (
            <span />
          )}
          <StepActionButton
            label={nextLabel}
            onClick={onNext}
            disabled={nextDisabled}
            busy={nextBusy}
          />
        </div>
      </div>
    </div>
  );
}

export function scrollToFirstError(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    (el.querySelector("input, button") as HTMLElement | null)?.focus();
  }
}
