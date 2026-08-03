import { describe, expect, it } from "vitest";
import {
  aggregateDashboardRows,
  getRangeStart,
  maskCustomerName,
  maskPhone,
} from "./admin-analytics";

describe("admin privacy masking", () => {
  it("masks customer names and phone numbers by default", () => {
    expect(maskCustomerName("홍길동")).toBe("홍*동");
    expect(maskCustomerName("김나")).toBe("김*");
    expect(maskPhone("01012345678")).toBe("010-****-5678");
    expect(maskPhone("0101234567")).toBe("010-***-4567");
  });
});

describe("aggregateDashboardRows", () => {
  it("builds KPI, store, service, and recent-response data from the same rows", () => {
    const rows = [
      {
        id: "response-1",
        submitted_at: "2026-08-02T16:00:00.000Z",
        store_id: "store-a",
        store_name_snapshot: "강남점",
        designer_id: "designer-a",
        designer_name_snapshot: "김지훈",
        customer_name: "홍길동",
        phone: "01012345678",
        interested_services: ["CUT", "HAIR_CARE"],
      },
      {
        id: "response-2",
        submitted_at: "2026-08-01T10:00:00.000Z",
        store_id: "store-b",
        store_name_snapshot: "홍대점",
        designer_id: "designer-b",
        designer_name_snapshot: "최유진",
        customer_name: "김나",
        phone: "0101234567",
        interested_services: ["CUT"],
      },
    ];

    const result = aggregateDashboardRows(rows, new Date("2026-08-03T06:00:00.000Z"));

    expect(result.total).toBe(2);
    expect(result.today).toBe(1);
    expect(result.storeCounts).toEqual([
      { code: "store-a", label: "강남점", count: 1 },
      { code: "store-b", label: "홍대점", count: 1 },
    ]);
    expect(result.serviceCounts[0]).toEqual({ code: "CUT", count: 2 });
    expect(result.recent.map((row) => row.id)).toEqual(["response-1", "response-2"]);
  });
});

describe("getRangeStart", () => {
  it("returns stable UTC boundaries for prototype date filters", () => {
    const now = new Date("2026-08-03T06:00:00.000Z");
    expect(getRangeStart("7d", now)?.toISOString()).toBe("2026-07-27T06:00:00.000Z");
    expect(getRangeStart("30d", now)?.toISOString()).toBe("2026-07-04T06:00:00.000Z");
    expect(getRangeStart("all", now)).toBeNull();
  });
});
