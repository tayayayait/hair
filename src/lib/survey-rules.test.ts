import { describe, expect, it } from "vitest";

import { emptyAnswers } from "./survey-store";
import {
  addSurveyField,
  createCustomSurveyField,
  createDefaultSurveyConfig,
  removeSurveyField,
} from "./survey-schema";
import {
  createSubmissionGate,
  isUnderFourteen,
  normalizeConditionalAnswers,
  toggleMultiSelection,
  validateBasicAnswers,
  validateConsentAnswers,
  validatePreferenceAnswers,
} from "./survey-rules";
import * as surveyRules from "./survey-rules";

describe("toggleMultiSelection", () => {
  it("일반 선택지를 고르면 기존 배타 선택지를 제거한다", () => {
    expect(
      toggleMultiSelection(["DECIDE_AFTER_CONSULTATION"], "CUT", ["DECIDE_AFTER_CONSULTATION"]),
    ).toEqual(["CUT"]);
  });

  it("배타 선택지를 고르면 기존 일반 선택지를 모두 제거한다", () => {
    expect(
      toggleMultiSelection(["CUT", "PERM"], "DECIDE_AFTER_CONSULTATION", [
        "DECIDE_AFTER_CONSULTATION",
      ]),
    ).toEqual(["DECIDE_AFTER_CONSULTATION"]);
  });
});

describe("normalizeConditionalAnswers", () => {
  it("지인소개를 해제하면 소개자 성함을 제거한다", () => {
    const answers = normalizeConditionalAnswers({
      ...emptyAnswers,
      visit_source: ["NAVER_SEARCH"],
      introducer_name: "테스트소개자",
    });

    expect(answers.introducer_name).toBe("");
  });

  it("성인으로 변경하면 법정대리인 정보를 모두 제거한다", () => {
    const answers = normalizeConditionalAnswers({
      ...emptyAnswers,
      age_14_or_over: "YES",
      guardian_name: "테스트보호자",
      guardian_phone: "010-0000-0000",
      guardian_relationship: "부",
      guardian_consent: true,
    });

    expect(answers.guardian_name).toBe("");
    expect(answers.guardian_phone).toBe("");
    expect(answers.guardian_relationship).toBe("");
    expect(answers.guardian_consent).toBe(false);
  });
});

describe("isUnderFourteen", () => {
  const today = new Date("2026-08-03T00:00:00+09:00");

  it("아직 열네 번째 생일이 지나지 않은 고객을 미성년 분기로 판정한다", () => {
    expect(isUnderFourteen("2012-08-04", today)).toBe(true);
  });

  it("열네 번째 생일 당일부터 성인 설문 분기로 판정한다", () => {
    expect(isUnderFourteen("2012-08-03", today)).toBe(false);
  });
});

describe("단계별 검증", () => {
  const today = new Date("2026-08-03T00:00:00+09:00");

  it("숫자나 이모지만 있는 이름과 50자를 넘는 이름을 거부한다", () => {
    for (const customerName of ["1234", "😀😀", "가".repeat(51)]) {
      const result = validateBasicAnswers(
        { ...emptyAnswers, customer_name: customerName, phone: "010-0000-0000" },
        today,
      );
      expect(result.errors["customer_name"]).toBeDefined();
    }
  });

  it("생년월일이 만 14세 미만인데 성인으로 답하면 동의 단계 복귀를 요구한다", () => {
    const result = validateBasicAnswers(
      {
        ...emptyAnswers,
        age_14_or_over: "YES",
        customer_name: "테스트고객",
        phone: "010-0000-0000",
        birth_date: "2015-01-01",
      },
      today,
    );

    expect(result.requiresGuardianConsent).toBe(true);
  });

  it("방문동기와 상담 필수 선택을 방문·상담 단계에서 검증한다", () => {
    const errors = validatePreferenceAnswers(emptyAnswers);

    expect(errors["visit_source"]).toBeDefined();
    expect(errors["interested_services"]).toBeDefined();
    expect(errors["desired_image"]).toBeDefined();
    expect(errors["priority_points"]).toBeDefined();
  });

  it("만 14세 미만 고객에게 법정대리인 정보와 별도 동의를 요구한다", () => {
    const errors = validateConsentAnswers({
      ...emptyAnswers,
      age_14_or_over: "NO",
      privacy_consent: true,
    });

    expect(errors["guardian_name"]).toBeDefined();
    expect(errors["guardian_phone"]).toBeDefined();
    expect(errors["guardian_relationship"]).toBeDefined();
    expect(errors["guardian_consent"]).toBeDefined();
  });

  it("관리자가 추가한 필수 문항을 해당 설문 단계에서 검증한다", () => {
    const customField = createCustomSurveyField({
      id: "35137c41-d808-455a-b941-8e2a5d8bd6c1",
      section: "preference",
      type: "SHORT_TEXT",
      label: "평소 손질 시간",
    });
    const config = addSurveyField(
      createDefaultSurveyConfig(),
      { ...customField, required: true },
    );

    const errors = validatePreferenceAnswers(emptyAnswers, config);

    expect(errors[customField.key]).toBe("평소 손질 시간을(를) 입력해 주세요.");
  });

  it("관리자가 제거한 기존 문항은 더 이상 필수 검증하지 않는다", () => {
    const config = removeSurveyField(createDefaultSurveyConfig(), "desired_image");

    const errors = validatePreferenceAnswers(emptyAnswers, config);

    expect(errors["desired_image"]).toBeUndefined();
    expect(errors["visit_source"]).toBeDefined();
  });

  it("기본 정보 단계의 사용자 정의 필수 문항을 검증한다", () => {
    const customField = {
      ...createCustomSurveyField({
        id: "4c44ae69-bff5-483b-ad7c-091e682129dc",
        section: "basic" as const,
        type: "SHORT_TEXT" as const,
        label: "선호 연락 시간",
      }),
      required: true,
    };
    const config = addSurveyField(createDefaultSurveyConfig(), customField);
    const result = validateBasicAnswers(
      { ...emptyAnswers, customer_name: "테스트 고객", phone: "010-0000-0000" },
      today,
      config,
    );

    expect(result.errors[customField.key]).toBeDefined();
  });

  it("모발·두피 단계의 사용자 정의 필수 문항을 검증한다", () => {
    const validateConditionAnswers = (
      surveyRules as typeof surveyRules & {
        validateConditionAnswers?: (
          answers: typeof emptyAnswers,
          config: ReturnType<typeof createDefaultSurveyConfig>,
        ) => Record<string, string>;
      }
    ).validateConditionAnswers;
    expect(validateConditionAnswers).toBeTypeOf("function");
    const customField = {
      ...createCustomSurveyField({
        id: "22186a24-3242-4afb-bf97-9f81c391202c",
        section: "condition" as const,
        type: "MULTI_CHOICE" as const,
        label: "현재 사용 제품",
      }),
      required: true,
    };
    const config = addSurveyField(createDefaultSurveyConfig(), customField);

    expect(validateConditionAnswers!(emptyAnswers, config)[customField.key]).toBeDefined();
  });
});

describe("createSubmissionGate", () => {
  it("진행 중인 제출이 끝나기 전 두 번째 제출을 거부한다", () => {
    const gate = createSubmissionGate();

    expect(gate.tryLock()).toBe(true);
    expect(gate.tryLock()).toBe(false);
    gate.unlock();
    expect(gate.tryLock()).toBe(true);
  });
});
