import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, LoaderCircle, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_SESSION_QUERY_KEY, getAdminSession } from "@/lib/admin-auth";
import { DEMO_MODE } from "@/lib/demo-mode";

type LoginSearch = { reason?: "auth" | undefined };

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    reason: search["reason"] === "auth" ? "auth" : undefined,
  }),
  head: () => ({ meta: [{ title: "데모 관리자 로그인 | 아이디헤어" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { reason } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(
    reason === "auth" ? "관리자 로그인이 필요한 화면입니다." : "",
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) return;

    let cancelled = false;
    void getAdminSession()
      .then((session) => {
        if (session && !cancelled) navigate({ to: "/admin/dashboard", replace: true });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;

      const adminSession = await getAdminSession();
      if (!adminSession) {
        await supabase.auth.signOut();
        throw new Error("활성화된 데모 관리자 계정이 아닙니다.");
      }

      queryClient.setQueryData(ADMIN_SESSION_QUERY_KEY, adminSession);
      navigate({ to: "/admin/dashboard", replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message.includes("관리자")
          ? error.message
          : "이메일 또는 비밀번호를 확인해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-muted/30 px-5 py-12"
    >
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          프로토타입 안내
        </Link>
        <section className="mt-5 rounded-2xl border border-border bg-card p-7 shadow-[var(--shadow-card)] sm:p-9">
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <LockKeyhole className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-foreground">데모 관리자 로그인</h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            제공받은 데모 계정으로 로그인해 키오스크와 설문 결과를 확인하세요.
          </p>

          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                spellCheck={false}
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="demo@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {errorMessage ? (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {errorMessage}
              </p>
            ) : null}
            <Button type="submit" size="lg" className="h-13 w-full" disabled={submitting}>
              {submitting ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {submitting ? "로그인 확인 중" : "로그인"}
            </Button>
          </form>

          <div className="mt-5 border-t border-border pt-5">
            <Button asChild variant="outline" size="lg" className="h-13 w-full">
              <Link to="/admin/dashboard">로그인 없이 데모로 바로 시작하기</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
