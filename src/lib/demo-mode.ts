import type { Tables } from "@/integrations/supabase/types";
import type { KioskContext } from "./kiosk-session";
import {
  createDefaultSurveyConfig,
  normalizeSurveyFormConfig,
  validateSurveyFormConfig,
  type SurveyFormConfig,
} from "./survey-schema";
import type { SurveySubmissionPayload } from "./survey-submission";

export const DEMO_MODE = import.meta.env["VITE_DEMO_MODE"] !== "false";

export type DemoStore = Pick<Tables<"stores">, "id" | "name" | "code">;
export type DemoDesigner = Pick<Tables<"designers">, "id" | "name" | "level" | "store_id">;
export type DemoResponse = Tables<"survey_responses">;

const DEMO_SURVEY_VERSION = "PROTOTYPE_V1";
const DEMO_RESPONSES_STORAGE_KEY = "idhair.demo.responses";
const DEMO_SESSIONS_STORAGE_KEY = "idhair.demo.kiosk-sessions";
const DEMO_SURVEY_FORM_STORAGE_KEY = "idhair.demo.survey-form";

const demoStores: DemoStore[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "아이헤어 강남점",
    code: "GANGNAM",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "아이헤어 홍대점",
    code: "HONGDAE",
  },
];

const demoDesigners: DemoDesigner[] = [
  {
    id: "11111111-1111-4111-8111-111111111112",
    store_id: demoStores[0]!.id,
    name: "김지훈",
    level: "DIRECTOR",
  },
  {
    id: "11111111-1111-4111-8111-111111111113",
    store_id: demoStores[0]!.id,
    name: "이서윤",
    level: "SENIOR_CHIEF_DIRECTOR",
  },
  {
    id: "11111111-1111-4111-8111-111111111114",
    store_id: demoStores[0]!.id,
    name: "박도현",
    level: "VICE_DIRECTOR",
  },
  {
    id: "22222222-2222-4222-8222-222222222223",
    store_id: demoStores[1]!.id,
    name: "최유진",
    level: "DIRECTOR",
  },
  {
    id: "22222222-2222-4222-8222-222222222224",
    store_id: demoStores[1]!.id,
    name: "정민석",
    level: "OWNER_DIRECTOR",
  },
  {
    id: "22222222-2222-4222-8222-222222222225",
    store_id: demoStores[1]!.id,
    name: "한소희",
    level: "DIRECTOR",
  },
];

type DemoKioskSession = {
  token: string;
  sessionId: string;
  storeId: string;
  designerId: string;
  storeName: string;
  designerName: string;
  surveyConfig: SurveyFormConfig;
  expiresAt: string;
};

export function getDemoStores(): DemoStore[] {
  return demoStores.map((store) => ({ ...store }));
}

export function getDemoDesigners(storeId?: string): DemoDesigner[] {
  return demoDesigners
    .filter((designer) => !storeId || designer.store_id === storeId)
    .map((designer) => ({ ...designer }));
}

export function getDemoFilterOptions() {
  return {
    stores: getDemoStores(),
    designers: getDemoDesigners(),
  };
}

export function getDemoSurveyFormConfig(): SurveyFormConfig {
  const stored = readStorage<unknown>(DEMO_SURVEY_FORM_STORAGE_KEY);
  return stored ? normalizeSurveyFormConfig(stored) : createDefaultSurveyConfig();
}

export function saveDemoSurveyFormConfig(
  config: SurveyFormConfig,
  expectedRevision: number,
): SurveyFormConfig {
  const current = getDemoSurveyFormConfig();
  if (current.revision !== expectedRevision) {
    throw new Error("다른 관리자가 먼저 저장했습니다. 최신 설문을 다시 불러와 주세요.");
  }
  const errors = validateSurveyFormConfig(config);
  if (errors.length > 0) throw new Error(errors[0]);
  const next = normalizeSurveyFormConfig({ ...config, revision: current.revision + 1 });
  writeStorage(DEMO_SURVEY_FORM_STORAGE_KEY, next);
  return next;
}

export function getDemoResponses(): DemoResponse[] {
  const stored = readStorage<DemoResponse[]>(DEMO_RESPONSES_STORAGE_KEY);
  return stored ?? [createDemoSampleResponse()];
}

export function getDemoResponse(id: string): DemoResponse | null {
  return getDemoResponses().find((response) => response.id === id) ?? null;
}

export function createDemoKioskSession(storeId: string, designerId: string) {
  const store = demoStores.find((item) => item.id === storeId);
  const designer = demoDesigners.find(
    (item) => item.id === designerId && item.store_id === storeId,
  );
  if (!store || !designer) throw new Error("Demo store or designer was not found");

  const session: DemoKioskSession = {
    token: createOpaqueToken(),
    sessionId: createUuid(),
    storeId,
    designerId,
    storeName: store.name,
    designerName: designer.name,
    surveyConfig: getDemoSurveyFormConfig(),
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  };
  const sessions = getDemoSessions().filter((item) => item.token !== session.token);
  sessions.push(session);
  writeStorage(DEMO_SESSIONS_STORAGE_KEY, sessions);

  return {
    kiosk_token: session.token,
    session_id: session.sessionId,
    expires_at: session.expiresAt,
  };
}

