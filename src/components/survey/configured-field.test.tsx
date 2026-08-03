import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as SurveyFields from "./fields";
import { createCustomSurveyField, createDefaultSurveyConfig } from "@/lib/survey-schema";
import { emptyAnswers } from "@/lib/survey-store";

afterEach(cleanup);

const ConfiguredSurveyField = (
  SurveyFields as typeof SurveyFields & {
    ConfiguredSurveyField: React.ComponentType<Record<string, unknown>>;
  }
).ConfiguredSurveyField;

describe("ConfiguredSurveyField", () => {
  it("renders the configured label and choices for a built-in field", () => {
    const field = createDefaultSurveyConfig().fields.find((item) => item.key === "gender")!;

    render(
      <ConfiguredSurveyField
        field={{ ...field, label: "고객 성별", options: [{ code: "OPEN", label: "직접 선택" }] }}
        answers={emptyAnswers}
        errors={{}}
        setAnswer={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "고객 성별" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /직접 선택/ })).toBeInTheDocument();
  });

  it("renders single-choice options with square checklist indicators in a dense grid", () => {
    const field = createDefaultSurveyConfig().fields.find((item) => item.key === "gender")!;

    render(
      <ConfiguredSurveyField
        field={field}
        answers={emptyAnswers}
        errors={{}}
        setAnswer={vi.fn()}
      />,
    );

    expect(screen.getByRole("radiogroup", { name: "성별" })).toHaveClass("lg:grid-cols-4");
    expect(screen.getByRole("radio", { name: /남성/ }).querySelector("[aria-hidden]")).toHaveClass(
      "rounded-[2px]",
    );
  });

  it("stores a custom short answer under its stable field key", () => {
    const setAnswer = vi.fn();
    const field = createCustomSurveyField({
      id: "memo-field",
      section: "basic",
      type: "SHORT_TEXT",
      label: "상담 메모",
    });

    render(
      <ConfiguredSurveyField
        field={field}
        answers={emptyAnswers}
        errors={{}}
        setAnswer={setAnswer}
      />,
    );
    fireEvent.change(screen.getByRole("textbox", { name: "상담 메모" }), {
      target: { value: "조용한 상담을 원해요" },
    });

    expect(setAnswer).toHaveBeenCalledWith("custom_answers", {
      [field.key]: "조용한 상담을 원해요",
    });
  });

  it("applies exclusive choice behavior to configured multiple choices", () => {
    const setAnswer = vi.fn();
    const field = {
      ...createCustomSurveyField({
        id: "multi-field",
        section: "condition" as const,
        type: "MULTI_CHOICE" as const,
        label: "추가 고민",
      }),
      options: [
        { code: "DRY", label: "건조함" },
        { code: "NONE", label: "해당 없음", exclusive: true },
      ],
    };
    const answers = {
      ...emptyAnswers,
      custom_answers: { [field.key]: ["DRY"] },
    };

    render(
      <ConfiguredSurveyField field={field} answers={answers} errors={{}} setAnswer={setAnswer} />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /해당 없음/ }));

    expect(setAnswer).toHaveBeenCalledWith("custom_answers", {
      [field.key]: ["NONE"],
    });
  });
});
