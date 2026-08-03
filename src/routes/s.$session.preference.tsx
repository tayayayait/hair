import { useState } from "react";
import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ConfiguredSurveyField, ErrorSummary } from "@/components/survey/fields";
import { StepLayout, scrollToFirstError } from "@/components/survey/step-layout";
import { createDefaultSurveyConfig } from "@/lib/survey-schema";
import { validatePreferenceAnswers } from "@/lib/survey-rules";
import { useSurvey } from "@/lib/survey-store";

export const Route = createFileRoute("/s/$session/preference")({
  head: () => ({
    meta: [
      { title: "방문·상담 정보 | 아이디헤어 설문" },
      {
        name: "description",
        content: "관심 있는 메뉴, 원하는 이미지, 신경 써야 할 포인트를 선택합니다.",
      },
      { property: "og:title", content: "방문·상담 정보 | 아이디헤어 설문" },
      { property: "og:description", content: "상담 선호 정보를 선택하는 단계입니다." },
    ],
  }),
  component: PreferenceStep,
});

function PreferenceStep() {
  const navigate = useNavigate();
  const { session: sessionId } = useParams({ from: "/s/$session" });
  const { answers, set, session } = useSurvey();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const config = session?.surveyConfig ?? createDefaultSurveyConfig();

  const next = () => {
    const e = validatePreferenceAnswers(answers, config);
    setErrors(e);
    const firstError = Object.keys(e)[0];
    if (firstError) {
      requestAnimationFrame(() => scrollToFirstError(firstError));
      return;
    }
    navigate({ to: "/s/$session/condition", params: { session: sessionId } });
  };

  return (
    <StepLayout
      step={2}
      title="방문·상담 정보"
      description="원하시는 스타일과 상담 방향을 알려주세요."
      onNext={next}
      backTo="/s/$session/basic"
    >
      <ErrorSummary errors={Object.entries(errors).map(([id, message]) => ({ id, message }))} />
      {config.fields
        .filter((field) => field.section === "preference")
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
