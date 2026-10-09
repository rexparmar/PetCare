import { Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute, ProtectedRoute } from "./components/auth/RouteGuards";
import { AppShell } from "./components/layout/AppShell";
import { AccountPage } from "./pages/AccountPage";
import { AppointmentFormPage } from "./pages/AppointmentFormPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HealthRecordsPage } from "./pages/HealthRecordsPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { PetDetailPage } from "./pages/PetDetailPage";
import { PetFormPage } from "./pages/PetFormPage";
import { PetsPage } from "./pages/PetsPage";
import { RegisterPage } from "./pages/RegisterPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pets" element={<PetsPage />} />
          <Route path="/pets/new" element={<PetFormPage />} />
          <Route path="/pets/:id" element={<PetDetailPage />} />
          <Route path="/pets/:id/edit" element={<PetFormPage />} />
          <Route
            path="/pets/:petId/health-records"
            element={<HealthRecordsPage />}
          />
          <Route path="/health-records" element={<HealthRecordsPage />} />
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/appointments/new" element={<AppointmentFormPage />} />
          <Route
            path="/appointments/:id/edit"
            element={<AppointmentFormPage />}
          />
          <Route path="/account" element={<AccountPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
