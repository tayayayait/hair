import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { StepActionButton } from "./step-action-button";

describe("StepActionButton", () => {
  it("제출 중에는 버튼을 비활성화하고 진행 상태를 알린다", () => {
    render(<StepActionButton label="제출 중…" disabled busy onClick={vi.fn()} />);

    const button = screen.getByRole("button", { name: "제출 중…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
