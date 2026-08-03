import { digitsOnly, maskName } from "./survey-schema";

export type AnalyticsResponseRow = {
  id: string;
  submitted_at: string;
  store_id: string;
  store_name_snapshot: string;
  designer_id: string | null;
  designer_name_snapshot: string;
  customer_name: string;
  phone: string;
  interested_services: string[];
};

export type AdminDateRange = "7d" | "30d" | "all";

export function getRangeStart(range: AdminDateRange, now = new Date()): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export function maskCustomerName(name: string): string {
  return maskName(name.trim());
}

export function maskPhone(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-***-${digits.slice(-4)}`;
  return "***-****-****";
}

function seoulDateKey(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export function aggregateDashboardRows(rows: AnalyticsResponseRow[], now = new Date()) {
  const todayKey = seoulDateKey(now);
  const storeMap = new Map<string, { code: string; label: string; count: number }>();
  const serviceMap = new Map<string, number>();

  for (const row of rows) {
    const store = storeMap.get(row.store_id) ?? {
      code: row.store_id,
      label: row.store_name_snapshot,
      count: 0,
    };
    store.count += 1;
    storeMap.set(row.store_id, store);

    for (const service of new Set(row.interested_services)) {
      serviceMap.set(service, (serviceMap.get(service) ?? 0) + 1);
    }
  }

  const recent = [...rows]
    .sort((a, b) => Date.parse(b.submitted_at) - Date.parse(a.submitted_at))
    .slice(0, 5);

  return {
    total: rows.length,
    today: rows.filter((row) => seoulDateKey(new Date(row.submitted_at)) === todayKey).length,
    storeCounts: [...storeMap.values()].sort(
      (a, b) => b.count - a.count || a.label.localeCompare(b.label, "ko"),
    ),
    serviceCounts: [...serviceMap.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code)),
    recent,
  };
}
