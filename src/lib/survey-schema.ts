import { z } from "zod";

// 아이디헤어 신규 고객 설문 v1.0 필드 정의 (IDHAIR-SURVEY-SPEC-001 5.3)

export const PRIVACY_CONSENT_VERSION = "2026-08-03-v1";

export const PRIVACY_CONSENT_TEXT = `[개인정보 수집·이용 동의]

1. 수집 항목: 성함, 성별, 생년월일, 연락처, 주소, 방문동기, 상담 선호 정보, 모발·두피 정보
2. 수집·이용 목적: 신규 고객 상담 및 시술 서비스 제공, 고객 관리
3. 보유 및 이용 기간: 동의일로부터 회원 탈퇴 또는 파기 요청 시까지
4. 동의를 거부할 권리가 있으며, 거부 시 맞춤 상담 서비스 제공이 제한될 수 있습니다.`;

export const GUARDIAN_CONSENT_TEXT = `[법정대리인 개인정보 수집·이용 동의]

만 14세 미만 고객의 개인정보 수집·이용에 대해 법정대리인의 동의가 필요합니다.
법정대리인의 성명, 연락처, 고객과의 관계를 함께 수집하며, 목적과 보유기간은 위 개인정보 수집·이용 동의와 동일합니다.`;

export type Option = { code: string; label: string; exclusive?: boolean | undefined };

export const OPTIONS = {
  gender: [
    { code: "MALE", label: "남성" },
    { code: "FEMALE", label: "여성" },
    { code: "NO_ANSWER", label: "응답하지 않음" },
  ],
  visit_source: [
    { code: "NEARBY", label: "거주지 근처" },
    { code: "NAVER_SEARCH", label: "네이버 검색" },
    { code: "INTRODUCTION", label: "지인소개" },
    { code: "BLOG_INSTAGRAM", label: "블로그/인스타그램" },
    { code: "GOOGLE_SEARCH", label: "구글 검색" },
  ],
  style_photo_plan: [
    { code: "HAS_PHOTO", label: "유" },
    { code: "NO_PHOTO", label: "무" },
    { code: "DESIGNER_RECOMMENDATION", label: "상담 디자이너가 추천" },
  ],
  preferred_designer_level: [
    { code: "DIRECTOR", label: "실장" },
    { code: "SENIOR_CHIEF_DIRECTOR", label: "선임수석실장" },
    { code: "VICE_DIRECTOR", label: "부원장" },
    { code: "OWNER_DIRECTOR", label: "원장" },
    { code: "NO_PREFERENCE", label: "관계없음" },
  ],
  interested_services: [
    { code: "STYLING", label: "스타일링" },
    { code: "CUT", label: "컷" },
    { code: "PERM", label: "펌" },
    { code: "COLOR", label: "컬러" },
    { code: "SCALP_CARE", label: "두피관리" },
    { code: "HAIR_CARE", label: "모발케어" },
    { code: "DECIDE_AFTER_CONSULTATION", label: "상담 후 선택", exclusive: true },
  ],
  desired_image: [
    { code: "LUXURIOUS", label: "고급스러운" },
    { code: "NATURAL", label: "자연스러운" },
    { code: "UNIQUE", label: "유니크한" },
    { code: "YOUNGER", label: "어려 보이는" },
    { code: "REFINED", label: "세련된" },
    { code: "TRENDY", label: "유행하는" },
    { code: "PERSONALIZED", label: "나에게 맞춤 추천" },
  ],
  priority_points: [
    { code: "DESIGN_CUT", label: "디자인컷" },
    { code: "HAIR_DAMAGE", label: "모발손상" },
    { code: "VOLUME_BANGS", label: "볼륨 & 앞머리" },
    { code: "EASY_MAINTENANCE", label: "손질이 편한" },
    { code: "FAST_SERVICE", label: "신속진행" },
    { code: "CURL_ELASTICITY", label: "컬의 탄력" },
    { code: "SENSITIVE_SCALP", label: "예민한 두피" },
    { code: "DETAILED_SERVICE", label: "꼼꼼한 시술" },
  ],
  scalp_concerns: [
    { code: "ITCHY", label: "가려움" },
    { code: "OILY", label: "기름진" },
    { code: "DRY", label: "건조한" },
    { code: "STINGING", label: "따가운" },
    { code: "SCALP_BUMPS", label: "뾰루지" },
    { code: "HAIR_LOSS", label: "탈모" },
    { code: "NOT_SURE", label: "잘 모르겠음", exclusive: true },
  ],
  hair_concerns: [
    { code: "THINNING", label: "얇아진 모발" },
    { code: "AGING", label: "에이징 모발" },
    { code: "FRIZZY_DRY", label: "부스스하고 건조한 모발" },
    { code: "NO_VOLUME", label: "볼륨이 없는" },
    { code: "PARTIAL_CURL", label: "부분적 곱슬모발" },
    { code: "PREVIOUS_DAMAGE", label: "이전 시술 후 손상된 모발" },
  ],
  homecare_purchase_history: [
    { code: "EXPERT_RECOMMENDED", label: "전문가의 추천제품" },
    { code: "SNS_POPULAR", label: "SNS 후기 인기제품" },
    { code: "HOME_SHOPPING_BULK", label: "홈쇼핑 대량구매" },
    { code: "OFFLINE_STORE", label: "오프라인 구매(마트, 백화점, 올리브영)" },
    { code: "NO_INTEREST", label: "관심없음(잘 모름)", exclusive: true },
  ],
} satisfies Record<string, Option[]>;

