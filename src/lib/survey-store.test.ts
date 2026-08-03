import { beforeEach, describe, expect, it } from "vitest";

import {
  clearSurveyAnswers,
  loadKioskSession,
  saveKioskSession,
  type KioskSession,
} from "./survey-store";
import { createDefaultSurveyConfig } from "./survey-schema";

describe("clearSurveyAnswers", () => {
  beforeEach(() => sessionStorage.clear());

  it("다음 고객을 위해 답변만 지우고 키오스크 세션은 유지한다", () => {
    const session: KioskSession = {
      sessionId: "a".repeat(64),
      storeName: "아이디헤어 테스트점",
      designerName: "테스트 디자이너",
      surveyVersion: "PROTOTYPE_V1",
      surveyConfig: createDefaultSurveyConfig(),
      expiresAt: "2026-08-03T08:00:00.000Z",
      startedAt: "2026-08-03T00:00:00.000Z",
    };
    saveKioskSession(session);
    sessionStorage.setItem(
      `idhair.answers.${session.sessionId}`,
      JSON.stringify({ customer_name: "테스트" }),
    );

    clearSurveyAnswers(session.sessionId);

    expect(sessionStorage.getItem(`idhair.answers.${session.sessionId}`)).toBeNull();
    expect(loadKioskSession(session.sessionId)).toEqual(session);
  });
});
