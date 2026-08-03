import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ClipboardList } from "lucide-react";
import { AdminFilters } from "@/components/admin/admin-filters";
import { Button } from "@/components/ui/button";
import { maskCustomerName, maskPhone, type AdminDateRange } from "@/lib/admin-analytics";
import { fetchAdminFilterOptions, fetchAdminResponses } from "@/lib/admin-queries";
import { digitsOnly, labelsOf } from "@/lib/survey-schema";

export const Route = createFileRoute("/admin/responses")({
  head: () => ({ meta: [{ title: "설문 응답 | 아이디헤어 관리자" }] }),
  component: AdminResponses,
});

function AdminResponses() {
  const [range, setRange] = useState<AdminDateRange>("30d");
  const [storeId, setStoreId] = useState("");
  const [designerId, setDesignerId] = useState("");
  const [search, setSearch] = useState("");

  const optionsQuery = useQuery({
    queryKey: ["admin", "filter-options"],
    queryFn: fetchAdminFilterOptions,
  });
  const responsesQuery = useQuery({
    queryKey: ["admin", "responses", range, storeId, designerId],
    queryFn: () =>
      fetchAdminResponses({
        range,
        storeId,
        designerId,
      }),
  });

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ko");
    const phoneQuery = digitsOnly(search);
    if (!query && !phoneQuery) return responsesQuery.data ?? [];

    return (responsesQuery.data ?? []).filter(
      (row) =>
        row.customer_name.toLocaleLowerCase("ko").includes(query) ||
        (phoneQuery.length > 0 && digitsOnly(row.phone).includes(phoneQuery)),
    );
  }, [responsesQuery.data, search]);

  const hasError = optionsQuery.isError || responsesQuery.isError;

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">SURVEY RESPONSES</p>
          <h1 className="mt-2 text-balance text-3xl font-bold text-foreground">설문 응답</h1>
          <p className="mt-3 text-muted-foreground">고객 개인정보는 목록에서 기본 마스킹됩니다.</p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          검색 결과 <strong className="ml-2 text-foreground">{filteredRows.length}건</strong>
        </div>
      </div>

      <div className="mt-7">
        <AdminFilters
          range={range}
          storeId={storeId}
          designerId={designerId}
          stores={optionsQuery.data?.stores ?? []}
          designers={optionsQuery.data?.designers ?? []}
          search={search}
          onRangeChange={setRange}
          onStoreChange={(value) => {
            setStoreId(value);
            setDesignerId("");
          }}
          onDesignerChange={setDesignerId}
          onSearchChange={setSearch}
        />
      </div>

      {hasError ? (
        <ResponsesError
          onRetry={() => {
            void optionsQuery.refetch();
            void responsesQuery.refetch();
          }}
        />
      ) : responsesQuery.isLoading ? (
        <ResponsesSkeleton />
      ) : filteredRows.length === 0 ? (
        <ResponsesEmpty hasSearch={Boolean(search.trim())} />
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 font-semibold">제출 시각</th>
                  <th className="px-5 py-4 font-semibold">고객</th>
                  <th className="px-5 py-4 font-semibold">연락처</th>
                  <th className="px-5 py-4 font-semibold">매장·담당</th>
                  <th className="px-5 py-4 font-semibold">관심 시술</th>
                  <th className="px-5 py-4 text-right font-semibold">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/40">
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {formatSubmittedAt(row.submitted_at)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {maskCustomerName(row.customer_name)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-muted-foreground">
                      {maskPhone(row.phone)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {row.store_name_snapshot} · {row.designer_name_snapshot}
                    </td>
                    <td className="max-w-64 px-5 py-4 text-muted-foreground">
                      {labelsOf("interested_services", row.interested_services).join(", ")}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        to="/admin/responses/$id"
                        params={{ id: row.id }}
                        className="font-semibold text-accent"
                      >
                        보기
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 lg:hidden">
            {filteredRows.map((row) => (
              <Link
                key={row.id}
                to="/admin/responses/$id"
                params={{ id: row.id }}
                className="block rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      {maskCustomerName(row.customer_name)}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{maskPhone(row.phone)}</p>
                  </div>
                  <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {row.store_name_snapshot} · {row.designer_name_snapshot}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {labelsOf("interested_services", row.interested_services).join(", ")}
                </p>
                <time className="mt-3 block text-xs text-muted-foreground">
                  {formatSubmittedAt(row.submitted_at)}
                </time>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ResponsesSkeleton() {
  return (
    <div className="mt-6 space-y-3" aria-label="응답 목록 불러오는 중">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function ResponsesEmpty({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <ClipboardList className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-5 text-xl font-semibold text-foreground">
        {hasSearch ? "검색 결과가 없습니다" : "선택한 조건의 응답이 없습니다"}
      </h2>
      <p className="mt-2 text-muted-foreground">필터를 바꾸거나 새 합성 설문을 제출해 보세요.</p>
      <Button asChild className="mt-6">
        <Link to="/admin/kiosk">키오스크 준비</Link>
      </Button>
    </div>
  );
}

function ResponsesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
      <h2 className="text-lg font-semibold text-foreground">응답 목록을 불러오지 못했습니다</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        네트워크 연결을 확인한 뒤 다시 시도해 주세요.
      </p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}
