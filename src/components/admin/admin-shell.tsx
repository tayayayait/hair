import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, ClipboardList, ListTree, LogOut, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { AdminProfile } from "@/lib/admin-auth";
import { DEMO_MODE } from "@/lib/demo-mode";

export { SurveyFormEditor } from "./survey-form-editor";

const navigation = [
  { to: "/admin/dashboard" as const, label: "대시보드", icon: BarChart3 },
  { to: "/admin/kiosk" as const, label: "키오스크", icon: MonitorSmartphone },
  { to: "/admin/responses" as const, label: "설문 응답", icon: ClipboardList },
  { to: "/admin/forms" as const, label: "문항 관리", icon: ListTree },
];

export function AdminShell({ profile, children }: { profile: AdminProfile; children: ReactNode }) {
  const navigate = useNavigate();

  const signOut = async () => {
    if (DEMO_MODE) {
      navigate({ to: "/", replace: true });
      return;
    }

    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/admin/dashboard" className="shrink-0 font-bold tracking-tight text-foreground">
            IDHAIR <span className="text-accent">PROTOTYPE</span>
          </Link>
          <nav aria-label="관리자 주요 메뉴" className="hidden items-center gap-1 md:flex">
            {navigation.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "bg-accent-soft text-accent-soft-foreground" }}
                inactiveProps={{
                  className: "text-muted-foreground hover:bg-muted hover:text-foreground",
                }}
                className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors"
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile.display_name}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="size-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{DEMO_MODE ? "데모 종료" : "로그아웃"}</span>
            </Button>
          </div>
        </div>
        <nav aria-label="관리자 모바일 메뉴" className="flex border-t border-border px-2 md:hidden">
          {navigation.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeProps={{ className: "text-accent" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold"
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
