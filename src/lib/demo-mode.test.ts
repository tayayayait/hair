import { beforeEach, describe, expect, it } from "vitest";
import {
  createDemoKioskSession,
  getDemoFilterOptions,
  getDemoKioskContext,
  getDemoResponse,
  getDemoResponses,
  submitDemoSurveyResponse,
} from "./demo-mode";
import * as demoMode from "./demo-mode";
import { createDefaultSurveyConfig } from "./survey-schema";
import type { SurveySubmissionPayload } from "./survey-submission";

const payload: SurveySubmissionPayload = {
  survey_version: "PROTOTYPE_V1",
  age_14_or_over: "YES",
  privacy_consent: true,
  guardian_name: null,
  guardian_phone: null,
  guardian_relationship: null,
  guardian_consent: false,
  customer_name: "데모 고객",
  gender: "FEMALE",
  birth_date: "1995-05-15",
  phone: "01012345678",
  address: "서울시 데모구",
  visit_source: ["NAVER_SEARCH"],
  introducer_name: null,
  style_photo_plan: "DESIGNER_RECOMMENDATION",
  preferred_designer_level: "DIRECTOR",
  interested_services: ["CUT"],
  desired_image: ["NATURAL"],
  priority_points: ["EASY_MAINTENANCE"],
  scalp_concerns: [],
  hair_concerns: [],
  homecare_purchase_history: [],
  form_revision: 1,
  survey_config: createDefaultSurveyConfig(),
  custom_answers: {},
};

describe("demo mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("provides demo stores and designers without an authenticated user", () => {
    const options = getDemoFilterOptions();
    const store = options.stores[0]!;
    const designer = options.designers[0]!;

    expect(options.stores.length).toBeGreaterThan(0);
    expect(options.designers.length).toBeGreaterThan(0);
    expect(designer.store_id).toBe(store.id);
  });

  it("persists an edited survey form with optimistic revision checks", () => {
    const api = demoMode as typeof demoMode & {
      getDemoSurveyFormConfig?: () => ReturnType<typeof createDefaultSurveyConfig>;
      saveDemoSurveyFormConfig?: (
        config: ReturnType<typeof createDefaultSurveyConfig>,
        expectedRevision: number,
      ) => ReturnType<typeof createDefaultSurveyConfig>;
    };
    expect(api.getDemoSurveyFormConfig).toBeTypeOf("function");
    expect(api.saveDemoSurveyFormConfig).toBeTypeOf("function");

    const config = api.getDemoSurveyFormConfig!();
    config.fields = config.fields.filter((field) => field.key !== "desired_image");
    const saved = api.saveDemoSurveyFormConfig!(config, 1);

    expect(saved.revision).toBe(2);
    expect(api.getDemoSurveyFormConfig!().fields.some((field) => field.key === "desired_image"))
      .toBe(false);
    expect(() => api.saveDemoSurveyFormConfig!(saved, 1)).toThrow("다른 관리자가 먼저 저장");
  });

  it("does not save an invalid survey form", () => {
    const api = demoMode as typeof demoMode & {
      saveDemoSurveyFormConfig?: (
        config: ReturnType<typeof createDefaultSurveyConfig>,
        expectedRevision: number,
      ) => ReturnType<typeof createDefaultSurveyConfig>;
    };
    const config = createDefaultSurveyConfig();
    const desiredImage = config.fields.find((field) => field.key === "desired_image")!;
    desiredImage.options = [{ code: "ONLY", label: "하나" }];

    expect(() => api.saveDemoSurveyFormConfig!(config, 1)).toThrow(
      "선택형 문항은 선택지가 2개 이상이어야 합니다.",
    );
  });

  it("creates a kiosk link that resolves without Supabase auth", () => {
    const { stores, designers } = getDemoFilterOptions();
    const store = stores[0]!;
    const designer = designers[0]!;
    const launch = createDemoKioskSession(store.id, designer.id);

    expect(launch.kiosk_token).toMatch(/^[0-9a-f]{64}$/);
    expect(getDemoKioskContext(launch.kiosk_token)).toMatchObject({
      store_name: store.name,
      designer_name: designer.name,
      survey_version: "PROTOTYPE_V1",
    });
  });

  it("freezes the active form configuration into each new kiosk session", () => {
    const config = demoMode.getDemoSurveyFormConfig();
    config.fields = config.fields.filter((field) => field.key !== "desired_image");
    demoMode.saveDemoSurveyFormConfig(config, config.revision);

    const { stores, designers } = getDemoFilterOptions();
    const launch = createDemoKioskSession(stores[0]!.id, designers[0]!.id);
    const context = getDemoKioskContext(launch.kiosk_token) as ReturnType<
      typeof getDemoKioskContext
    > & { survey_config?: ReturnType<typeof createDefaultSurveyConfig> };

    expect(context?.survey_config?.revision).toBe(2);
    expect(context?.survey_config?.fields.some((field) => field.key === "desired_image")).toBe(
      false,
    );
  });

  it("persists one demo response for repeated submissions with the same key", () => {
    const { stores, designers } = getDemoFilterOptions();
    const store = stores[0]!;
    const designer = designers[0]!;
    const launch = createDemoKioskSession(store.id, designer.id);

    const firstId = submitDemoSurveyResponse(launch.kiosk_token, "demo-idempotency-key", payload);
    const secondId = submitDemoSurveyResponse(launch.kiosk_token, "demo-idempotency-key", payload);

    expect(secondId).toBe(firstId);
    expect(getDemoResponse(firstId)).toMatchObject({
      customer_name: "데모 고객",
      store_id: store.id,
      designer_id: designer.id,
    });
    expect(getDemoResponses()).toHaveLength(2);
  });
});
