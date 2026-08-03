import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CalendarDays, Scissors, Store } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AdminFilters } from "@/components/admin/admin-filters";
import { Button } from "@/components/ui/button";
import {
  aggregateDashboardRows,
  maskCustomerName,
  maskPhone,
  type AdminDateRange,
  type AnalyticsResponseRow,
} from "@/lib/admin-analytics";
import { fetchAdminFilterOptions, fetchAdminResponses } from "@/lib/admin-queries";
import { labelOf } from "@/lib/survey-schema";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "대시보드 | 아이디헤어 관리자" }] }),
  component: AdminDashboard,
});

const PIE_COLORS = ["#a66d4f", "#657958", "#58483e", "#d0a476", "#3f7c67", "#8c6fa3"];

function AdminDashboard() {
  const [range, setRange] = useState<AdminDateRange>("30d");
  const [storeId, setStoreId] = useState("");
  const [designerId, setDesignerId] = useState("");

  const optionsQuery = useQuery({
    queryKey: ["admin", "filter-options"],
    queryFn: fetchAdminFilterOptions,
  });
  const responsesQuery = useQuery({
    queryKey: ["admin", "dashboard-responses", range, storeId, designerId],
    queryFn: () =>
      fetchAdminResponses({
        range,
        storeId,
        designerId,
      }) as Promise<AnalyticsResponseRow[]>,
  });

  const analytics = aggregateDashboardRows(responsesQuery.data ?? []);
  const serviceChartData = analytics.serviceCounts.slice(0, 6).map((item) => ({
    ...item,
    label: labelOf("interested_services", item.code),
  }));
  const topService = serviceChartData[0];
  const hasError = optionsQuery.isError || responsesQuery.isError;

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">ADMIN DASHBOARD</p>
          <h1 className="mt-2 text-balance text-3xl font-bold text-foreground">
            신규 고객 설문 현황
          </h1>
          <p className="mt-3 text-muted-foreground">
            같은 필터 기준으로 KPI, 차트, 최근 응답을 집계합니다.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/admin/responses">전체 응답 보기</Link>
        </Button>
      </div>

      <div className="mt-7">
        <AdminFilters
          range={range}
          storeId={storeId}
          designerId={designerId}
          stores={optionsQuery.data?.stores ?? []}
          designers={optionsQuery.data?.designers ?? []}
          onRangeChange={setRange}
          onStoreChange={(value) => {
            setStoreId(value);
            setDesignerId("");
          }}
          onDesignerChange={setDesignerId}
        />
      </div>

      {hasError ? (
        <ErrorState
          onRetry={() => {
            void optionsQuery.refetch();
            void responsesQuery.refetch();
          }}
        />
      ) : responsesQuery.isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="전체 제출" value={analytics.total} icon={BarChart3} suffix="건" />
            <KpiCard label="오늘 제출" value={analytics.today} icon={CalendarDays} suffix="건" />
            <KpiCard
              label="응답 매장"
              value={analytics.storeCounts.length}
              icon={Store}
              suffix="곳"
            />
            <KpiCard
              label="관심 시술 1위"
              value={topService?.label ?? "—"}
              icon={Scissors}
              suffix={topService ? `${topService.count}건` : undefined}
            />
          </div>

          {analytics.total === 0 ? (
            <EmptyDashboard />
          ) : (
            <>
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <ChartCard title="매장별 제출 건수" description="선택한 기간의 매장별 응답 수">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={analytics.storeCounts}
                      margin={{ top: 12, right: 8, left: -20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e2dc" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        fontSize={12}
                      />
                      <Tooltip cursor={{ fill: "#f5f1ec" }} />
                      <Bar dataKey="count" name="제출 건수" fill="#a66d4f" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="관심 시술 분포" description="복수 선택을 포함한 상위 6개 항목">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={serviceChartData}
                        dataKey="count"
                        nameKey="label"
                        innerRadius={62}
                        outerRadius={100}
                        paddingAngle={3}
                      >
                        {serviceChartData.map((item, index) => (
                          <Cell key={item.code} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {serviceChartData.map((item, index) => (
                      <span key={item.code} className="inline-flex items-center gap-1.5">
                        <span
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        {item.label} {item.count}
                      </span>
                    ))}
                  </div>
                </ChartCard>
              </div>

              <RecentResponses rows={analytics.recent} />
            </>
          )}
        </>
      )}
    </section>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: number | string;
  icon: typeof BarChart3;
  suffix?: string | undefined;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {typeof value === "number" ? new Intl.NumberFormat("ko-KR").format(value) : value}
          </p>
          {suffix ? <p className="mt-1 text-xs text-muted-foreground">{suffix}</p> : null}
        </div>
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function RecentResponses({ rows }: { rows: AnalyticsResponseRow[] }) {
  return (
    <article className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">최근 응답</h2>
          <p className="mt-1 text-sm text-muted-foreground">개인정보는 기본 마스킹됩니다.</p>
        </div>
        <Link to="/admin/responses" className="text-sm font-semibold text-accent">
          전체 보기
        </Link>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <Link
            key={row.id}
            to="/admin/responses/$id"
            params={{ id: row.id }}
            className="grid gap-2 px-5 py-4 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center sm:px-6"
          >
            <span className="font-semibold text-foreground">
              {maskCustomerName(row.customer_name)}
            </span>
            <span className="text-sm text-muted-foreground">{maskPhone(row.phone)}</span>
            <span className="text-sm text-muted-foreground">
              {row.store_name_snapshot} · {row.designer_name_snapshot}
            </span>
            <time className="text-xs text-muted-foreground">
              {formatSubmittedAt(row.submitted_at)}
            </time>
          </Link>
        ))}
      </div>
    </article>
  );
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 space-y-6" aria-label="대시보드 불러오는 중">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <h2 className="text-xl font-semibold text-foreground">선택한 조건의 응답이 없습니다</h2>
      <p className="mt-2 text-muted-foreground">키오스크에서 합성 고객 설문을 제출해 보세요.</p>
      <Button asChild className="mt-6">
        <Link to="/admin/kiosk">키오스크 준비</Link>
      </Button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-foreground">대시보드를 불러오지 못했습니다</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        네트워크 연결을 확인한 뒤 다시 시도해 주세요.
      </p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
