import { useRef, useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { StepLayout } from "@/components/survey/step-layout";
import { supabase } from "@/integrations/supabase/client";
import {
  PRIVACY_CONSENT_VERSION,
  createDefaultSurveyConfig,
  type SurveyFormField,
  type SurveySectionKey,
} from "@/lib/survey-schema";
import { buildSurveySubmission } from "@/lib/survey-submission";
import { useSurvey, type SurveyAnswers } from "@/lib/survey-store";
import { createSubmissionGate } from "@/lib/survey-rules";
import { DEMO_MODE, submitDemoSurveyResponse } from "@/lib/demo-mode";

export const Route = createFileRoute("/s/$session/review")({
  head: () => ({
    meta: [
      { title: "입력 내용 검토 | 아이디헤어 설문" },
      { name: "description", content: "제출 전 입력한 설문 내용을 확인하고 수정할 수 있습니다." },
      { property: "og:title", content: "입력 내용 검토 | 아이디헤어 설문" },
      { property: "og:description", content: "제출 전 설문 내용을 확인하세요." },
    ],
  }),
  component: ReviewStep,
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-3 last:border-0 sm:flex-row sm:gap-6">
      <dt className="w-44 shrink-0 text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-base text-foreground">{value || "—"}</dd>
    </div>
  );
}

function ReviewStep() {
  const navigate = useNavigate();
  const { session: sessionId } = useParams({ from: "/s/$session" });
  const { answers, session, reset } = useSurvey();
  const [submitting, setSubmitting] = useState(false);
  const submissionGate = useRef(createSubmissionGate());
  const idempotencyKey = useRef(crypto.randomUUID());

  const config = session?.surveyConfig ?? createDefaultSurveyConfig();

  const displayValue = (field: SurveyFormField) => {
    const raw = field.builtin
      ? answers[field.key as keyof SurveyAnswers]
      : answers.custom_answers[field.key];
    if (typeof raw !== "string" && !Array.isArray(raw)) return "";
    const codes = Array.isArray(raw) ? raw : raw ? [raw] : [];
    if (field.type === "SINGLE_CHOICE" || field.type === "MULTI_CHOICE") {
      return codes
        .map((code) => field.options?.find((option) => option.code === code)?.label ?? code)
        .join(", ");
    }
    return typeof raw === "string" ? raw : raw.join(", ");
  };

  const sectionRows = (section: SurveySectionKey) =>
    config.fields
      .filter((field) => field.section === section)
      .map((field) => <Row key={field.id} label={field.label} value={displayValue(field)} />);

  const submit = async () => {
    if (!submissionGate.current.tryLock()) return;
    if (!session) {
      submissionGate.current.unlock();
      toast.error("키오스크 세션이 만료되었습니다. 직원에게 문의해 주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const submission = buildSurveySubmission({
        kioskToken: session.sessionId,
        idempotencyKey: idempotencyKey.current,
        answers,
        surveyConfig: session.surveyConfig,
      });
      if (DEMO_MODE) {
        submitDemoSurveyResponse(session.sessionId, idempotencyKey.current, submission.p_payload);
      } else {
        const { error } = await supabase.rpc("submit_survey_response", submission);
        if (error) throw error;
      }

      reset();
      navigate({ to: "/s/$session/complete", params: { session: sessionId }, replace: true });
    } catch {
      submissionGate.current.unlock();
      toast.error("제출에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <StepLayout
      step={4}
      title="입력 내용 검토"
      description="아래 내용이 맞는지 확인한 뒤 제출해 주세요."
      onNext={submit}
      nextLabel={submitting ? "제출 중…" : "제출하기"}
      nextDisabled={submitting}
      nextBusy={submitting}
      backTo="/s/$session/condition"
    >
      <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-foreground">기본 정보</h2>
        <dl className="mt-3">{sectionRows("basic")}</dl>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-foreground">방문·상담 정보</h2>
        <dl className="mt-3">
          {sectionRows("preference")}
          {answers.visit_source.includes("INTRODUCTION") ? (
            <Row label="소개자 성함" value={answers.introducer_name} />
          ) : null}
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-semibold text-foreground">모발·두피 정보</h2>
        <dl className="mt-3">{sectionRows("condition")}</dl>
      </section>

      <p className="text-sm text-muted-foreground">
        담당 디자이너: {session?.designerName ?? "—"} · 개인정보 동의 버전 {PRIVACY_CONSENT_VERSION}
      </p>
    </StepLayout>
  );
}
