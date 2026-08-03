import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { AdminDateRange } from "@/lib/admin-analytics";

type StoreOption = { id: string; name: string };
type DesignerOption = { id: string; name: string; store_id: string };

type AdminFiltersProps = {
  range: AdminDateRange;
  storeId: string;
  designerId: string;
  stores: StoreOption[];
  designers: DesignerOption[];
  search?: string;
  onRangeChange: (value: AdminDateRange) => void;
  onStoreChange: (value: string) => void;
  onDesignerChange: (value: string) => void;
  onSearchChange?: (value: string) => void;
};

export function AdminFilters({
  range,
  storeId,
  designerId,
  stores,
  designers,
  search,
  onRangeChange,
  onStoreChange,
  onDesignerChange,
  onSearchChange,
}: AdminFiltersProps) {
  const visibleDesigners = storeId
    ? designers.filter((designer) => designer.store_id === storeId)
    : designers;

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-1.5 text-sm font-medium text-foreground">
        <span>기간</span>
        <select
          value={range}
          onChange={(event) => onRangeChange(event.target.value as AdminDateRange)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="7d">최근 7일</option>
          <option value="30d">최근 30일</option>
          <option value="all">전체 기간</option>
        </select>
      </label>
      <label className="space-y-1.5 text-sm font-medium text-foreground">
        <span>매장</span>
        <select
          value={storeId}
          onChange={(event) => onStoreChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">전체 매장</option>
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1.5 text-sm font-medium text-foreground">
        <span>디자이너</span>
        <select
          value={designerId}
          onChange={(event) => onDesignerChange(event.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">전체 디자이너</option>
          {visibleDesigners.map((designer) => (
            <option key={designer.id} value={designer.id}>
              {designer.name}
            </option>
          ))}
        </select>
      </label>
      {onSearchChange ? (
        <label className="space-y-1.5 text-sm font-medium text-foreground">
          <span>고객 검색</span>
          <span className="relative block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              className="pl-9"
              placeholder="이름 또는 연락처"
            />
          </span>
        </label>
      ) : (
        <div className="hidden xl:block" aria-hidden="true" />
      )}
    </div>
  );
}