export type OptionKey = keyof typeof OPTIONS;

export const FIELD_LABELS: Record<string, string> = {
  customer_name: "성함",
  gender: "성별",
  birth_date: "생년월일",
  phone: "연락처",
  address: "주소",
  visit_source: "방문동기",
  introducer_name: "소개자 성함",
  style_photo_plan: "원하는 스타일 사진",
  preferred_designer_level: "시술담당 희망 직급",
  interested_services: "관심 있는 메뉴",
  desired_image: "원하는 이미지",
  priority_points: "가장 신경 써야 할 포인트",
  scalp_concerns: "두피 고민",
  hair_concerns: "모발 고민",
  homecare_purchase_history: "홈케어 구매 이력",
  guardian_name: "법정대리인 성명",
  guardian_phone: "법정대리인 연락처",
  guardian_relationship: "고객과의 관계",
};

export function labelOf(key: OptionKey, code: string): string {
  return OPTIONS[key].find((o) => o.code === code)?.label ?? code;
}

export function labelsOf(key: OptionKey, codes: string[]): string[] {
  return codes.map((c) => labelOf(key, c));
}

export const DESIGNER_LEVEL_LABELS: Record<string, string> = {
  DIRECTOR: "실장",
  SENIOR_CHIEF_DIRECTOR: "선임수석실장",
  VICE_DIRECTOR: "부원장",
  OWNER_DIRECTOR: "원장",
};

