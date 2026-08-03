import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20260803071100_survey_form_customization.sql"),
  "utf8",
).toLowerCase();

describe("survey form customization migration", () => {
  it("stores one revisioned form configuration behind admin RLS", () => {
    expect(migration).toContain("create table public.survey_form_configs");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain('create policy "survey_form_configs_admin_read"');
    expect(migration).toContain("grant select on public.survey_form_configs to authenticated");
    expect(migration).toContain("private.is_admin()");
  });

  it("updates configurations through an optimistic-lock RPC", () => {
    expect(migration).toContain("public.save_survey_form_config");
    expect(migration).toContain("p_expected_revision");
    expect(migration).toContain("revision = p_expected_revision");
    expect(migration).toContain("security definer\nset search_path = ''");
  });

  it("freezes the active form on every kiosk session", () => {
    expect(migration).toContain("survey_config_snapshot jsonb");
    expect(migration).toContain("ks.survey_config_snapshot");
    expect(migration).toContain("survey_config jsonb");
  });

  it("rejects submissions that do not match the frozen form", () => {
    expect(migration).toContain("validate_survey_config_snapshot");
    expect(migration).toContain("new.answers_snapshot->'survey_config'");
  });
});
