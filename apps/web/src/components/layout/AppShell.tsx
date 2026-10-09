import {
  CalendarDays,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  PawPrint,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { useToast } from "../ui/Toast";
import { Brand } from "./Brand";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/pets", label: "My pets", icon: PawPrint },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/health-records", label: "Health records", icon: HeartPulse },
  { to: "/account", label: "My account", icon: UserRound },
];

export function AppShell() {
  const { user, clear } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function logout() {
    try {
      await api<void>("/auth/logout", { method: "POST" });
      clear();
      navigate("/login");
      showToast("You have been signed out.");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to sign out.",
        "error",
      );
    }
  }

  const sidebar = (
    <>
      <div className="flex h-20 items-center justify-between px-5">
        <Brand />
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-2 text-slate-500 lg:hidden"
          aria-label="Close navigation"
        >
          <X />
        </button>
      </div>
      <nav
        className="flex-1 space-y-1 px-3 py-4"
        aria-label="Primary navigation"
      >
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-pine-50 text-pine-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`
            }
          >
            <Icon size={19} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pine-100 font-bold text-pine-700">
            {user?.fullName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">
              {user?.fullName}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut size={18} /> Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200/80 bg-white lg:flex">
        {sidebar}
      </aside>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <aside
            className="flex h-full w-72 flex-col bg-white"
            onClick={(event) => event.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Brand />
        <button
          className="rounded-xl border border-slate-200 p-2 text-slate-600"
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
        >
          <Menu />
        </button>
      </header>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
