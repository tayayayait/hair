import { useCallback } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useSurvey } from "@/lib/survey-store";
import { useCompletionReset } from "@/lib/use-completion-reset";

export const Route = createFileRoute("/s/$session/complete")({
  head: () => ({
    meta: [
      { title: "설문 완료 | 아이디헤어 설문" },
      {
        name: "description",
        content: "설문이 제출되었습니다. 담당 디자이너가 상담을 도와드립니다.",
      },
      { property: "og:title", content: "설문 완료 | 아이디헤어 설문" },
      { property: "og:description", content: "설문 제출이 완료되었습니다." },
    ],
  }),
  component: CompleteStep,
});

function CompleteStep() {
  const navigate = useNavigate();
  const { session: sessionId } = useParams({ from: "/s/$session" });
  const { reset } = useSurvey();
  const restart = useCallback(
    () =>
      navigate({
        to: "/s/$session",
        params: { session: sessionId },
        replace: true,
      }),
    [navigate, sessionId],
  );
  const startNextCustomer = useCallback(() => {
    reset();
    restart();
  }, [reset, restart]);

  useCompletionReset({ resetAnswers: reset, restart });

  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent-soft text-accent">
          <svg
            viewBox="0 0 24 24"
            className="size-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="m5 12.5 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">설문이 완료되었습니다</h1>
        <p className="mt-3 text-base leading-7 text-muted-foreground">
          태블릿을 담당 디자이너에게 전달해 주세요.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">15초 후 다음 고객 설문으로 돌아갑니다.</p>
        <div className="mt-8 flex flex-col gap-3">
          <Button size="lg" className="h-14 text-base" onClick={startNextCustomer}>
            다음 고객 설문 시작
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="h-12 text-base"
            onClick={() => navigate({ to: "/admin/kiosk", replace: true })}
          >
            직원용 키오스크 설정
          </Button>
        </div>
      </div>
    </main>
  );
}
