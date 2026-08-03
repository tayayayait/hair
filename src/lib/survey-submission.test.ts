import { describe, expect, it } from "vitest";
import { PROTOTYPE_SURVEY_VERSION, buildSurveySubmission } from "./survey-submission";
import { emptyAnswers } from "./survey-store";
import { addSurveyField, createCustomSurveyField, createDefaultSurveyConfig } from "./survey-schema";

describe("buildSurveySubmission", () => {
  it("creates a minimal RPC payload without trusting client store or designer data", () => {
    const result = buildSurveySubmission({
      kioskToken: "opaque-kiosk-token",
      idempotencyKey: "d4344a2f-ab1a-48e3-b7c3-2d27edddf179",
      answers: {
        ...emptyAnswers,
        age_14_or_over: "YES",
        privacy_consent: true,
        customer_name: "  테스트 고객  ",
        phone: "010-1234-5678",
        visit_source: ["NAVER_SEARCH"],
        interested_services: ["CUT"],
        desired_image: ["NATURAL"],
        priority_points: ["EASY_MAINTENANCE"],
      },
    });

    expect(result).toMatchObject({
      p_kiosk_token: "opaque-kiosk-token",
      p_idempotency_key: "d4344a2f-ab1a-48e3-b7c3-2d27edddf179",
      p_payload: {
        survey_version: PROTOTYPE_SURVEY_VERSION,
        customer_name: "테스트 고객",
        phone: "01012345678",
        privacy_consent: true,
      },
    });
    expect(result.p_payload).not.toHaveProperty("store_id");
    expect(result.p_payload).not.toHaveProperty("designer_id");
    expect(result.p_payload).not.toHaveProperty("submitted_at");
  });

  it("removes guardian and introducer data when their conditions are false", () => {
    const result = buildSurveySubmission({
      kioskToken: "opaque-kiosk-token",
      idempotencyKey: "d4344a2f-ab1a-48e3-b7c3-2d27edddf179",
      answers: {
        ...emptyAnswers,
        age_14_or_over: "YES",
        privacy_consent: true,
        guardian_name: "남아 있으면 안 됨",
        guardian_phone: "010-1111-2222",
        guardian_relationship: "부",
        guardian_consent: true,
        customer_name: "테스트 고객",
        phone: "010-1234-5678",
        introducer_name: "남아 있으면 안 됨",
        visit_source: ["NEARBY"],
      },
    });

    expect(result.p_payload).toMatchObject({
      guardian_name: null,
      guardian_phone: null,
      guardian_relationship: null,
      guardian_consent: false,
      introducer_name: null,
    });
  });

  it("includes custom answers and the exact form snapshot used by the kiosk session", () => {
    const customField = createCustomSurveyField({
      id: "c5010755-a7a2-4403-85d7-fb3320fd412d",
      section: "preference",
      type: "SHORT_TEXT",
      label: "평소 손질 시간",
    });
    const surveyConfig = addSurveyField(createDefaultSurveyConfig(), customField);
    const result = buildSurveySubmission({
      kioskToken: "opaque-kiosk-token",
      idempotencyKey: "d4344a2f-ab1a-48e3-b7c3-2d27edddf179",
      surveyConfig,
      answers: {
        ...emptyAnswers,
        age_14_or_over: "YES",
        privacy_consent: true,
        customer_name: "테스트 고객",
        phone: "010-1234-5678",
        custom_answers: { [customField.key]: "30분" },
      },
    });

    expect(result.p_payload).toMatchObject({
      form_revision: 1,
      custom_answers: { [customField.key]: "30분" },
      survey_config: {
        fields: expect.arrayContaining([expect.objectContaining({ key: customField.key })]),
      },
    });
  });
});
