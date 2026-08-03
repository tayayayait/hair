import { createFileRoute, Link, Outlet, useParams } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurveyProvider, useSurvey } from "@/lib/survey-store";

export const Route = createFileRoute("/s/$session")({
  component: SurveyLayout,
});

function SurveyLayout() {
  const { session } = useParams({ from: "/s/$session" });
  return (
    <SurveyProvider sessionId={session}>
      <SurveyAccessBoundary />
    </SurveyProvider>
  );
}

function SurveyAccessBoundary() {
  const { sessionStatus, sessionError, retrySession } = useSurvey();

  if (sessionStatus === "loading") {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-background px-5 text-center"
      >
        <div>
          <LoaderCircle className="mx-auto size-8 animate-spin text-accent" aria-hidden="true" />
          <p className="mt-4 text-base font-medium text-foreground">
            설문 준비 상태를 확인하고 있습니다.
          </p>
        </div>
      </main>
    );
  }

  if (sessionStatus === "error") {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-center"
      >
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            IDHAIR KIOSK
          </p>
          <h1 className="mt-3 text-balance text-3xl font-bold text-foreground">
            설문 연결을 확인하지 못했습니다
          </h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            {sessionError ?? "네트워크 연결을 확인한 뒤 다시 시도해 주세요."}
          </p>
          <Button size="lg" className="mt-7 h-12 px-6" onClick={retrySession}>
            다시 시도
          </Button>
        </div>
      </main>
    );
  }

  if (sessionStatus === "invalid") {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-background px-5 py-12 text-center"
      >
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            IDHAIR KIOSK
          </p>
          <h1 className="mt-3 text-3xl font-bold text-foreground">직원을 호출해 주세요</h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            {sessionError ?? "키오스크 링크가 만료되었거나 종료되었습니다."}
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground"
          >
            프로토타입 안내로 이동
          </Link>
        </div>
      </main>
    );
  }

  return <Outlet />;
}
