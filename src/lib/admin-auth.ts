import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isActiveDemoAdmin } from "./kiosk-session";

export const ADMIN_SESSION_QUERY_KEY = ["admin-session"] as const;

export type AdminProfile = {
  user_id: string;
  display_name: string;
  role: string;
  store_id: string | null;
  is_active: boolean;
};

export type AdminSession = {
  user: User;
  profile: AdminProfile;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("user_id, display_name, role, store_id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile || !isActiveDemoAdmin(profile)) return null;

  return { user, profile };
}
