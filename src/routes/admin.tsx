import { useEffect } from "react";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_SESSION_QUERY_KEY, getAdminSession, type AdminProfile } from "@/lib/admin-auth";
import { DEMO_MODE } from "@/lib/demo-mode";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const DEMO_ADMIN_PROFILE: AdminProfile = {
  user_id: "00000000-0000-4000-8000-000000000000",
  display_name: "데모 관리자",
  role: "DEMO_ADMIN",
  store_id: null,
  is_active: true,
};

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    data: adminSession,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ADMIN_SESSION_QUERY_KEY,
    queryFn: getAdminSession,
    retry: false,
    staleTime: 60_000,
    enabled: !DEMO_MODE,
  });

  useEffect(() => {
    if (DEMO_MODE) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_SESSION_QUERY_KEY });
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  useEffect(() => {
    if (DEMO_MODE) return;

    if (!isLoading && (!adminSession || isError)) {
      navigate({ to: "/login", search: { reason: "auth" }, replace: true });
    }
  }, [adminSession, isError, isLoading, navigate]);

  if (DEMO_MODE) {
    return (
      <AdminShell profile={DEMO_ADMIN_PROFILE}>
        <Outlet />
      </AdminShell>
    );
  }

  if (isLoading || !adminSession) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-background"
      >
        <LoaderCircle
          className="size-8 animate-spin text-accent"
          aria-label="관리자 인증 확인 중"
        />
      </main>
    );
  }

  return (
    <AdminShell profile={adminSession.profile}>
      <Outlet />
    </AdminShell>
  );
}
