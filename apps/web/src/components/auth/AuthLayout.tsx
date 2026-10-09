import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Brand } from "../layout/Brand";

export function AuthLayout({
  title,
  subtitle,
  alternate,
  children,
}: {
  title: string;
  subtitle: string;
  alternate: { prompt: string; label: string; to: string };
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_.85fr]">
      <section className="flex flex-col bg-white px-5 py-6 sm:px-10 lg:px-16">
        <Brand />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-7 text-center text-sm text-slate-500">
            {alternate.prompt}{" "}
            <Link
              className="font-bold text-pine-700 hover:text-pine-800"
              to={alternate.to}
            >
              {alternate.label}
            </Link>
          </p>
        </div>
      </section>
      <aside className="relative hidden overflow-hidden bg-pine-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border-[60px] border-pine-700/60" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-pine-700/50" />
        <p className="relative z-10 text-sm font-bold uppercase tracking-[.2em] text-pine-200">
          HappyPaws care companion
        </p>
        <blockquote className="relative z-10 max-w-lg">
          <span className="text-6xl text-pine-400">“</span>
          <p className="-mt-5 font-display text-3xl font-bold leading-tight">
            All their care details, ready when it matters most.
          </p>
          <footer className="mt-6 text-sm text-pine-200">
            Secure, organized, and always yours.
          </footer>
        </blockquote>
        <div className="relative z-10 flex gap-3 text-5xl">
          <span>🐕</span>
          <span>🐈</span>
          <span>🐇</span>
        </div>
      </aside>
    </main>
  );
}
