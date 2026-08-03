import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({ component: AdminIndex });

function AdminIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/dashboard", replace: true });
  }, [navigate]);
  return null;
}
