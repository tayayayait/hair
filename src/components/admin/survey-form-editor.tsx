import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CheckSquare2,
  CircleDot,
  GripVertical,
  LockKeyhole,
  Plus,
  RotateCcw,
  Trash2,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BUILTIN_SURVEY_FIELDS,
  addSurveyField,
  createCustomSurveyField,
  moveSurveyField,
  removeSurveyField,
  updateSurveyField,
  type SurveyFormConfig,
  type SurveySectionKey,
} from "@/lib/survey-schema";

const SECTIONS: Array<{
  key: SurveySectionKey;
  title: string;
  description: string;
}> = [
  { key: "basic", title: "1. 기본 정보", description: "고객 인적 정보" },
  { key: "preference", title: "2. 방문·상담 정보", description: "스타일과 상담 선호" },
  { key: "condition", title: "3. 모발·두피 정보", description: "현재 고민과 홈케어" },
];

export function SurveyFormEditor({
  config,
  onChange,
}: {
  config: SurveyFormConfig;
  onChange: (config: SurveyFormConfig) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = config.fields.find((field) => field.id === selectedId);
  const missingBuiltins = BUILTIN_SURVEY_FIELDS.filter(
    (field) => !config.fields.some((current) => current.key === field.key),
  );

  const addField = (
    type: "SHORT_TEXT" | "SINGLE_CHOICE" | "MULTI_CHOICE",
    label: string,
  ) => {
    const field = createCustomSurveyField({
      id: crypto.randomUUID(),
      section: "basic",
      type,
      label,
    });
    onChange(addSurveyField(config, field));
    setSelectedId(field.id);
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_320px]">
      <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Plus className="size-4 text-accent" aria-hidden="true" />
          <h2 className="font-semibold text-foreground">문항 추가</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">추가 후 오른쪽에서 내용을 편집하세요.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
          <PaletteButton
            icon={Type}
            label="짧은 답변 추가"
            onClick={() => addField("SHORT_TEXT", "새 질문")}
          />
          <PaletteButton
            icon={CircleDot}
            label="단일 선택 추가"
            onClick={() => addField("SINGLE_CHOICE", "새 단일 선택 질문")}
          />
          <PaletteButton
            icon={CheckSquare2}
            label="복수 선택 추가"
            onClick={() => addField("MULTI_CHOICE", "새 복수 선택 질문")}
          />
        </div>

        {missingBuiltins.length > 0 ? (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              삭제한 기본 문항
            </p>
            <div className="mt-3 space-y-2">
              {missingBuiltins.map((field) => (
                <button
                  key={field.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-left text-sm font-medium text-foreground hover:border-accent hover:bg-accent-soft"
                  onClick={() => {
                    onChange(
                      addSurveyField(config, {
                        ...field,
                        options: field.options?.map((option) => ({ ...option })),
                      }),
                    );
                    setSelectedId(field.id);
                  }}
                >
                  <RotateCcw className="size-4 shrink-0" aria-hidden="true" />
                  {field.label} 다시 추가
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </aside>

      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const fields = config.fields.filter((field) => field.section === section.key);
          return (
            <section key={section.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">{section.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                </div>
                <span className="text-xs font-medium text-muted-foreground">{fields.length}개</span>
              </div>
              <div className="mt-4 space-y-2">
                {fields.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
                    이 단계에 표시할 문항이 없습니다.
                  </p>
                ) : (
                  fields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      aria-label={`${field.label} 문항 선택`}
                      aria-pressed={selectedId === field.id}
                      onClick={() => setSelectedId(field.id)}
                      className={cn(
                        "flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors",
                        selectedId === field.id
                          ? "border-accent bg-accent-soft"
                          : "border-border bg-background hover:border-accent/50",
                      )}
                    >
                      <GripVertical className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-foreground">{field.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {field.type === "SHORT_TEXT" || field.type === "DATE" || field.type === "PHONE"
                            ? "직접 입력"
                            : field.type === "SINGLE_CHOICE"
                              ? "단일 선택"
                              : "복수 선택"}
                        </span>
                      </span>
                      {field.required ? (
                        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">필수</span>
                      ) : null}
                      {field.locked ? <LockKeyhole className="size-4 text-muted-foreground" aria-label="보호 문항" /> : null}
                    </button>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>

      <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm xl:sticky xl:top-5 xl:self-start">
        <h2 className="font-semibold text-foreground">문항 설정</h2>
        {selected ? (
          <div className="mt-5 space-y-5">
            <label className="block text-sm font-medium text-foreground">
              문항 제목
              <input
                aria-label="문항 제목"
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground"
                value={selected.label}
                maxLength={120}
                onChange={(event) =>
                  onChange(updateSurveyField(config, selected.id, { label: event.target.value }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              도움말
              <textarea
                aria-label="도움말"
                className="mt-2 min-h-20 w-full resize-y rounded-lg border border-input bg-background p-3 text-foreground"
                value={selected.helpText}
                maxLength={300}
                onChange={(event) =>
                  onChange(updateSurveyField(config, selected.id, { helpText: event.target.value }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-foreground">
              설문 단계
              <select
                aria-label="설문 단계"
                className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground disabled:opacity-60"
                value={selected.section}
                disabled={selected.locked}
                onChange={(event) =>
                  onChange(
                    updateSurveyField(config, selected.id, {
                      section: event.target.value as SurveySectionKey,
                    }),
                  )
                }
              >
                <option value="basic">기본 정보</option>
                <option value="preference">방문·상담 정보</option>
                <option value="condition">모발·두피 정보</option>
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                className="size-4 accent-[var(--accent)]"
                checked={selected.required}
                disabled={selected.locked}
                onChange={(event) =>
                  onChange(updateSurveyField(config, selected.id, { required: event.target.checked }))
                }
              />
              필수 문항
            </label>

            {!selected.builtin && selected.options ? (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">선택지</legend>
                {selected.options.map((option, index) => (
                  <input
                    key={option.code}
                    aria-label={`${option.label} 라벨`}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                    value={option.label}
                    maxLength={100}
                    placeholder={`선택지 ${index + 1}`}
                    onChange={(event) =>
                      onChange(
                        updateSurveyField(config, selected.id, {
                          options: selected.options!.map((item) =>
                            item.code === option.code ? { ...item, label: event.target.value } : item,
                          ),
                        }),
                      )
                    }
                  />
                ))}
              </fieldset>
            ) : null}

            <div className="grid grid-cols-2 gap-2 border-t border-border pt-5">
              <Button
                type="button"
                variant="outline"
                aria-label="선택 문항 위로 이동"
                onClick={() => onChange(moveSurveyField(config, selected.id, "up"))}
              >
                <ArrowUp className="size-4" aria-hidden="true" />
                위로
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label="선택 문항 아래로 이동"
                onClick={() => onChange(moveSurveyField(config, selected.id, "down"))}
              >
                <ArrowDown className="size-4" aria-hidden="true" />
                아래로
              </Button>
            </div>
            {!selected.locked ? (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={() => {
                  onChange(removeSurveyField(config, selected.id));
                  setSelectedId(null);
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                선택 문항 삭제
              </Button>
            ) : (
              <p className="flex gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <LockKeyhole className="size-4 shrink-0" aria-hidden="true" />
                개인정보 수집에 필요한 시스템 문항은 삭제하거나 선택 항목으로 바꿀 수 없습니다.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            가운데 목록에서 편집할 문항을 선택하세요.
          </p>
        )}
      </aside>
    </div>
  );
}

function PaletteButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Type;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-background px-3 text-left text-sm font-medium text-foreground hover:border-accent hover:bg-accent-soft"
    >
      <Icon className="size-4 shrink-0 text-accent" aria-hidden="true" />
      {label}
    </button>
  );
}
