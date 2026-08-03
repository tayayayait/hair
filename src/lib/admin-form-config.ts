import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  normalizeSurveyFormConfig,
  validateSurveyFormConfig,
  type SurveyFormConfig,
} from "./survey-schema";
import {
  DEMO_MODE,
  getDemoSurveyFormConfig,
  saveDemoSurveyFormConfig,
} from "./demo-mode";

export async function fetchAdminSurveyFormConfig(): Promise<SurveyFormConfig> {
  if (DEMO_MODE) return getDemoSurveyFormConfig();

  const { data, error } = await supabase
    .from("survey_form_configs")
    .select("revision, config")
    .eq("id", "default")
    .single();
  if (error) throw error;
  return normalizeSurveyFormConfig({ ...(data.config as object), revision: data.revision });
}

export async function saveAdminSurveyFormConfig(
  config: SurveyFormConfig,
): Promise<SurveyFormConfig> {
  const validationErrors = validateSurveyFormConfig(config);
  if (validationErrors.length > 0) throw new Error(validationErrors[0]);
  if (DEMO_MODE) return saveDemoSurveyFormConfig(config, config.revision);

  const { revision: _revision, ...configWithoutRevision } = config;
  const { data, error } = await supabase.rpc("save_survey_form_config", {
    p_config: configWithoutRevision as unknown as Json,
    p_expected_revision: config.revision,
  });
  if (error) throw error;
  const saved = data?.[0];
  if (!saved) throw new Error("저장된 설문 설정을 확인하지 못했습니다.");
  return normalizeSurveyFormConfig({ ...(saved.config as object), revision: saved.revision });
}
