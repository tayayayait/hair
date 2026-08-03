import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { SurveyFormEditor } from "@/components/admin/survey-form-editor";
import { Button } from "@/components/ui/button";
import {
  fetchAdminSurveyFormConfig,
  saveAdminSurveyFormConfig,
} from "@/lib/admin-form-config";
import { validateSurveyFormConfig, type SurveyFormConfig } from "@/lib/survey-schema";

export const Route = createFileRoute("/admin/forms")({
  head: () => ({ meta: [{ title: "설문 문항 관리 | 아이디헤어 관리자" }] }),
  component: AdminForms,
});

function AdminForms() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<SurveyFormConfig | null>(null);
  const configQuery = useQuery({
    queryKey: ["admin", "survey-form"],
    queryFn: fetchAdminSurveyFormConfig,
  });

  useEffect(() => {
    if (configQuery.data) setDraft(configQuery.data);
  }, [configQuery.data]);

  const validationErrors = useMemo(
    () => (draft ? validateSurveyFormConfig(draft) : []),
    [draft],
  );
  const saveMutation = useMutation({
    mutationFn: saveAdminSurveyFormConfig,
    onSuccess: (saved) => {
      setDraft(saved);
      queryClient.setQueryData(["admin", "survey-form"], saved);
      toast.success(`설문 문항을 저장했습니다. (버전 ${saved.revision})`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "저장에 실패했습니다."),
  });

  return (
    <section>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-accent">FORM BUILDER</p>
          <h1 className="mt-2 text-balance text-3xl font-bold text-foreground">설문 문항 관리</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            고객 설문에 표시할 문항을 추가하거나 삭제하고, 단계별 표시 순서를 조정합니다.
          </p>
        </div>
        {draft ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
              현재 버전 {draft.revision}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDraft(configQuery.data ?? draft)}
              disabled={saveMutation.isPending}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              변경 취소
            </Button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate(draft)}
              disabled={saveMutation.isPending || validationErrors.length > 0}
            >
              {saveMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {saveMutation.isPending ? "저장 중…" : "설문 저장"}
            </Button>
          </div>
        ) : null}
      </div>

      {validationErrors.length > 0 ? (
        <div role="alert" className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {validationErrors.join(" ")}
        </div>
      ) : null}

      {configQuery.isLoading ? (
        <div className="mt-8 flex min-h-64 items-center justify-center rounded-2xl border border-border bg-card">
          <LoaderCircle className="size-7 animate-spin text-accent" aria-label="설문 문항 불러오는 중" />
        </div>
      ) : configQuery.isError ? (
        <div role="alert" className="mt-8 rounded-2xl border border-destructive/40 bg-card p-8 text-center">
          <p className="font-semibold text-foreground">설문 문항을 불러오지 못했습니다.</p>
          <Button className="mt-4" variant="outline" onClick={() => void configQuery.refetch()}>
            다시 시도
          </Button>
        </div>
      ) : draft ? (
        <div className="mt-8">
          <SurveyFormEditor config={draft} onChange={setDraft} />
        </div>
      ) : null}
    </section>
  );
}
