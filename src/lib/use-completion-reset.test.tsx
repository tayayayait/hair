import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCompletionReset } from "./use-completion-reset";

describe("useCompletionReset", () => {
  afterEach(() => vi.useRealTimers());

  it("15초 뒤 답변을 초기화하고 다음 고객 시작 화면으로 이동한다", () => {
    vi.useFakeTimers();
    const resetAnswers = vi.fn();
    const restart = vi.fn();

    renderHook(() => useCompletionReset({ resetAnswers, restart }));

    act(() => vi.advanceTimersByTime(14_999));
    expect(resetAnswers).not.toHaveBeenCalled();
    expect(restart).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(resetAnswers).toHaveBeenCalledOnce();
    expect(restart).toHaveBeenCalledOnce();
  });
});
