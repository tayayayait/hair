import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ConfiguredSurveyField, ErrorSummary } from "@/components/survey/fields";
import { StepLayout, scrollToFirstError } from "@/components/survey/step-layout";
import { createDefaultSurveyConfig } from "@/lib/survey-schema";
import { validateConditionAnswers } from "@/lib/survey-rules";
import { useSurvey } from "@/lib/survey-store";

export const Route = createFileRoute("/s/$session/condition")({
  head: () => ({
    meta: [
      { title: "모발·두피 정보 | 아이디헤어 설문" },
      { name: "description", content: "두피 고민, 모발 고민, 홈케어 구매 이력을 선택합니다." },
      { property: "og:title", content: "모발·두피 정보 | 아이디헤어 설문" },
      { property: "og:description", content: "모발과 두피 상태를 알려주는 단계입니다." },
    ],
  }),
  component: ConditionStep,
});

function ConditionStep() {
  const navigate = useNavigate();
  const { session: sessionId } = useParams({ from: "/s/$session" });
  const { answers, set, session } = useSurvey();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const config = session?.surveyConfig ?? createDefaultSurveyConfig();

  const next = () => {
    const nextErrors = validateConditionAnswers(answers, config);
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      requestAnimationFrame(() => scrollToFirstError(firstError));
      return;
    }
    navigate({ to: "/s/$session/review", params: { session: sessionId } });
  };

  return (
    <StepLayout
      step={3}
      title="모발·두피 정보"
      description="해당하는 항목이 없다면 선택하지 않아도 됩니다."
      onNext={next}
      backTo="/s/$session/preference"
    >
      <ErrorSummary errors={Object.entries(errors).map(([id, message]) => ({ id, message }))} />
      {config.fields
        .filter((field) => field.section === "condition")
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
