import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout } from "../components/auth/AuthLayout";
import { Button } from "../components/ui/Button";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import type { User } from "../types/api";

const schema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(120),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .regex(/[a-z]/, "Add a lowercase letter.")
      .regex(/[A-Z]/, "Add an uppercase letter.")
      .regex(/[0-9]/, "Add a number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const { refresh } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  async function submit(values: FormData) {
    try {
      await api<User>("/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      });
      await refresh();
      showToast("Your PetCare account is ready.");
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create your account.",
      });
    }
  }
  return (
    <AuthLayout
      title="Create your account"
      subtitle="A calmer way to keep every care detail close."
      alternate={{
        prompt: "Already have an account?",
        label: "Sign in",
        to: "/login",
      }}
    >
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        {errors.root && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {errors.root.message}
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            autoComplete="name"
            className="field-input"
            {...register("fullName")}
          />
          {errors.fullName && (
            <p className="field-error">{errors.fullName.message}</p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="field-input"
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
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className="field-input"
            {...register("password")}
          />
          {errors.password ? (
            <p className="field-error">{errors.password.message}</p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
              <Check size={13} /> 10+ characters, uppercase, lowercase, and a
              number
            </p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="confirmPassword">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="field-input"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="field-error">{errors.confirmPassword.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full py-3" disabled={isSubmitting}>
          {isSubmitting ? (
            "Creating account…"
          ) : (
            <>
              Create account <ArrowRight size={18} />
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
