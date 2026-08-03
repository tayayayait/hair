import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isOpaqueKioskToken,
  resolveKioskSessionContext,
  type CustomerKioskSession,
  type KioskContext,
} from "./kiosk-session";
import { DEMO_MODE, getDemoKioskContext } from "./demo-mode";
import { OPTIONS, type OptionKey } from "./survey-schema";
import { normalizeConditionalAnswers, toggleMultiSelection } from "./survey-rules";

export type SurveyAnswers = {
  age_14_or_over: "YES" | "NO" | "";
  privacy_consent: boolean;
  guardian_name: string;
  guardian_phone: string;
  guardian_relationship: string;
  guardian_consent: boolean;
  customer_name: string;
  gender: string;
  birth_date: string;
  phone: string;
  address: string;
  visit_source: string[];
  introducer_name: string;
  style_photo_plan: string;
  preferred_designer_level: string;
  interested_services: string[];
  desired_image: string[];
  priority_points: string[];
  scalp_concerns: string[];
  hair_concerns: string[];
  homecare_purchase_history: string[];
  custom_answers: Record<string, string | string[]>;
};

export type SurveyAnswerSetter = <K extends keyof SurveyAnswers>(
  key: K,
  value: SurveyAnswers[K],
) => void;

export type KioskSession = CustomerKioskSession;

export const emptyAnswers: SurveyAnswers = {
  age_14_or_over: "",
  privacy_consent: false,
  guardian_name: "",
  guardian_phone: "",
  guardian_relationship: "",
  guardian_consent: false,
  customer_name: "",
  gender: "",
  birth_date: "",
  phone: "",
  address: "",
  visit_source: [],
  introducer_name: "",
  style_photo_plan: "",
  preferred_designer_level: "",
  interested_services: [],
  desired_image: [],
  priority_points: [],
  scalp_concerns: [],
  hair_concerns: [],
  homecare_purchase_history: [],
  custom_answers: {},
};

const SESSION_PREFIX = "idhair.session.";
const ANSWERS_PREFIX = "idhair.answers.";

export function saveKioskSession(session: KioskSession) {
  sessionStorage.setItem(SESSION_PREFIX + session.sessionId, JSON.stringify(session));
}

export function loadKioskSession(sessionId: string): KioskSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + sessionId);
    return raw ? (JSON.parse(raw) as KioskSession) : null;
  } catch {
    return null;
  }
}

export function clearSurveyStorage(sessionId: string) {
  sessionStorage.removeItem(SESSION_PREFIX + sessionId);
  sessionStorage.removeItem(ANSWERS_PREFIX + sessionId);
}

export function clearSurveyAnswers(sessionId: string) {
  sessionStorage.removeItem(ANSWERS_PREFIX + sessionId);
}

export type SaveState = "idle" | "saving" | "saved";

type SurveyContextValue = {
  session: KioskSession | null;
  sessionStatus: "loading" | "ready" | "invalid" | "error";
  sessionError: string | null;
  answers: SurveyAnswers;
  saveState: SaveState;
  set: SurveyAnswerSetter;
  toggleMulti: (key: keyof SurveyAnswers, code: string, exclusive?: boolean) => void;
  retrySession: () => void;
  reset: () => void;
};

const SurveyContext = createContext<SurveyContextValue | null>(null);

export function SurveyProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: ReactNode;
}) {
  const [session, setSession] = useState<KioskSession | null>(null);
  const [sessionStatus, setSessionStatus] =
    useState<SurveyContextValue["sessionStatus"]>("loading");
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>(emptyAnswers);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [hydrated, setHydrated] = useState(false);
  const [sessionAttempt, setSessionAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSessionStatus("loading");
    setSessionError(null);
    setSession(null);
    setHydrated(false);

    try {
      const raw = sessionStorage.getItem(ANSWERS_PREFIX + sessionId);
      if (raw) setAnswers({ ...emptyAnswers, ...(JSON.parse(raw) as SurveyAnswers) });
      else setAnswers(emptyAnswers);
    } catch {
      /* 저장된 임시 응답 없음 */
    }

    const resolveSession = async () => {
      try {
        if (!isOpaqueKioskToken(sessionId)) {
          const resolution = resolveKioskSessionContext(sessionId, null, null);
          if (!cancelled) {
            clearSurveyStorage(sessionId);
            setSessionStatus("invalid");
            setSessionError(resolution.message);
          }
          return;
        }

        let context: KioskContext | null | undefined;
        let requestError: unknown = null;
        if (DEMO_MODE) {
          context = getDemoKioskContext(sessionId);
        } else {
          const { data, error } = await supabase.rpc("get_kiosk_context", {
            p_kiosk_token: sessionId,
          });
          context = data?.[0] as KioskContext | undefined;
          requestError = error;
        }
        const resolution = resolveKioskSessionContext(sessionId, context, requestError);
        if (cancelled) return;

        if (resolution.status === "ready") {
          saveKioskSession(resolution.session);
          setSession(resolution.session);
          setSessionStatus("ready");
          setSessionError(null);
        } else {
          if (resolution.status === "invalid") clearSurveyStorage(sessionId);
          setSession(null);
          setSessionStatus(resolution.status);
          setSessionError(resolution.message);
        }
      } catch {
        if (!cancelled) {
          setSessionStatus("error");
          setSessionError("설문 연결 상태를 확인하지 못했습니다. 네트워크 연결을 확인해 주세요.");
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };

    void resolveSession();
    return () => {
      cancelled = true;
    };
  }, [sessionAttempt, sessionId]);

  useEffect(() => {
    if (!hydrated) return;
    setSaveState("saving");
    const timer = setTimeout(() => {
      sessionStorage.setItem(ANSWERS_PREFIX + sessionId, JSON.stringify(answers));
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(timer);
  }, [answers, hydrated, sessionId]);

  const set = useCallback<SurveyContextValue["set"]>((key, value) => {
    setAnswers((prev) => normalizeConditionalAnswers({ ...prev, [key]: value }));
  }, []);

  const toggleMulti = useCallback<SurveyContextValue["toggleMulti"]>((key, code, exclusive) => {
    setAnswers((prev) => {
      const current = prev[key] as string[];
      const options = key in OPTIONS ? OPTIONS[key as OptionKey] : [];
      const exclusiveCodes = options
        .filter((option) => "exclusive" in option && option.exclusive)
        .map((option) => option.code);
      if (exclusive && !exclusiveCodes.includes(code)) exclusiveCodes.push(code);
      const next = toggleMultiSelection(current, code, exclusiveCodes);
      return normalizeConditionalAnswers({ ...prev, [key]: next });
    });
  }, []);

  const reset = useCallback(() => {
    setAnswers(emptyAnswers);
    clearSurveyAnswers(sessionId);
  }, [sessionId]);

  const retrySession = useCallback(() => {
    setSessionAttempt((attempt) => attempt + 1);
  }, []);

  const value = useMemo(
    () => ({
      session,
      sessionStatus,
      sessionError,
      answers,
      saveState,
      set,
      toggleMulti,
      retrySession,
      reset,
    }),
    [
      session,
      sessionStatus,
      sessionError,
      answers,
      saveState,
      set,
      toggleMulti,
      retrySession,
      reset,
    ],
  );

  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
}

export function useSurvey() {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used inside SurveyProvider");
  return ctx;
}
