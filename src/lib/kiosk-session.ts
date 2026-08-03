import { PROTOTYPE_SURVEY_VERSION } from "./survey-submission";
import { normalizeSurveyFormConfig, type SurveyFormConfig } from "./survey-schema";

export type KioskContext = {
  store_name: string;
  designer_name: string;
  survey_version: string;
  survey_config?: unknown;
  expires_at: string;
};

export type CustomerKioskSession = {
  sessionId: string;
  storeName: string;
  designerName: string;
  surveyVersion: typeof PROTOTYPE_SURVEY_VERSION;
  surveyConfig: SurveyFormConfig;
  expiresAt: string;
  startedAt: string;
};

export type KioskSessionResolution =
  | { status: "ready"; session: CustomerKioskSession; message: null }
  | { status: "invalid" | "error"; message: string };

export function isOpaqueKioskToken(token: string): boolean {
  return /^[0-9a-f]{64}$/.test(token);
}

export function createKioskSessionFromContext(
  token: string,
  context: KioskContext,
  now = new Date(),
): CustomerKioskSession {
  if (!isOpaqueKioskToken(token)) throw new Error("올바르지 않은 키오스크 토큰입니다.");
  if (context.survey_version !== PROTOTYPE_SURVEY_VERSION) {
    throw new Error("지원하지 않는 설문 버전입니다.");
  }

  const expiresAt = new Date(context.expires_at);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt <= now) {
    throw new Error("만료된 키오스크 세션입니다.");
  }

  return {
    sessionId: token,
    storeName: context.store_name,
    designerName: context.designer_name,
    surveyVersion: PROTOTYPE_SURVEY_VERSION,
    surveyConfig: normalizeSurveyFormConfig(context.survey_config),
    expiresAt: context.expires_at,
    startedAt: now.toISOString(),
  };
}

export function resolveKioskSessionContext(
  token: string,
  context: KioskContext | null | undefined,
  requestError: unknown,
  now = new Date(),
): KioskSessionResolution {
  if (!isOpaqueKioskToken(token)) {
    return {
      status: "invalid",
      message: "올바르지 않은 키오스크 토큰입니다.",
    };
  }

  if (requestError) {
    return {
      status: "error",
      message: "설문 연결 상태를 확인하지 못했습니다. 네트워크 연결을 확인해 주세요.",
    };
  }

  if (!context) {
    return {
      status: "invalid",
      message: "키오스크 링크가 만료되었거나 종료되었습니다.",
    };
  }

  try {
    return {
      status: "ready",
      session: createKioskSessionFromContext(token, context, now),
      message: null,
    };
  } catch (error) {
    return {
      status: "invalid",
      message: error instanceof Error ? error.message : "사용할 수 없는 키오스크 링크입니다.",
    };
  }
}

export function isActiveDemoAdmin(profile: { role: string; is_active: boolean } | null): boolean {
  return Boolean(profile?.is_active && profile.role === "DEMO_ADMIN");
}

export function buildCustomerSurveyUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/s/${encodeURIComponent(token)}`;
}
