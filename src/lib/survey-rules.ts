import {
  MESSAGES,
  createDefaultSurveyConfig,
  isValidBirthDate,
  isValidPhone,
  type SurveyFormConfig,
  type SurveySectionKey,
} from "./survey-schema";
import type { SurveyAnswers } from "./survey-store";

export type SurveyErrors = Record<string, string>;

export function toggleMultiSelection(
  current: string[],
  code: string,
  exclusiveCodes: string[],
): string[] {
  if (current.includes(code)) return current.filter((value) => value !== code);
  if (exclusiveCodes.includes(code)) return [code];

  return [...current.filter((value) => !exclusiveCodes.includes(value)), code];
}

export function normalizeConditionalAnswers(answers: SurveyAnswers): SurveyAnswers {
  const next = { ...answers };

  if (!next.visit_source.includes("INTRODUCTION")) next.introducer_name = "";
  if (next.age_14_or_over === "YES") {
    next.guardian_name = "";
    next.guardian_phone = "";
    next.guardian_relationship = "";
    next.guardian_consent = false;
  }

  return next;
}

export function isValidPersonName(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.length <= 50 &&
    /[A-Za-z가-힣]/.test(trimmed) &&
    /^[A-Za-z가-힣·ㆍ\s-]+$/.test(trimmed)
  );
}

export function isUnderFourteen(birthDate: string, today = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  let age = today.getFullYear() - year;
  const birthdayHasPassed =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!birthdayHasPassed) age -= 1;

  return age < 14;
}

export function validateBasicAnswers(
  answers: SurveyAnswers,
  today = new Date(),
  config = createDefaultSurveyConfig(),
): { errors: SurveyErrors; requiresGuardianConsent: boolean } {
  const errors: SurveyErrors = {};
  if (!isValidPersonName(answers.customer_name)) {
    errors["customer_name"] = "성함을 2~50자의 한글 또는 영문으로 입력해 주세요.";
  }
  if (!isValidPhone(answers.phone)) errors["phone"] = MESSAGES.phone;
  if (!isValidBirthDate(answers.birth_date)) errors["birth_date"] = MESSAGES.date;

  const requiresGuardianConsent =
    answers.age_14_or_over === "YES" &&
    Boolean(answers.birth_date) &&
    isValidBirthDate(answers.birth_date) &&
    isUnderFourteen(answers.birth_date, today);

  return {
    errors: { ...errors, ...validateRequiredCustomFields(answers, config, "basic") },
    requiresGuardianConsent,
  };
}

function validateRequiredCustomFields(
  answers: SurveyAnswers,
  config: SurveyFormConfig,
  section: SurveySectionKey,
): SurveyErrors {
  const errors: SurveyErrors = {};
  for (const field of config.fields) {
    if (field.builtin || field.section !== section || !field.required) continue;
    const value = answers.custom_answers[field.key];
    const empty = Array.isArray(value) ? value.length === 0 : !value?.trim();
    if (empty) errors[field.key] = `${field.label}을(를) 입력해 주세요.`;
  }
  return errors;
}

export function validatePreferenceAnswers(
  answers: SurveyAnswers,
  config = createDefaultSurveyConfig(),
): SurveyErrors {
  const errors: SurveyErrors = {};
  const required = (key: string) =>
    config.fields.some((field) => field.key === key && field.required);
  if (required("visit_source") && answers.visit_source.length === 0) {
    errors["visit_source"] = MESSAGES.choiceRequired;
  }
  if (
    answers.visit_source.includes("INTRODUCTION") &&
    !isValidPersonName(answers.introducer_name)
  ) {
    errors["introducer_name"] = "소개자 성함을 2~50자로 입력해 주세요.";
  }
  if (required("interested_services") && answers.interested_services.length === 0) {
    errors["interested_services"] = MESSAGES.choiceRequired;
  }
  if (required("desired_image") && answers.desired_image.length === 0) {
    errors["desired_image"] = MESSAGES.choiceRequired;
  }
  if (required("priority_points") && answers.priority_points.length === 0) {
    errors["priority_points"] = MESSAGES.choiceRequired;
  }
  return { ...errors, ...validateRequiredCustomFields(answers, config, "preference") };
}

export function validateConditionAnswers(
  answers: SurveyAnswers,
  config = createDefaultSurveyConfig(),
): SurveyErrors {
  return validateRequiredCustomFields(answers, config, "condition");
}

export function validateConsentAnswers(answers: SurveyAnswers): SurveyErrors {
  const errors: SurveyErrors = {};
  if (!answers.age_14_or_over) errors["age"] = MESSAGES.choiceRequired;
  if (!answers.privacy_consent) {
    errors["privacy"] = "개인정보 수집·이용에 동의해야 설문을 진행할 수 있습니다.";
  }

  if (answers.age_14_or_over === "NO") {
    if (!isValidPersonName(answers.guardian_name)) {
      errors["guardian_name"] = "법정대리인 성명을 2~50자로 입력해 주세요.";
    }
    if (!isValidPhone(answers.guardian_phone)) errors["guardian_phone"] = MESSAGES.phone;
    const relationshipLength = answers.guardian_relationship.trim().length;
    if (relationshipLength < 2 || relationshipLength > 30) {
      errors["guardian_relationship"] = "고객과의 관계를 2~30자로 입력해 주세요.";
    }
    if (!answers.guardian_consent) {
      errors["guardian_consent"] = "법정대리인 동의가 필요합니다.";
    }
  }

  return errors;
}

export function createSubmissionGate() {
  let locked = false;

  return {
    tryLock() {
      if (locked) return false;
      locked = true;
      return true;
    },
    unlock() {
      locked = false;
    },
  };
}
