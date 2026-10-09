import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarPlus,
  HeartPulse,
  PawPrint,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PetCard } from "../components/pets/PetCard";
import { buttonClass } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorState, LoadingState } from "../components/ui/States";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { DashboardData } from "../types/api";
import { formatDate, formatDateTime, titleCase } from "../utils/format";

const quickActions = [
  { to: "/pets/new", label: "Add a pet", icon: Plus },
  { to: "/appointments/new", label: "Schedule a visit", icon: CalendarPlus },
  { to: "/health-records", label: "Add health record", icon: HeartPulse },
  { to: "/pets", label: "View all pets", icon: PawPrint },
];

export function DashboardPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/dashboard"),
  });
  if (query.isLoading)
    return <LoadingState label="Preparing your care overview…" />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        message={query.error instanceof Error ? query.error.message : undefined}
      />
    );
  const { petCount, pets, upcomingAppointments, recentHealthRecords } =
    query.data;
  return (
    <>
      <header className="mb-8">
        <p className="text-sm font-semibold text-pine-700">
          Your care overview
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
          Welcome back, {user?.fullName.split(" ")[0]}{" "}
          <span aria-hidden="true">👋</span>
        </h1>
        <p className="mt-2 text-slate-500">
          Here’s what is happening with your pets.
        </p>
      </header>
      <section className="grid gap-4 lg:grid-cols-[1.3fr_.7fr]">
        <div className="relative overflow-hidden rounded-2xl bg-pine-800 p-6 text-white shadow-card sm:p-7">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full border-[35px] border-pine-700" />
          <p className="relative text-sm font-semibold text-pine-200">
            Pets in your care
          </p>
          <p className="relative mt-2 font-display text-5xl font-extrabold">
            {petCount}
          </p>
          <Link
            className="relative mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:text-pine-100"
            to="/pets"
          >
            Manage your pets <ArrowRight size={17} />
          </Link>
        </div>
        <Card>
          <p className="text-sm font-semibold text-slate-500">
            Next appointment
          </p>
          {upcomingAppointments[0] ? (
            <>
              <p className="mt-3 text-xl font-bold text-ink">
                {upcomingAppointments[0].pet.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {formatDateTime(upcomingAppointments[0].appointmentDate)}
              </p>
              <p className="mt-3 text-sm font-medium text-pine-700">
                {upcomingAppointments[0].reason}
              </p>
            </>
          ) : (
            <div className="mt-5">
              <p className="font-semibold text-slate-700">Nothing scheduled</p>
              <Link
                to="/appointments/new"
                className="mt-2 inline-block text-sm font-bold text-pine-700"
              >
                Book a visit →
              </Link>
            </div>
          )}
        </Card>
      </section>
      <section className="mt-7">
        <h2 className="text-lg font-bold">Quick actions</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map(({ to, label, icon: Icon }) => (
            <Link
              key={label}
              to={to}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-pine-200 hover:text-pine-700 hover:shadow-card"
            >
              <span className="rounded-xl bg-pine-50 p-2 text-pine-700">
                <Icon size={19} />
              </span>
              {label}
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Your pets</h2>
          <Link className="text-sm font-bold text-pine-700" to="/pets">
            View all
          </Link>
        </div>
        {pets.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed text-center shadow-none">
            <p className="font-semibold text-slate-700">
              Your first pet profile starts here.
            </p>
            <Link to="/pets/new" className={`${buttonClass("primary")} mt-4`}>
              Add your first pet
            </Link>
          </Card>
        )}
      </section>
      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Upcoming appointments</h2>
            <Link
              className="text-sm font-bold text-pine-700"
              to="/appointments"
            >
              See all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {upcomingAppointments.length ? (
              upcomingAppointments.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 first:pt-0">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
                    <CalendarPlus size={19} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.pet.name} · {item.reason}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {formatDateTime(item.appointmentDate)} ·{" "}
                      {item.providerName}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-slate-500">
                No upcoming appointments.
              </p>
            )}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent health records</h2>
            <Link
              className="text-sm font-bold text-pine-700"
              to="/health-records"
            >
              See all
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {recentHealthRecords.length ? (
              recentHealthRecords.map((item) => (
                <div key={item.id} className="flex gap-3 py-3 first:pt-0">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-pine-50 text-pine-700">
                    <HeartPulse size={19} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.pet?.name} · {item.title}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {titleCase(item.recordType)} ·{" "}
                      {formatDate(item.recordDate)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-slate-500">
                No health records yet.
              </p>
            )}
          </div>
        </Card>
      </section>
    </>
  );
}