// ---- 값 정규화 및 유효성 ----

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatPhone(value: string) {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export const MESSAGES = {
  choiceRequired: "1개 이상 선택해 주세요.",
  phone: "연락처를 휴대전화번호 10~11자리로 입력해 주세요.",
  date: "올바른 생년월일을 입력해 주세요.",
  name: "성함을 2자 이상 입력해 주세요.",
};

export function isValidPhone(value: string) {
  const d = digitsOnly(value);
  return /^0\d{9,10}$/.test(d);
}

export function isValidBirthDate(value: string) {
  if (!value) return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const oldest = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
  return date <= now && date >= oldest;
}

export function maskName(name: string) {
  if (name.length <= 1) return name;
  if (name.length === 2) return `${name[0]}*`;
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}`;
}

export type SurveySectionKey = "basic" | "preference" | "condition";

export type SurveyFieldType =
  | "SHORT_TEXT"
  | "DATE"
  | "PHONE"
  | "SINGLE_CHOICE"
  | "MULTI_CHOICE";

export type SurveyFormField = {
  id: string;
  key: string;
  section: SurveySectionKey;
  type: SurveyFieldType;
  label: string;
  helpText: string;
  required: boolean;
  locked?: boolean | undefined;
  builtin: boolean;
  options?: Option[] | undefined;
};

export type SurveyFormConfig = {
  revision: number;
  fields: SurveyFormField[];
};

export const BUILTIN_SURVEY_FIELDS: readonly SurveyFormField[] = [
  {
    id: "customer_name",
    key: "customer_name",
    section: "basic",
    type: "SHORT_TEXT",
    label: "성함",
    helpText: "예: 김아이",
    required: true,
    locked: true,
    builtin: true,
  },
  {
    id: "gender",
    key: "gender",
    section: "basic",
    type: "SINGLE_CHOICE",
    label: "성별",
    helpText: "",
    required: false,
    builtin: true,
    options: OPTIONS.gender,
  },
  {
    id: "birth_date",
    key: "birth_date",
    section: "basic",
    type: "DATE",
    label: "생년월일",
    helpText: "",
    required: false,
    builtin: true,
  },
  {
    id: "phone",
    key: "phone",
    section: "basic",
    type: "PHONE",
    label: "연락처",
    helpText: "",
    required: true,
    locked: true,
    builtin: true,
  },
  {
    id: "address",
    key: "address",
    section: "basic",
    type: "SHORT_TEXT",
    label: "주소",
    helpText: "시/구/동까지만 입력해도 됩니다.",
    required: false,
    builtin: true,
  },
  {
    id: "visit_source",
    key: "visit_source",
    section: "preference",
    type: "MULTI_CHOICE",
    label: "방문동기",
    helpText: "",
    required: true,
    builtin: true,
    options: OPTIONS.visit_source,
  },
  {
    id: "style_photo_plan",
    key: "style_photo_plan",
    section: "preference",
    type: "SINGLE_CHOICE",
    label: "원하는 스타일 사진",
    helpText: "",
    required: false,
    builtin: true,
    options: OPTIONS.style_photo_plan,
  },
  {
    id: "preferred_designer_level",
    key: "preferred_designer_level",
    section: "preference",
    type: "SINGLE_CHOICE",
    label: "시술담당 희망 직급",
    helpText: "직급별 차등 금액",
    required: false,
    builtin: true,
    options: OPTIONS.preferred_designer_level,
  },
  {
    id: "interested_services",
    key: "interested_services",
    section: "preference",
    type: "MULTI_CHOICE",
    label: "관심 있는 메뉴",
    helpText: "",
    required: true,
    builtin: true,
    options: OPTIONS.interested_services,
  },
  {
    id: "desired_image",
    key: "desired_image",
    section: "preference",
    type: "MULTI_CHOICE",
    label: "원하는 이미지",
    helpText: "",
    required: true,
    builtin: true,
    options: OPTIONS.desired_image,
  },
  {
    id: "priority_points",
    key: "priority_points",
    section: "preference",
    type: "MULTI_CHOICE",
    label: "가장 신경 써야 할 포인트",
    helpText: "",
    required: true,
    builtin: true,
    options: OPTIONS.priority_points,
  },
  {
    id: "scalp_concerns",
    key: "scalp_concerns",
    section: "condition",
    type: "MULTI_CHOICE",
    label: "두피 고민",
    helpText: "",
    required: false,
    builtin: true,
    options: OPTIONS.scalp_concerns,
  },
  {
    id: "hair_concerns",
    key: "hair_concerns",
    section: "condition",
    type: "MULTI_CHOICE",
    label: "모발 고민",
    helpText: "",
    required: false,
    builtin: true,
    options: OPTIONS.hair_concerns,
  },
  {
    id: "homecare_purchase_history",
    key: "homecare_purchase_history",
    section: "condition",
    type: "MULTI_CHOICE",
    label: "홈케어 구매 이력",
    helpText: "",
    required: false,
    builtin: true,
    options: OPTIONS.homecare_purchase_history,
  },
] as const;

export function createDefaultSurveyConfig(): SurveyFormConfig {
  return {
    revision: 1,
    fields: BUILTIN_SURVEY_FIELDS.map((field) => ({
      ...field,
      options: field.options?.map((option) => ({ ...option })),
    })),
  };
}

export function createCustomSurveyField(input: {
  id: string;
  section: SurveySectionKey;
  type: Extract<SurveyFieldType, "SHORT_TEXT" | "SINGLE_CHOICE" | "MULTI_CHOICE">;
  label: string;
}): SurveyFormField {
  const compactId = input.id.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  return {
    id: input.id,
    key: `custom_${compactId}`,
    section: input.section,
    type: input.type,
    label: input.label.trim(),
    helpText: "",
    required: false,
    builtin: false,
    ...(input.type === "SINGLE_CHOICE" || input.type === "MULTI_CHOICE"
      ? {
          options: [
            { code: "OPTION_1", label: "선택지 1" },
            { code: "OPTION_2", label: "선택지 2" },
          ],
        }
      : {}),
  };
}

export function addSurveyField(
  config: SurveyFormConfig,
  field: SurveyFormField,
): SurveyFormConfig {
  if (config.fields.some((item) => item.id === field.id || item.key === field.key)) {
    throw new Error("이미 존재하는 설문 필드입니다.");
  }
  return { ...config, fields: [...config.fields, field] };
}

export function removeSurveyField(config: SurveyFormConfig, fieldId: string): SurveyFormConfig {
  const field = config.fields.find((item) => item.id === fieldId);
  if (!field) return config;
  if (field.locked) throw new Error("필수 시스템 필드는 삭제할 수 없습니다.");
  return { ...config, fields: config.fields.filter((item) => item.id !== fieldId) };
}

export function moveSurveyField(
  config: SurveyFormConfig,
  fieldId: string,
  direction: "up" | "down",
): SurveyFormConfig {
  const field = config.fields.find((item) => item.id === fieldId);
  if (!field) return config;

  const sectionIndexes = config.fields.flatMap((item, index) =>
    item.section === field.section ? [index] : [],
  );
  const currentSectionIndex = sectionIndexes.findIndex(
    (index) => config.fields[index]?.id === fieldId,
  );
  const targetSectionIndex = currentSectionIndex + (direction === "up" ? -1 : 1);
  const targetIndex = sectionIndexes[targetSectionIndex];
  const currentIndex = sectionIndexes[currentSectionIndex];
  if (currentIndex === undefined || targetIndex === undefined) return config;

  const fields = [...config.fields];
  [fields[currentIndex], fields[targetIndex]] = [fields[targetIndex]!, fields[currentIndex]!];
  return { ...config, fields };
}

export type SurveyFieldUpdate = Partial<
  Pick<SurveyFormField, "section" | "label" | "helpText" | "required" | "options">
>;

export function updateSurveyField(
  config: SurveyFormConfig,
  fieldId: string,
  patch: SurveyFieldUpdate,
): SurveyFormConfig {
  return {
    ...config,
    fields: config.fields.map((field) =>
      field.id === fieldId
        ? {
            ...field,
            section: patch.section ?? field.section,
            label: patch.label ?? field.label,
            helpText: patch.helpText ?? field.helpText,
            required: patch.required ?? field.required,
            options: patch.options?.map((option) => ({ ...option })) ?? field.options,
          }
        : field,
    ),
  };
}

export function validateSurveyFormConfig(config: SurveyFormConfig): string[] {
  const errors: string[] = [];
  const keys = config.fields.map((field) => field.key);
  if (!keys.includes("customer_name") || !keys.includes("phone")) {
    errors.push("성함과 연락처 시스템 필드는 반드시 포함되어야 합니다.");
  }
  if (new Set(keys).size !== keys.length) {
    errors.push("필드 키는 중복될 수 없습니다.");
  }
  if (
    config.fields.some(
      (field) =>
        (field.type === "SINGLE_CHOICE" || field.type === "MULTI_CHOICE") &&
        (field.options?.length ?? 0) < 2,
    )
  ) {
    errors.push("선택형 문항은 선택지가 2개 이상이어야 합니다.");
  }
  return errors;
}

export function normalizeSurveyFormConfig(value: unknown): SurveyFormConfig {
  const optionSchema = z.object({
    code: z.string().trim().regex(/^[A-Z0-9_]{1,64}$/),
    label: z.string().trim().min(1).max(100),
    exclusive: z.boolean().optional(),
  });
  const fieldSchema = z.object({
    id: z.string().trim().regex(/^[a-zA-Z0-9_-]{1,100}$/),
    key: z.string().trim().regex(/^[a-z][a-z0-9_]{1,63}$/),
    section: z.enum(["basic", "preference", "condition"]),
    type: z.enum(["SHORT_TEXT", "DATE", "PHONE", "SINGLE_CHOICE", "MULTI_CHOICE"]),
    label: z.string().trim().min(1).max(120),
    helpText: z.string().trim().max(300),
    required: z.boolean(),
    locked: z.boolean().optional(),
    builtin: z.boolean(),
    options: z.array(optionSchema).max(30).optional(),
  });
  const result = z
    .object({
      revision: z.number().int().positive(),
      fields: z.array(fieldSchema).min(1).max(100),
    })
    .safeParse(value);

  if (result.success) {
    const config = result.data;
    return {
      revision: config.revision,
      fields: config.fields.map((field) => ({
        ...field,
        ...(field.key === "customer_name" || field.key === "phone"
          ? { locked: true, required: true }
          : {}),
        options: field.options?.map((option) => ({ ...option })),
      })),
    };
  }
  return createDefaultSurveyConfig();
}