export function getDemoKioskContext(token: string): KioskContext | null {
  const session = getDemoSessions().find((item) => item.token === token);
  if (!session || new Date(session.expiresAt) <= new Date()) return null;
  return {
    store_name: session.storeName,
    designer_name: session.designerName,
    survey_version: DEMO_SURVEY_VERSION,
    survey_config: session.surveyConfig ?? createDefaultSurveyConfig(),
    expires_at: session.expiresAt,
  };
}

export function submitDemoSurveyResponse(
  token: string,
  idempotencyKey: string,
  payload: SurveySubmissionPayload,
): string {
  const session = getDemoSessions().find((item) => item.token === token);
  if (!session || new Date(session.expiresAt) <= new Date()) {
    throw new Error("Demo kiosk session is invalid or expired");
  }

  const responses = getDemoResponses();
  const existing = responses.find(
    (response) =>
      response.kiosk_session_id === session.sessionId &&
      response.idempotency_key === idempotencyKey,
  );
  if (existing) return existing.id;

  const now = new Date().toISOString();
  const response: DemoResponse = {
    id: createUuid(),
    store_id: session.storeId,
    designer_id: session.designerId,
    store_name_snapshot: session.storeName,
    designer_name_snapshot: session.designerName,
    survey_version: DEMO_SURVEY_VERSION,
    kiosk_session_id: session.sessionId,
    idempotency_key: idempotencyKey,
    age_14_or_over: payload.age_14_or_over,
    privacy_consent_version: DEMO_SURVEY_VERSION,
    privacy_consent_at: now,
    guardian_name: payload.guardian_name,
    guardian_phone: payload.guardian_phone,
    guardian_relationship: payload.guardian_relationship,
    guardian_consent_at: payload.guardian_consent ? now : null,
    customer_name: payload.customer_name,
    gender: payload.gender,
    birth_date: payload.birth_date,
    phone: payload.phone,
    address: payload.address,
    visit_source: [...payload.visit_source],
    introducer_name: payload.introducer_name,
    style_photo_plan: payload.style_photo_plan,
    preferred_designer_level: payload.preferred_designer_level,
    interested_services: [...payload.interested_services],
    desired_image: [...payload.desired_image],
    priority_points: [...payload.priority_points],
    scalp_concerns: [...payload.scalp_concerns],
    hair_concerns: [...payload.hair_concerns],
    homecare_purchase_history: [...payload.homecare_purchase_history],
    answers_snapshot: payload,
    status: "SUBMITTED",
    submitted_at: now,
    created_at: now,
  };

  responses.push(response);
  writeStorage(DEMO_RESPONSES_STORAGE_KEY, responses);
  return response.id;
}

function getDemoSessions(): DemoKioskSession[] {
  return readStorage<DemoKioskSession[]>(DEMO_SESSIONS_STORAGE_KEY) ?? [];
}

function createDemoSampleResponse(): DemoResponse {
  const submittedAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  return {
    id: "33333333-3333-4333-8333-333333333333",
    store_id: demoStores[0]!.id,
    designer_id: demoDesigners[0]!.id,
    store_name_snapshot: demoStores[0]!.name,
    designer_name_snapshot: demoDesigners[0]!.name,
    survey_version: DEMO_SURVEY_VERSION,
    kiosk_session_id: "33333333-3333-4333-8333-333333333334",
    idempotency_key: "33333333-3333-4333-8333-333333333335",
    age_14_or_over: "YES",
    privacy_consent_version: DEMO_SURVEY_VERSION,
    privacy_consent_at: submittedAt,
    guardian_name: null,
    guardian_phone: null,
    guardian_relationship: null,
    guardian_consent_at: null,
    customer_name: "김민지",
    gender: "FEMALE",
    birth_date: "1995-05-15",
    phone: "01000000000",
    address: "서울시 강남구 데모동",
    visit_source: ["NAVER_SEARCH"],
    introducer_name: null,
    style_photo_plan: "DESIGNER_RECOMMENDATION",
    preferred_designer_level: "DIRECTOR",
    interested_services: ["CUT", "COLOR"],
    desired_image: ["NATURAL", "REFINED"],
    priority_points: ["EASY_MAINTENANCE"],
    scalp_concerns: [],
    hair_concerns: ["FRIZZY_DRY"],
    homecare_purchase_history: ["EXPERT_RECOMMENDED"],
    answers_snapshot: { demo: true },
    status: "SUBMITTED",
    submitted_at: submittedAt,
    created_at: submittedAt,
  };
}

function createOpaqueToken(): string {
  if (globalThis.crypto?.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `${createUuid()}${createUuid()}`.replaceAll("-", "").slice(0, 64);
}

function createUuid(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "00000000-0000-4000-8000-000000000000";
}

function readStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The demo remains usable even when browser storage is unavailable.
  }
}
