import { FlaskConical } from "lucide-react";

export function PrototypeBanner() {
  return (
    <div
      role="status"
      className="sticky top-0 z-[100] flex min-h-10 items-center justify-center gap-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950"
    >
      <FlaskConical className="size-4 shrink-0" aria-hidden />
      <span>프로토타입 체험 환경입니다. 실제 개인정보를 입력하지 마세요.</span>
    </div>
  );
}
