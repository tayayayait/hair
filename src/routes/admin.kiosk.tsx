import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, LoaderCircle, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { buildCustomerSurveyUrl } from "@/lib/kiosk-session";
import {
  createDemoKioskSession,
  DEMO_MODE,
  getDemoDesigners,
  getDemoStores,
} from "@/lib/demo-mode";
import { DESIGNER_LEVEL_LABELS } from "@/lib/survey-schema";
import { PROTOTYPE_SURVEY_VERSION } from "@/lib/survey-submission";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/kiosk")({
  head: () => ({ meta: [{ title: "키오스크 준비 | 아이디헤어 관리자" }] }),
  component: AdminKiosk,
});

type KioskLaunch = {
  expiresAt: string;
  url: string;
};

function AdminKiosk() {
  const [storeId, setStoreId] = useState("");
  const [designerId, setDesignerId] = useState("");
  const [creating, setCreating] = useState(false);
  const [launch, setLaunch] = useState<KioskLaunch | null>(null);

  const storesQuery = useQuery({
    queryKey: ["admin", "stores"],
    queryFn: async () => {
      if (DEMO_MODE) return getDemoStores();

      const { data, error } = await supabase.from("stores").select("id, name, code").order("name");
      if (error) throw error;
      return data;
    },
  });

  const designersQuery = useQuery({
    queryKey: ["admin", "designers", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      if (DEMO_MODE) return getDemoDesigners(storeId);

      const { data, error } = await supabase
        .from("designers")
        .select("id, name, level")
        .eq("store_id", storeId)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createSession = async () => {
    if (!storeId || !designerId) return;
    setCreating(true);
    try {
      const created = DEMO_MODE
        ? createDemoKioskSession(storeId, designerId)
        : (
            await supabase.rpc("create_kiosk_session", {
              p_store_id: storeId,
              p_designer_id: designerId,
              p_expires_in_minutes: 480,
            })
          ).data?.[0];
      if (!created) throw new Error("키오스크 세션 생성 실패");

      const url = buildCustomerSurveyUrl(window.location.origin, created.kiosk_token);
      setLaunch({
        expiresAt: created.expires_at,
        url,
      });
      toast.success("고객용 키오스크 링크를 준비했습니다.");
    } catch {
      toast.error("키오스크 세션을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async () => {
    if (!launch) return;
    try {
      await navigator.clipboard.writeText(launch.url);
      toast.success("고객용 링크를 복사했습니다.");
    } catch {
      toast.error("링크를 복사하지 못했습니다.");
    }
  };

  const selectedStore = storesQuery.data?.find((store) => store.id === storeId);
  const selectedDesigner = designersQuery.data?.find((designer) => designer.id === designerId);

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">KIOSK SETUP</p>
          <h1 className="mt-2 text-balance text-3xl font-bold text-foreground">고객 설문 준비</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
            매장과 담당 디자이너를 지정한 뒤 고객에게 태블릿을 전달하세요. 고객 링크에는 내부
            매장·디자이너 ID가 포함되지 않습니다.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">설문 버전</span>
          <strong className="ml-3 text-foreground">{PROTOTYPE_SURVEY_VERSION}</strong>
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <fieldset>
            <legend className="text-lg font-semibold text-foreground">1. 매장 선택</legend>
            {storesQuery.isLoading ? (
              <LoadingLabel />
            ) : storesQuery.isError ? (
              <QueryError onRetry={() => storesQuery.refetch()} />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {storesQuery.data?.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => {
                      setStoreId(store.id);
                      setDesignerId("");
                      setLaunch(null);
                    }}
                    className={cn(
                      "flex min-h-16 items-center justify-between rounded-xl border-2 px-4 text-left font-semibold transition-colors",
                      storeId === store.id
                        ? "border-accent bg-accent-soft text-accent-soft-foreground"
                        : "border-border hover:border-accent/60 hover:bg-muted/60",
                    )}
                  >
                    {store.name}
                    {storeId === store.id ? <Check className="size-5" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            )}
          </fieldset>

          <fieldset disabled={!storeId}>
            <legend className="text-lg font-semibold text-foreground">2. 담당 디자이너 선택</legend>
            {!storeId ? (
              <p className="mt-4 rounded-xl bg-muted px-4 py-5 text-sm text-muted-foreground">
                먼저 매장을 선택해 주세요.
              </p>
            ) : designersQuery.isLoading ? (
              <LoadingLabel />
            ) : designersQuery.isError ? (
              <QueryError onRetry={() => designersQuery.refetch()} />
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {designersQuery.data?.map((designer) => (
                  <button
                    key={designer.id}
                    type="button"
                    onClick={() => {
                      setDesignerId(designer.id);
                      setLaunch(null);
                    }}
                    className={cn(
                      "min-h-16 rounded-xl border-2 px-4 text-left transition-colors",
                      designerId === designer.id
                        ? "border-accent bg-accent-soft text-accent-soft-foreground"
                        : "border-border hover:border-accent/60 hover:bg-muted/60",
                    )}
                  >
                    <span className="block font-semibold">{designer.name}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {DESIGNER_LEVEL_LABELS[designer.level] ?? designer.level}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </fieldset>
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm xl:sticky xl:top-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <MonitorSmartphone className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-semibold text-foreground">키오스크 실행</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">매장</dt>
              <dd className="text-right font-medium text-foreground">
                {selectedStore?.name ?? "선택 전"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">담당</dt>
              <dd className="text-right font-medium text-foreground">
                {selectedDesigner?.name ?? "선택 전"}
              </dd>
            </div>
          </dl>

          {!launch ? (
            <Button
              size="lg"
              className="mt-6 h-13 w-full"
              disabled={!storeId || !designerId || creating}
              onClick={createSession}
            >
              {creating ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {creating ? "링크 생성 중" : "고객 링크 만들기"}
            </Button>
          ) : (
            <div className="mt-6 space-y-3">
              <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                <strong className="block">키오스크 준비 완료</strong>
                <span className="mt-1 block text-emerald-700">
                  {new Intl.DateTimeFormat("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(launch.expiresAt))}
                  까지 유효
                </span>
              </div>
              <Button asChild size="lg" className="h-13 w-full">
                <a href={launch.url} target="_blank" rel="noreferrer">
                  고객 설문 열기
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </Button>
              <Button variant="outline" className="h-11 w-full" onClick={copyLink}>
                <Copy className="size-4" aria-hidden="true" />
                링크 복사
              </Button>
              <button
                type="button"
                className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setLaunch(null)}
              >
                새 키오스크 준비
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function LoadingLabel() {
  return (
    <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      불러오는 중
    </p>
  );
}

function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
      <p className="text-destructive">목록을 불러오지 못했습니다.</p>
      <button
        type="button"
        className="mt-2 font-semibold text-foreground underline"
        onClick={onRetry}
      >
        다시 시도
      </button>
    </div>
  );
}
