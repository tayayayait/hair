import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ErrorSummary, QuestionCard, SingleChoice, TextField } from "@/components/survey/fields";
import { StepLayout, scrollToFirstError } from "@/components/survey/step-layout";
import { GUARDIAN_CONSENT_TEXT, PRIVACY_CONSENT_TEXT, formatPhone } from "@/lib/survey-schema";
import { validateConsentAnswers } from "@/lib/survey-rules";
import { useSurvey } from "@/lib/survey-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/s/$session/")({
  head: () => ({
    meta: [
      { title: "개인정보 수집·이용 동의 | 아이디헤어 설문" },
      {
        name: "description",
        content: "설문 시작 전 개인정보 수집·이용 항목과 목적을 확인하고 동의해 주세요.",
      },
      { property: "og:title", content: "개인정보 수집·이용 동의 | 아이디헤어 설문" },
      { property: "og:description", content: "설문 시작 전 개인정보 동의 안내." },
    ],
  }),
  component: ConsentStep,
});

function ConsentBox({
  text,
  checked,
  onChange,
  label,
}: {
  text: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div>
      <div className="max-h-64 overflow-y-auto whitespace-pre-line rounded-xl border border-border bg-secondary/60 p-4 text-[15px] leading-6 text-foreground">
        {text}
      </div>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-4 flex min-h-[64px] w-full items-center gap-3 rounded-xl border-2 px-4 text-left text-base font-semibold transition-colors",
          checked
            ? "border-accent bg-accent-soft text-accent-soft-foreground"
            : "border-border bg-card hover:border-accent/60 hover:bg-secondary",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-md border-2",
            checked ? "border-accent bg-accent text-accent-foreground" : "border-input bg-card",
          )}
        >
          {checked ? (
            <svg
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M4 10.5 8 14.5 16 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </span>
        {label}
      </button>
    </div>
  );
}

function ConsentStep() {
  const navigate = useNavigate();
  const { session: sessionId } = useParams({ from: "/s/$session" });
  const { answers, set } = useSurvey();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMinor = answers.age_14_or_over === "NO";

  const next = () => {
    const e = validateConsentAnswers(answers);
    setErrors(e);
    const firstError = Object.keys(e)[0];
    if (firstError) {
      requestAnimationFrame(() => scrollToFirstError(firstError));
      return;
    }
    navigate({ to: "/s/$session/basic", params: { session: sessionId } });
  };

  return (
    <StepLayout
      title="설문을 시작하기 전에"
      description="상담에 필요한 정보를 안전하게 보관하기 위해 아래 내용을 확인해 주세요."
      onNext={next}
      nextLabel="동의하고 시작"
    >
      <ErrorSummary errors={Object.entries(errors).map(([id, message]) => ({ id, message }))} />

      <QuestionCard id="age" label="만 14세 이상입니다" required error={errors["age"]}>
        <SingleChoice
          name="만 14세 이상 여부"
          options={[
            { code: "YES", label: "예, 만 14세 이상입니다" },
            { code: "NO", label: "아니요, 만 14세 미만입니다" },
          ]}
          value={answers.age_14_or_over}
          onChange={(code) => set("age_14_or_over", code as "YES" | "NO")}
        />
      </QuestionCard>

      <QuestionCard id="privacy" label="개인정보 수집·이용 동의" required error={errors["privacy"]}>
        <ConsentBox
          text={PRIVACY_CONSENT_TEXT}
          checked={answers.privacy_consent}
          onChange={(v) => set("privacy_consent", v)}
          label="위 내용을 확인했으며 개인정보 수집·이용에 동의합니다."
        />
      </QuestionCard>

      {isMinor ? (
        <>
          <QuestionCard
            id="guardian_name"
            label="법정대리인 정보"
            required
            help="만 14세 미만 고객은 법정대리인의 정보와 동의가 필요합니다."
            error={
              errors["guardian_name"] || errors["guardian_phone"] || errors["guardian_relationship"]
            }
          >
            <div className="space-y-3">
              <TextField
                label="법정대리인 성명"
                placeholder="법정대리인 성명"
                maxLength={50}
                value={answers.guardian_name}
                onChange={(v) => set("guardian_name", v)}
                error={errors["guardian_name"]}
              />
              <TextField
                label="법정대리인 연락처"
                placeholder="010-0000-0000"
                inputMode="tel"
                value={answers.guardian_phone}
                onChange={(v) => set("guardian_phone", formatPhone(v))}
                error={errors["guardian_phone"]}
              />
              <TextField
                label="고객과의 관계"
                placeholder="예: 모, 부"
                maxLength={30}
                value={answers.guardian_relationship}
                onChange={(v) => set("guardian_relationship", v)}
                error={errors["guardian_relationship"]}
              />
            </div>
          </QuestionCard>

          <QuestionCard
            id="guardian_consent"
            label="법정대리인 개인정보 수집·이용 동의"
            required
            error={errors["guardian_consent"]}
          >
            <ConsentBox
              text={GUARDIAN_CONSENT_TEXT}
              checked={answers.guardian_consent}
              onChange={(v) => set("guardian_consent", v)}
              label="법정대리인으로서 위 내용에 동의합니다."
            />
          </QuestionCard>
        </>
      ) : null}
    </StepLayout>
  );
}
