import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { User } from "../types/api";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const [show, setShow] = useState(false);
  const { refresh } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function submit(values: FormData) {
    try {
      await api<User>("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      await refresh();
      showToast("Welcome back!");
      const destination =
        (location.state as { from?: { pathname?: string } } | null)?.from
          ?.pathname ?? "/dashboard";
      navigate(destination, { replace: true });
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Unable to sign in.",
      });
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue caring with confidence."
      alternate={{
        prompt: "New to PetCare?",
        label: "Create an account",
        to: "/register",
      }}
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
        {errors.root && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {errors.root.message}
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="field-input"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="field-error">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="field-input pr-11"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-2.5 top-2.5 rounded p-1 text-slate-400"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {errors.password && (
            <p className="field-error">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full py-3" disabled={isSubmitting}>
          {isSubmitting ? (
            "Signing in…"
          ) : (
            <>
              <LogIn size={18} /> Sign in
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
