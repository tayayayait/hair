import {
  createDefaultSurveyConfig,
  digitsOnly,
  type SurveyFormConfig,
} from "./survey-schema";
import { normalizeConditionalAnswers } from "./survey-rules";
import type { SurveyAnswers } from "./survey-store";

export const PROTOTYPE_SURVEY_VERSION = "PROTOTYPE_V1";

export type SurveySubmissionPayload = {
  survey_version: typeof PROTOTYPE_SURVEY_VERSION;
  age_14_or_over: SurveyAnswers["age_14_or_over"];
  privacy_consent: boolean;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_relationship: string | null;
  guardian_consent: boolean;
  customer_name: string;
  gender: string | null;
  birth_date: string | null;
  phone: string;
  address: string | null;
  visit_source: string[];
  introducer_name: string | null;
  style_photo_plan: string | null;
  preferred_designer_level: string | null;
  interested_services: string[];
  desired_image: string[];
  priority_points: string[];
  scalp_concerns: string[];
  hair_concerns: string[];
  homecare_purchase_history: string[];
  form_revision: number;
  survey_config: SurveyFormConfig;
  custom_answers: Record<string, string | string[]>;
};

type BuildSurveySubmissionInput = {
  kioskToken: string;
  idempotencyKey: string;
  answers: SurveyAnswers;
  surveyConfig?: SurveyFormConfig;
};

export function buildSurveySubmission({
  kioskToken,
  idempotencyKey,
  answers,
  surveyConfig = createDefaultSurveyConfig(),
}: BuildSurveySubmissionInput) {
  const normalized = normalizeConditionalAnswers(answers);
  const isMinor = normalized.age_14_or_over === "NO";
  const wasIntroduced = normalized.visit_source.includes("INTRODUCTION");

  const p_payload: SurveySubmissionPayload = {
    survey_version: PROTOTYPE_SURVEY_VERSION,
    age_14_or_over: normalized.age_14_or_over,
    privacy_consent: normalized.privacy_consent,
    guardian_name: isMinor ? normalized.guardian_name.trim() || null : null,
    guardian_phone: isMinor ? digitsOnly(normalized.guardian_phone) || null : null,
    guardian_relationship: isMinor ? normalized.guardian_relationship.trim() || null : null,
    guardian_consent: isMinor && normalized.guardian_consent,
    customer_name: normalized.customer_name.trim(),
    gender: normalized.gender || null,
    birth_date: normalized.birth_date || null,
    phone: digitsOnly(normalized.phone),
    address: normalized.address.trim() || null,
    visit_source: [...normalized.visit_source],
    introducer_name: wasIntroduced ? normalized.introducer_name.trim() || null : null,
    style_photo_plan: normalized.style_photo_plan || null,
    preferred_designer_level: normalized.preferred_designer_level || null,
    interested_services: [...normalized.interested_services],
    desired_image: [...normalized.desired_image],
    priority_points: [...normalized.priority_points],
    scalp_concerns: [...normalized.scalp_concerns],
    hair_concerns: [...normalized.hair_concerns],
    homecare_purchase_history: [...normalized.homecare_purchase_history],
    form_revision: surveyConfig.revision,
    survey_config: surveyConfig,
    custom_answers: { ...normalized.custom_answers },
  };

  return {
    p_kiosk_token: kioskToken,
    p_idempotency_key: idempotencyKey,
    p_payload,
  };
}
