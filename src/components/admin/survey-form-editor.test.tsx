import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import * as adminShell from "./admin-shell";
import { createDefaultSurveyConfig, type SurveyFormConfig } from "@/lib/survey-schema";

type SurveyFormEditorComponent = (props: {
  config: SurveyFormConfig;
  onChange: (config: SurveyFormConfig) => void;
}) => React.ReactNode;

afterEach(cleanup);

describe("SurveyFormEditor", () => {
  function renderEditor() {
    const SurveyFormEditor = (
      adminShell as typeof adminShell & {
        SurveyFormEditor?: SurveyFormEditorComponent;
      }
    ).SurveyFormEditor as SurveyFormEditorComponent;
    function Harness() {
      const [config, setConfig] = useState(createDefaultSurveyConfig());
      return <SurveyFormEditor config={config} onChange={setConfig} />;
    }
    render(<Harness />);
  }

  it("adds a custom short-text field from the field palette", () => {
    const SurveyFormEditor = (
      adminShell as typeof adminShell & {
        SurveyFormEditor?: SurveyFormEditorComponent;
      }
    ).SurveyFormEditor;
    expect(SurveyFormEditor).toBeTypeOf("function");
    const Editor = SurveyFormEditor as SurveyFormEditorComponent;

    function Harness() {
      const [config, setConfig] = useState(createDefaultSurveyConfig());
      return <Editor config={config} onChange={setConfig} />;
    }

    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "짧은 답변 추가" }));

    expect(screen.getByDisplayValue("새 질문")).toBeInTheDocument();
  });

  it("removes a selected editable field", () => {
    renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "원하는 이미지 문항 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "선택 문항 삭제" }));

    expect(
      screen.queryByRole("button", { name: "원하는 이미지 문항 선택" }),
    ).not.toBeInTheDocument();
  });

  it("moves a selected field upward within its section", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "원하는 이미지 문항 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "선택 문항 위로 이동" }));

    const labels = screen
      .getAllByRole("button", { name: /문항 선택$/ })
      .map((button) => button.textContent ?? "");
    expect(labels.findIndex((label) => label.includes("원하는 이미지"))).toBeLessThan(
      labels.findIndex((label) => label.includes("관심 있는 메뉴")),
    );
  });

  it("edits the selected field label and required state", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "원하는 이미지 문항 선택" }));
    fireEvent.change(screen.getByRole("textbox", { name: "문항 제목" }), {
      target: { value: "원하는 분위기" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: "필수 문항" }));

    expect(screen.getByRole("button", { name: "원하는 분위기 문항 선택" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "필수 문항" })).not.toBeChecked();
  });

  it("adds a custom choice field with two editable options", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "단일 선택 추가" }));

    expect(screen.getByDisplayValue("새 단일 선택 질문")).toBeInTheDocument();
    expect(screen.getByDisplayValue("선택지 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("선택지 2")).toBeInTheDocument();
  });

  it("adds a custom multiple-choice field", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "복수 선택 추가" }));

    expect(screen.getByDisplayValue("새 복수 선택 질문")).toBeInTheDocument();
  });

  it("edits custom choice labels", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "단일 선택 추가" }));
    const option = screen.getByDisplayValue("선택지 1");

    fireEvent.change(option, { target: { value: "오전" } });

    expect(screen.getByDisplayValue("오전")).toBeInTheDocument();
  });

  it("restores a removed paper-survey field from the palette", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "원하는 이미지 문항 선택" }));
    fireEvent.click(screen.getByRole("button", { name: "선택 문항 삭제" }));

    fireEvent.click(screen.getByRole("button", { name: "원하는 이미지 다시 추가" }));

    expect(screen.getByRole("button", { name: "원하는 이미지 문항 선택" })).toBeInTheDocument();
  });

  it("moves a custom field to another survey section", () => {
    renderEditor();
    fireEvent.click(screen.getByRole("button", { name: "짧은 답변 추가" }));
    const section = screen.getByRole("combobox", { name: "설문 단계" });

    fireEvent.change(section, { target: { value: "condition" } });

    expect(section).toHaveValue("condition");
  });
});
