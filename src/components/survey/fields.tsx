import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { OPTIONS, formatPhone, type OptionKey, type SurveyFormField } from "@/lib/survey-schema";
import { toggleMultiSelection } from "@/lib/survey-rules";
import type { SurveyAnswerSetter, SurveyAnswers } from "@/lib/survey-store";

export function QuestionCard({
  label,
  required,
  help,
  error,
  id,
  variant = "default",
  children,
}: {
  label: string;
  required?: boolean | undefined;
  help?: string | undefined;
  error?: string | undefined;
  id?: string | undefined;
  variant?: "default" | "checklist" | undefined;
  children: ReactNode;
}) {
  const checklist = variant === "checklist";

  return (
    <section
      id={id}
      className={cn(
        "border border-border bg-card",
        checklist
          ? "rounded-xl p-4 shadow-sm sm:p-5"
          : "rounded-2xl p-6 shadow-[var(--shadow-card)]",
      )}
    >
      <div
        className={cn(
          checklist && "grid gap-4 sm:grid-cols-[minmax(145px,0.34fr)_minmax(0,1fr)] sm:gap-7",
        )}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold leading-7 text-foreground">{label}</h2>
            {required ? (
              <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-soft-foreground">
                필수
              </span>
            ) : (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                선택
              </span>
            )}
          </div>
          {help ? <p className="mt-1.5 text-sm text-muted-foreground">{help}</p> : null}
        </div>
        <div className={cn("mt-4", checklist && "sm:mt-0")}>{children}</div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function ChoiceGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

function choiceClasses(selected: boolean) {
  return cn(
    "flex min-h-12 w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left text-[15px] font-medium leading-5 transition-colors sm:min-h-11",
    selected
      ? "border-accent bg-accent-soft text-accent-soft-foreground shadow-[inset_0_0_0_1px_var(--accent)]"
      : "border-border/80 bg-background/70 text-foreground hover:border-accent/60 hover:bg-secondary",
  );
}

function Indicator({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] transition-colors",
        selected ? "border-accent bg-accent text-accent-foreground" : "border-input bg-card",
      )}
    >
      {selected ? (
        <svg
          viewBox="0 0 20 20"
          className="size-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M4 10.5 8 14.5 16 5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}

export function SingleChoice({
  name,
  optionKey,
  options,
  value,
  onChange,
}: {
  name: string;
  optionKey?: OptionKey | undefined;
  options?: { code: string; label: string }[] | undefined;
  value: string;
  onChange: (code: string) => void;
}) {
  const list = options ?? (optionKey ? OPTIONS[optionKey] : []);
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((option) => {
        const selected = value === option.code;
        return (
          <button
            key={option.code}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.code)}
            className={choiceClasses(selected)}
          >
            <Indicator selected={selected} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MultiChoice({
  name,
  optionKey,
  options,
  values,
  onToggle,
}: {
  name: string;
  optionKey?: OptionKey | undefined;
  options?: { code: string; label: string; exclusive?: boolean | undefined }[] | undefined;
  values: string[];
  onToggle: (code: string, exclusive?: boolean) => void;
}) {
  const list = options ?? (optionKey ? OPTIONS[optionKey] : []);
  return (
    <div role="group" aria-label={name} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {list.map((option) => {
        const exclusive = "exclusive" in option && option.exclusive === true;
        const selected = values.includes(option.code);
        return (
          <button
            key={option.code}
            type="button"
            role="checkbox"
            aria-checked={selected}
            onClick={() => onToggle(option.code, exclusive)}
            className={choiceClasses(selected)}
          >
            <Indicator selected={selected} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  error,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        {...rest}
        name={rest.name ?? rest.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-14 w-full rounded-xl border-2 bg-card px-4 text-base text-foreground placeholder:text-muted-foreground/70",
          error ? "border-destructive" : "border-input focus:border-accent",
        )}
      />
    </label>
  );
}

export function ErrorSummary({ errors }: { errors: { id: string; message: string }[] }) {
  if (errors.length === 0) return null;
  return (
    <div
      role="alert"
      className="rounded-2xl border-2 border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
    >
      <p className="font-semibold">입력하지 않은 항목이 {errors.length}개 있습니다.</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {errors.map((e) => (
          <li key={e.id}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}

export function ConfiguredSurveyField({
  field,
  answers,
  errors,
  setAnswer,
}: {
  field: SurveyFormField;
  answers: SurveyAnswers;
  errors: Record<string, string>;
  setAnswer: SurveyAnswerSetter;
}) {
  const value = field.builtin
    ? answers[field.key as keyof SurveyAnswers]
    : answers.custom_answers[field.key];
  const error = errors[field.key];

  const updateValue = (next: string | string[]) => {
    if (field.builtin) {
      setAnswer(field.key as keyof SurveyAnswers, next as never);
      return;
    }
    setAnswer("custom_answers", { ...answers.custom_answers, [field.key]: next });
  };

  const control =
    field.type === "SINGLE_CHOICE" ? (
      <SingleChoice
        name={field.label}
        options={field.options ?? []}
        value={typeof value === "string" ? value : ""}
        onChange={updateValue}
      />
    ) : field.type === "MULTI_CHOICE" ? (
      <MultiChoice
        name={field.label}
        options={field.options ?? []}
        values={Array.isArray(value) ? value : []}
        onToggle={(code) => {
          const exclusiveCodes = (field.options ?? [])
            .filter((option) => option.exclusive)
            .map((option) => option.code);
          updateValue(
            toggleMultiSelection(Array.isArray(value) ? value : [], code, exclusiveCodes),
          );
        }}
      />
    ) : (
      <TextField
        label={field.label}
        type={field.type === "DATE" ? "date" : "text"}
        inputMode={field.type === "PHONE" ? "tel" : "text"}
        placeholder={
          field.type === "PHONE" ? "010-0000-0000" : `${field.label}을(를) 입력해 주세요`
        }
        maxLength={field.key === "address" ? 200 : 50}
        value={typeof value === "string" ? value : ""}
        onChange={(next) => updateValue(field.type === "PHONE" ? formatPhone(next) : next)}
        error={error}
      />
    );

  return (
    <>
      <QuestionCard
        id={field.key}
        label={field.label}
        required={field.required}
        help={field.helpText}
        error={error}
        variant={
          field.type === "SINGLE_CHOICE" || field.type === "MULTI_CHOICE" ? "checklist" : "default"
        }
      >
        {control}
      </QuestionCard>
      {field.key === "visit_source" && answers.visit_source.includes("INTRODUCTION") ? (
        <QuestionCard
          id="introducer_name"
          label="소개자 성함"
          required
          error={errors["introducer_name"]}
        >
          <TextField
            label="소개자 성함"
            placeholder="소개해 주신 분의 성함"
            maxLength={50}
            value={answers.introducer_name}
            onChange={(next) => setAnswer("introducer_name", next)}
            error={errors["introducer_name"]}
          />
        </QuestionCard>
      ) : null}
    </>
  );
}
