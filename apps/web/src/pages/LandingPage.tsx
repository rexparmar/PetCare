import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  HeartPulse,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Brand } from "../components/layout/Brand";
import { buttonClass } from "../components/ui/Button";

const features = [
  {
    icon: PawPrint,
    title: "Every pet, one place",
    copy: "Keep essential profiles and care details organized for every member of your furry family.",
  },
  {
    icon: HeartPulse,
    title: "Health history that helps",
    copy: "Build a clear timeline of vaccinations, checkups, treatments, and veterinary notes.",
  },
  {
    icon: CalendarCheck2,
    title: "Never miss a visit",
    copy: "Schedule veterinary appointments and see what is coming up from one calm dashboard.",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#fbfcf9]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Brand />
        <nav className="flex items-center gap-2" aria-label="Public navigation">
          <Link to="/login" className={buttonClass("ghost")}>
            Sign in
          </Link>
          <Link to="/register" className={buttonClass("primary")}>
            Get started
          </Link>
        </nav>
      </header>
      <main>
        <section className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-pine-200 bg-pine-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-pine-700">
              <ShieldCheck size={15} /> Private, secure pet care
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">
              Their best life,
              <br />
              <span className="text-pine-600">beautifully organized.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              PetCare brings profiles, health records, and veterinary visits
              together—so you can spend less time searching and more time
              caring.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className={`${buttonClass("primary")} px-6 py-3.5`}
              >
                Create your free account <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className={`${buttonClass("secondary")} px-6 py-3.5`}
              >
                See how it works
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
              {["No spreadsheets", "Real data", "Built for every pet"].map(
                (item) => (
                  <span key={item} className="flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-pine-600" />
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-10 -z-10 rounded-full bg-pine-100/70 blur-3xl" />
            <div className="rotate-1 rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_30px_80px_-30px_rgba(28,94,72,.35)] sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-pine-600">
                    Today
                  </p>
                  <h2 className="mt-1 text-2xl font-extrabold">
                    Good morning, Alex
                  </h2>
                </div>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-2xl">
                  🐾
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-pine-700 p-5 text-white">
                  <p className="text-sm text-pine-100">Pets in your care</p>
                  <p className="mt-2 font-display text-4xl font-extrabold">3</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-5">
                  <p className="text-sm text-amber-700">Next visit</p>
                  <p className="mt-2 font-display text-xl font-bold text-amber-950">
                    Friday
                    <br />
                    <span className="text-sm font-medium">10:30 AM</span>
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-100 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your pets
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-orange-50 text-2xl">
                    🐶
                  </span>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">Milo</p>
                    <p className="text-sm text-slate-500">
                      Beagle · 5 years old
                    </p>
                  </div>
                  <span className="rounded-full bg-pine-50 px-2.5 py-1 text-xs font-bold text-pine-700">
                    All good
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="border-y border-slate-200/70 bg-white py-20"
        >
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[.18em] text-pine-600">
                Care with clarity
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Everything important. Nothing overwhelming.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {features.map(({ icon: Icon, title, copy }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-cream p-6"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-pine-100 text-pine-700">
                    <Icon />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Brand />
        <p>Release 1 · Built for HappyPaws Inc.</p>
      </footer>
    </div>
  );
}
