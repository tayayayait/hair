import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { ConfiguredSurveyField, ErrorSummary } from "@/components/survey/fields";
import { StepLayout, scrollToFirstError } from "@/components/survey/step-layout";
import { createDefaultSurveyConfig } from "@/lib/survey-schema";
import { validateBasicAnswers } from "@/lib/survey-rules";
import { useSurvey } from "@/lib/survey-store";

export const Route = createFileRoute("/s/$session/basic")({
  head: () => ({
    meta: [
      { title: "기본 정보 입력 | 아이디헤어 설문" },
      {
        name: "description",
        content: "성함, 성별, 생년월일, 연락처와 주소를 입력합니다.",
      },
      { property: "og:title", content: "기본 정보 입력 | 아이디헤어 설문" },
      { property: "og:description", content: "신규 고객 기본 정보를 입력하는 단계입니다." },
    ],
  }),
  component: BasicStep,
});

function BasicStep() {
  const navigate = useNavigate();
  const { session: sessionId } = useParams({ from: "/s/$session" });
  const { answers, set, session } = useSurvey();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const config = session?.surveyConfig ?? createDefaultSurveyConfig();

  const next = () => {
    const result = validateBasicAnswers(answers, new Date(), config);
    setErrors(result.errors);
    const firstError = Object.keys(result.errors)[0];
    if (firstError) {
      requestAnimationFrame(() => scrollToFirstError(firstError));
      return;
    }
    if (result.requiresGuardianConsent) {
      set("age_14_or_over", "NO");
      toast.error("생년월일을 기준으로 법정대리인 동의가 필요합니다.");
      navigate({ to: "/s/$session", params: { session: sessionId } });
      return;
    }
    navigate({ to: "/s/$session/preference", params: { session: sessionId } });
  };

  return (
    <StepLayout
      step={1}
      title="기본 정보"
      description="상담과 예약 안내를 위해 필요한 정보입니다."
      onNext={next}
      backTo="/s/$session"
    >
      <ErrorSummary errors={Object.entries(errors).map(([id, message]) => ({ id, message }))} />
      {config.fields
        .filter((field) => field.section === "basic")
        .map((field) => (
          <ConfiguredSurveyField
            key={field.id}
            field={field}
            answers={answers}
            errors={errors}
            setAnswer={set}
          />
        ))}
    </StepLayout>
  );
}
