import { Navigate, Outlet } from "react-router-dom";
import { isTokenPresent } from "../auth/storage";
import { useQuery } from "@tanstack/react-query";
import { meApi } from "../services/auth";

export default function ProtectedRoute() {
  const hasToken = isTokenPresent();
  if (!hasToken) return <Navigate to="/login" replace />;

  const { isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: meApi,
    retry: false,
  });

  if (isLoading) return <div className="p-4">Verificando sesión…</div>;
  if (isError) return <Navigate to="/login" replace />;

  return <Outlet />;
}
