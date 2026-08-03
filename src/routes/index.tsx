import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, ClipboardCheck, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEMO_MODE } from "@/lib/demo-mode";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "아이디헤어 신규 고객 설문 프로토타입" },
      {
        name: "description",
        content: "직원이 설문을 준비하고 고객 응답을 관리하는 아이디헤어 웹 프로토타입입니다.",
      },
    ],
  }),
  component: PrototypeLanding,
});

const flow = [
  {
    icon: MonitorSmartphone,
    title: "직원 설정",
    body: "매장과 담당 디자이너를 선택해 고객 링크를 엽니다.",
  },
  {
    icon: ClipboardCheck,
    title: "고객 설문",
    body: "동의부터 검토·제출까지 태블릿 흐름을 체험합니다.",
  },
  {
    icon: BarChart3,
    title: "결과 확인",
    body: "응답 목록과 핵심 지표에서 제출 결과를 확인합니다.",
  },
];

function PrototypeLanding() {
  return (
    <main id="main-content" className="min-h-screen bg-background px-5 py-16 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-accent">
          IDHAIR PROTOTYPE
        </p>
        <h1 className="mt-5 max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
          신규 고객 상담을 더 빠르고 정확하게
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          직원이 설문을 준비하고, 고객이 응답하고, 관리자가 결과를 확인하는 핵심 흐름을 3~5분 안에
          시연할 수 있습니다.
        </p>
        <Button asChild size="lg" className="mt-9 h-14 px-7 text-base">
          <Link to={DEMO_MODE ? "/admin/dashboard" : "/login"}>
            {DEMO_MODE ? "데모로 바로 시작하기" : "데모 관리자 로그인"}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>

        <section aria-label="프로토타입 핵심 흐름" className="mt-16 grid gap-4 md:grid-cols-3">
          {flow.map(({ icon: Icon, title, body }, index) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <p className="mt-5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Step {index + 1}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">{title}</h2>
              <p className="mt-2 leading-7 text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
