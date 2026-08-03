import { describe, expect, it } from "vitest";
import {
  buildCustomerSurveyUrl,
  createKioskSessionFromContext,
  isActiveDemoAdmin,
  resolveKioskSessionContext,
} from "./kiosk-session";
import { createDefaultSurveyConfig } from "./survey-schema";

describe("createKioskSessionFromContext", () => {
  const now = new Date("2026-08-03T05:00:00.000Z");

  it("creates a customer-safe session from an opaque token", () => {
    const surveyConfig = createDefaultSurveyConfig();
    surveyConfig.fields = surveyConfig.fields.filter((field) => field.key !== "desired_image");
    expect(
      createKioskSessionFromContext(
        "a".repeat(64),
        {
          store_name: "아이디헤어 강남점",
          designer_name: "김지훈",
          survey_version: "PROTOTYPE_V1",
          survey_config: surveyConfig,
          expires_at: "2026-08-03T06:00:00.000Z",
        },
        now,
      ),
    ).toEqual({
      sessionId: "a".repeat(64),
      storeName: "아이디헤어 강남점",
      designerName: "김지훈",
      surveyVersion: "PROTOTYPE_V1",
      surveyConfig,
      expiresAt: "2026-08-03T06:00:00.000Z",
      startedAt: "2026-08-03T05:00:00.000Z",
    });
  });

  it("rejects expired sessions and unsupported survey versions", () => {
    expect(() =>
      createKioskSessionFromContext(
        "a".repeat(64),
        {
          store_name: "아이디헤어 강남점",
          designer_name: "김지훈",
          survey_version: "OLD_VERSION",
          expires_at: "2026-08-03T06:00:00.000Z",
        },
        now,
      ),
    ).toThrow("지원하지 않는 설문 버전");

    expect(() =>
      createKioskSessionFromContext(
        "a".repeat(64),
        {
          store_name: "아이디헤어 강남점",
          designer_name: "김지훈",
          survey_version: "PROTOTYPE_V1",
          expires_at: "2026-08-03T04:59:59.000Z",
        },
        now,
      ),
    ).toThrow("만료된 키오스크 세션");
  });
});

describe("admin and survey links", () => {
  it("accepts only active demo-admin profiles", () => {
    expect(isActiveDemoAdmin({ role: "DEMO_ADMIN", is_active: true })).toBe(true);
    expect(isActiveDemoAdmin({ role: "DEMO_ADMIN", is_active: false })).toBe(false);
    expect(isActiveDemoAdmin({ role: "DESIGNER", is_active: true })).toBe(false);
  });

  it("encodes the opaque token in the customer URL", () => {
    expect(buildCustomerSurveyUrl("https://demo.example.com", "token/value")).toBe(
      "https://demo.example.com/s/token%2Fvalue",
    );
  });
});

describe("resolveKioskSessionContext", () => {
  const now = new Date("2026-08-03T05:00:00.000Z");
  const token = "a".repeat(64);
  const context = {
    store_name: "아이디헤어 강남점",
    designer_name: "김지훈",
    survey_version: "PROTOTYPE_V1",
    expires_at: "2026-08-03T06:00:00.000Z",
  };

  it("서버가 확인한 활성 세션만 ready로 반환한다", () => {
    expect(resolveKioskSessionContext(token, context, null, now)).toMatchObject({
      status: "ready",
      session: {
        sessionId: token,
        storeName: "아이디헤어 강남점",
        designerName: "김지훈",
      },
    });
  });

  it("조회 결과가 없거나 만료된 세션은 invalid로 구분한다", () => {
    expect(resolveKioskSessionContext("not-a-token", null, null, now)).toEqual({
      status: "invalid",
      message: "올바르지 않은 키오스크 토큰입니다.",
    });
    expect(resolveKioskSessionContext(token, null, null, now)).toEqual({
      status: "invalid",
      message: "키오스크 링크가 만료되었거나 종료되었습니다.",
    });
    expect(
      resolveKioskSessionContext(
        token,
        { ...context, expires_at: "2026-08-03T04:59:59.000Z" },
        null,
        now,
      ),
    ).toMatchObject({ status: "invalid" });
  });

  it("네트워크·서버 오류는 재시도 가능한 error로 구분한다", () => {
    expect(resolveKioskSessionContext(token, null, new Error("network"), now)).toEqual({
      status: "error",
      message: "설문 연결 상태를 확인하지 못했습니다. 네트워크 연결을 확인해 주세요.",
    });
  });
});
