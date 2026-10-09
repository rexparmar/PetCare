import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LoadingState } from "../ui/States";

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  if (isLoading)
    return (
      <main className="min-h-screen bg-cream">
        <LoadingState label="Opening your PetCare workspace…" />
      </main>
    );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingState />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
