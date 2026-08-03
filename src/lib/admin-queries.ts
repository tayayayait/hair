import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { getRangeStart, type AdminDateRange } from "./admin-analytics";
import { DEMO_MODE, getDemoFilterOptions, getDemoResponse, getDemoResponses } from "./demo-mode";

export type AdminResponseFilters = {
  range: AdminDateRange;
  storeId: string;
  designerId: string;
};

export type AdminResponseRow = Pick<
  Tables<"survey_responses">,
  | "id"
  | "submitted_at"
  | "customer_name"
  | "phone"
  | "store_id"
  | "store_name_snapshot"
  | "designer_id"
  | "designer_name_snapshot"
  | "interested_services"
>;

export async function fetchAdminFilterOptions() {
  if (DEMO_MODE) return getDemoFilterOptions();

  const [storesResult, designersResult] = await Promise.all([
    supabase.from("stores").select("id, name").order("name"),
    supabase.from("designers").select("id, name, store_id").order("name"),
  ]);
  if (storesResult.error) throw storesResult.error;
  if (designersResult.error) throw designersResult.error;
  return {
    stores: storesResult.data,
    designers: designersResult.data,
  };
}

export async function fetchAdminResponses(
  filters: AdminResponseFilters,
): Promise<AdminResponseRow[]> {
  if (DEMO_MODE) {
    const start = getRangeStart(filters.range);
    return getDemoResponses()
      .filter((response) => !start || new Date(response.submitted_at) >= start)
      .filter((response) => !filters.storeId || response.store_id === filters.storeId)
      .filter((response) => !filters.designerId || response.designer_id === filters.designerId)
      .sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at));
  }

  const baseQuery = supabase
    .from("survey_responses")
    .select(
      "id, submitted_at, customer_name, phone, store_id, store_name_snapshot, designer_id, designer_name_snapshot, interested_services",
    )
    .order("submitted_at", { ascending: false })
    .limit(1000);
  const { data, error } = await applyResponseFilters(baseQuery, filters);
  if (error) throw error;
  return data as AdminResponseRow[];
}

export async function fetchAdminResponse(id: string) {
  if (DEMO_MODE) return getDemoResponse(id);

  const { data, error } = await supabase
    .from("survey_responses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function applyResponseFilters<
  T extends {
    gte: (column: string, value: string) => T;
    eq: (column: string, value: string) => T;
  },
>(query: T, filters: AdminResponseFilters): T {
  let filtered = query;
  const start = getRangeStart(filters.range);
  if (start) filtered = filtered.gte("submitted_at", start.toISOString());
  if (filters.storeId) filtered = filtered.eq("store_id", filters.storeId);
  if (filters.designerId) filtered = filtered.eq("designer_id", filters.designerId);
  return filtered;
}
