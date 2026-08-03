import { describe, expect, it } from "vitest";

import * as surveySchema from "./survey-schema";

describe("survey form configuration", () => {
  it("creates an editable form while protecting required system fields", () => {
    const createDefaultSurveyConfig = surveySchema.createDefaultSurveyConfig;

    expect(createDefaultSurveyConfig).toBeTypeOf("function");

    const config = createDefaultSurveyConfig!();
    expect(config.fields.find((field) => field.key === "customer_name")?.locked).toBe(true);
    expect(config.fields.find((field) => field.key === "phone")?.locked).toBe(true);
    expect(config.fields.find((field) => field.key === "desired_image")?.locked).not.toBe(true);
  });

  it("includes every field from the paper survey in its original section order", () => {
    const config = surveySchema.createDefaultSurveyConfig();

    expect(config.fields.map((field) => field.key)).toEqual([
      "customer_name",
      "gender",
      "birth_date",
      "phone",
      "address",
      "visit_source",
      "style_photo_plan",
      "preferred_designer_level",
      "interested_services",
      "desired_image",
      "priority_points",
      "scalp_concerns",
      "hair_concerns",
      "homecare_purchase_history",
    ]);
  });

  it("adds a new custom field with a stable internal key", () => {
    const api = surveySchema;
    expect(api.createCustomSurveyField).toBeTypeOf("function");
    expect(api.addSurveyField).toBeTypeOf("function");

    const config = api.createDefaultSurveyConfig!();
    const field = api.createCustomSurveyField!({
      id: "1f1af86e-4ab8-4c5d-b3ec-f23172c40bbd",
      section: "preference",
      type: "SHORT_TEXT",
      label: "평소 손질 시간",
    });
    const next = api.addSurveyField!(config, field);

    expect(field).toMatchObject({
      key: "custom_1f1af86e4ab84c5db3ecf23172c40bbd",
      builtin: false,
      label: "평소 손질 시간",
    });
    expect(next.fields.at(-1)).toMatchObject({ key: field.key });
  });

  it("removes an editable field from the active form", () => {
    const api = surveySchema;
    expect(api.removeSurveyField).toBeTypeOf("function");

    const config = api.createDefaultSurveyConfig!();
    const next = api.removeSurveyField!(config, "desired_image");

    expect(next.fields.some((field) => field.id === "desired_image")).toBe(false);
    expect(config.fields.some((field) => field.id === "desired_image")).toBe(true);
  });

  it("refuses to remove a required system field", () => {
    const api = surveySchema;
    const config = api.createDefaultSurveyConfig!();

    expect(() => api.removeSurveyField!(config, "customer_name")).toThrow(
      "필수 시스템 필드는 삭제할 수 없습니다.",
    );
  });

  it("moves a field relative to adjacent fields in the same section", () => {
    const api = surveySchema;
    expect(api.moveSurveyField).toBeTypeOf("function");
    const config = api.createDefaultSurveyConfig!();

    const next = api.moveSurveyField!(config, "desired_image", "up");
    const preferenceKeys = next.fields
      .filter((field) => field.section === "preference")
      .map((field) => field.id);

    expect(preferenceKeys).toEqual([
      "visit_source",
      "style_photo_plan",
      "preferred_designer_level",
      "desired_image",
      "interested_services",
      "priority_points",
    ]);
  });

  it("updates editable properties without changing the stable field key", () => {
    const api = surveySchema;
    expect(api.updateSurveyField).toBeTypeOf("function");
    const config = api.createDefaultSurveyConfig!();

    const attemptedPatch = {
      key: "changed_key",
      label: "원하는 분위기",
      required: false,
    };
    const next = api.updateSurveyField!(config, "desired_image", attemptedPatch);
    const updated = next.fields.find((field) => field.id === "desired_image");

    expect(updated).toMatchObject({
      key: "desired_image",
      label: "원하는 분위기",
      required: false,
    });
  });

  it("rejects duplicate keys and choice fields with fewer than two options", () => {
    const api = surveySchema;
    expect(api.validateSurveyFormConfig).toBeTypeOf("function");
    const config = api.createDefaultSurveyConfig!();
    config.fields.push({
      ...config.fields[0]!,
      id: "duplicate-name",
    });
    config.fields.push({
      id: "bad-choice",
      key: "custom_badchoice",
      section: "condition",
      type: "SINGLE_CHOICE",
      label: "선택지가 부족한 질문",
      helpText: "",
      required: false,
      builtin: false,
      options: [{ code: "ONLY", label: "하나" }],
    });

    const errors = api.validateSurveyFormConfig!(config);
    expect(errors).toContain("필드 키는 중복될 수 없습니다.");
    expect(errors).toContain("선택형 문항은 선택지가 2개 이상이어야 합니다.");
  });

  it("falls back to the paper form when stored configuration is corrupted", () => {
    const api = surveySchema;
    expect(api.normalizeSurveyFormConfig).toBeTypeOf("function");

    const normalized = api.normalizeSurveyFormConfig!({ revision: "bad", fields: "bad" });

    expect(normalized.revision).toBe(1);
    expect(normalized.fields.map((field) => field.key)).toEqual(
      api.createDefaultSurveyConfig!().fields.map((field) => field.key),
    );
  });

  it("restores deletion protection for required system fields from stored data", () => {
    const api = surveySchema;
    const stored = api.createDefaultSurveyConfig!();
    const customerName = stored.fields.find((field) => field.key === "customer_name")!;
    customerName.locked = false;

    const normalized = api.normalizeSurveyFormConfig!(stored);

    expect(normalized.fields.find((field) => field.key === "customer_name")?.locked).toBe(true);
  });

  it("rejects a configuration containing malformed field definitions", () => {
    const api = surveySchema;

    const normalized = api.normalizeSurveyFormConfig!({
      revision: 2,
      fields: [{ id: 123, key: "<script>" }],
    });

    expect(normalized.revision).toBe(1);
    expect(normalized.fields[0]?.key).toBe("customer_name");
  });

  it("requires the protected customer name and phone fields before saving", () => {
    const api = surveySchema;
    const config = api.createDefaultSurveyConfig!();
    config.fields = config.fields.filter((field) => field.key !== "customer_name");

    expect(api.validateSurveyFormConfig!(config)).toContain(
      "성함과 연락처 시스템 필드는 반드시 포함되어야 합니다.",
    );
  });
});
