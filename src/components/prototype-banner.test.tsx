import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PrototypeBanner } from "./prototype-banner";

describe("PrototypeBanner", () => {
  it("실제 개인정보 입력 금지 안내를 모든 사용자에게 보여준다", () => {
    render(<PrototypeBanner />);

    expect(screen.getByRole("status")).toHaveTextContent("프로토타입");
    expect(screen.getByRole("status")).toHaveTextContent("실제 개인정보를 입력하지 마세요");
  });
});
