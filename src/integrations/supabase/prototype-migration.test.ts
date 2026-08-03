import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/20260803045922_prototype_security_boundary.sql"),
  "utf8",
).toLowerCase();

describe("prototype security migration", () => {
  it("removes direct customer writes and scopes response reads to admins", () => {
    expect(migration).toContain("revoke all on public.survey_responses from anon, authenticated");
    expect(migration).toContain('drop policy if exists "responses_kiosk_insert"');
    expect(migration).toContain('create policy "responses_admin_read"');
    expect(migration).toContain("private.can_access_store(store_id)");
  });

  it("uses opaque token hashes and a unique idempotency boundary", () => {
    expect(migration).toContain("token_hash text not null unique");
    expect(migration).toContain("extensions.digest(p_kiosk_token, 'sha256')");
    expect(migration).toContain("survey_responses_session_idempotency_key");
    expect(migration).toContain("on conflict (kiosk_session_id, idempotency_key)");
  });

  it("pins the prototype version and validates submissions in a restricted RPC", () => {
    expect(migration).toContain("p_payload->>'survey_version' <> 'prototype_v1'");
    expect(migration).toContain("security definer\nset search_path = ''");
    expect(migration).toContain("grant execute on function public.submit_survey_response");
    expect(migration).not.toContain("grant insert on public.survey_responses to anon");
  });
});
