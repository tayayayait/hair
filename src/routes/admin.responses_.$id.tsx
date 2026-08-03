import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { maskCustomerName, maskPhone } from "@/lib/admin-analytics";
import { fetchAdminResponse } from "@/lib/admin-queries";
import { labelOf, labelsOf } from "@/lib/survey-schema";

export const Route = createFileRoute("/admin/responses_/$id")({
  head: () => ({ meta: [{ title: "응답 상세 | 아이디헤어 관리자" }] }),
  component: ResponseDetail,
});

function ResponseDetail() {
  const { id } = Route.useParams();
  const [showSensitive, setShowSensitive] = useState(false);
  const responseQuery = useQuery({
    queryKey: ["admin", "response", id],
    queryFn: () => fetchAdminResponse(id),
  });

  if (responseQuery.isLoading) return <DetailSkeleton />;
  if (responseQuery.isError) {
    return (
      <DetailState
        title="응답을 불러오지 못했습니다"
        description="접근 권한 또는 네트워크 연결을 확인해 주세요."
        onRetry={() => responseQuery.refetch()}
      />
    );
  }
  if (!responseQuery.data) {
    return (
      <DetailState
        title="응답을 찾을 수 없습니다"
        description="삭제되었거나 접근할 수 없는 응답입니다."
      />
    );
  }

  const response = responseQuery.data;
  const sensitive = {
    name: showSensitive ? response.customer_name : maskCustomerName(response.customer_name),
    phone: showSensitive ? formatPhone(response.phone) : maskPhone(response.phone),
    birthDate: showSensitive ? (response.birth_date ?? "—") : maskBirthDate(response.birth_date),
    address: showSensitive
      ? (response.address ?? "—")
      : response.address
        ? "개인정보 보호를 위해 숨김"
        : "—",
    guardianName: showSensitive
      ? (response.guardian_name ?? "—")
      : response.guardian_name
        ? maskCustomerName(response.guardian_name)
        : "—",
    guardianPhone: showSensitive
      ? response.guardian_phone
        ? formatPhone(response.guardian_phone)
        : "—"
      : response.guardian_phone
        ? maskPhone(response.guardian_phone)
        : "—",
  };

  return (
    <section>
      <Link
        to="/admin/responses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        응답 목록
      </Link>
      <div className="mt-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">RESPONSE DETAIL</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">{sensitive.name} 고객 응답</h1>
          <p className="mt-3 text-muted-foreground">
            {response.store_name_snapshot} · {response.designer_name_snapshot} ·{" "}
            {formatDateTime(response.submitted_at)}
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowSensitive((value) => !value)}>
          {showSensitive ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
          {showSensitive ? "개인정보 가리기" : "개인정보 보기"}
        </Button>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        <DetailSection title="기본 정보">
          <DetailRow label="성함" value={sensitive.name} />
          <DetailRow
            label="성별"
            value={response.gender ? labelOf("gender", response.gender) : "—"}
          />
          <DetailRow label="생년월일" value={sensitive.birthDate} />
          <DetailRow label="연락처" value={sensitive.phone} />
          <DetailRow label="주소" value={sensitive.address} />
          <DetailRow
            label="만 14세 이상"
            value={response.age_14_or_over === "YES" ? "예" : "아니요"}
          />
        </DetailSection>

        <DetailSection title="방문·상담 정보">
          <DetailRow label="방문동기" value={joinLabels("visit_source", response.visit_source)} />
          {response.visit_source.includes("INTRODUCTION") ? (
            <DetailRow label="소개자 성함" value={response.introducer_name ?? "—"} />
          ) : null}
          <DetailRow
            label="스타일 사진"
            value={
              response.style_photo_plan
                ? labelOf("style_photo_plan", response.style_photo_plan)
                : "—"
            }
          />
          <DetailRow
            label="희망 직급"
            value={
              response.preferred_designer_level
                ? labelOf("preferred_designer_level", response.preferred_designer_level)
                : "—"
            }
          />
          <DetailRow
            label="관심 시술"
            value={joinLabels("interested_services", response.interested_services)}
          />
          <DetailRow
            label="원하는 이미지"
            value={joinLabels("desired_image", response.desired_image)}
          />
          <DetailRow
            label="중요 포인트"
            value={joinLabels("priority_points", response.priority_points)}
          />
        </DetailSection>

        <DetailSection title="모발·두피 정보">
          <DetailRow
            label="두피 고민"
            value={joinLabels("scalp_concerns", response.scalp_concerns)}
          />
          <DetailRow
            label="모발 고민"
            value={joinLabels("hair_concerns", response.hair_concerns)}
          />
          <DetailRow
            label="홈케어 구매 이력"
            value={joinLabels("homecare_purchase_history", response.homecare_purchase_history)}
          />
        </DetailSection>

        <DetailSection title="제출·동의 정보">
          <DetailRow label="매장" value={response.store_name_snapshot} />
          <DetailRow label="담당 디자이너" value={response.designer_name_snapshot} />
          <DetailRow label="제출 시각" value={formatDateTime(response.submitted_at)} />
          <DetailRow label="설문 버전" value={response.survey_version} />
          <DetailRow label="개인정보 동의 버전" value={response.privacy_consent_version} />
          {response.age_14_or_over === "NO" ? (
            <>
              <DetailRow label="법정대리인 성명" value={sensitive.guardianName} />
              <DetailRow label="법정대리인 연락처" value={sensitive.guardianPhone} />
              <DetailRow label="고객과의 관계" value={response.guardian_relationship ?? "—"} />
            </>
          ) : null}
        </DetailSection>
      </div>
    </section>
  );
}

type OptionKey = Parameters<typeof labelsOf>[0];

function joinLabels(key: OptionKey, values: string[]) {
  return labelsOf(key, values).join(", ") || "—";
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <dl className="mt-4 divide-y divide-border">{children}</dl>
    </article>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[150px_1fr] sm:gap-5">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground sm:text-base">{value}</dd>
    </div>
  );
}

function formatPhone(value: string) {
  if (value.length === 11) return `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
  if (value.length === 10) return `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6)}`;
  return value;
}

function maskBirthDate(value: string | null) {
  return value ? `${value.slice(0, 4)}-**-**` : "—";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-label="응답 상세 불러오는 중">
      <div className="h-28 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}

function DetailState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-sm">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <div className="mt-6 flex justify-center gap-3">
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            다시 시도
          </Button>
        ) : null}
        <Button asChild>
          <Link to="/admin/responses">응답 목록</Link>
        </Button>
      </div>
    </div>
  );
}
