import { beforeEach, describe, expect, it } from "vitest";
import * as adminFormConfig from "./admin-form-config";

type AdminFormConfigApi = {
  fetchAdminSurveyFormConfig?: () => Promise<{
    revision: number;
    fields: Array<{ key: string; label: string }>;
  }>;
  saveAdminSurveyFormConfig?: (config: {
    revision: number;
    fields: Array<Record<string, unknown>>;
  }) => Promise<{ revision: number; fields: Array<{ key: string; label: string }> }>;
};

describe("admin survey form repository", () => {
  beforeEach(() => localStorage.clear());

  it("loads the current form configuration", async () => {
    const api = adminFormConfig as unknown as AdminFormConfigApi;
    expect(api.fetchAdminSurveyFormConfig).toBeTypeOf("function");

    const config = await api.fetchAdminSurveyFormConfig!();

    expect(config.revision).toBe(1);
    expect(config.fields.some((field) => field.key === "customer_name")).toBe(true);
  });

  it("saves an edited form with a new revision", async () => {
    const api = adminFormConfig as unknown as AdminFormConfigApi;
    const config = await api.fetchAdminSurveyFormConfig!();
    config.fields.find((field) => field.key === "desired_image")!.label = "원하는 분위기";

    const saved = await api.saveAdminSurveyFormConfig!(config);

    expect(saved.revision).toBe(2);
    expect((await api.fetchAdminSurveyFormConfig!()).fields).toContainEqual(
      expect.objectContaining({ key: "desired_image", label: "원하는 분위기" }),
    );
  });
});
