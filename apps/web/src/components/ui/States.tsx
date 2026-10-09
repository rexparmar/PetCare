import { AlertCircle, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "./Card";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-44 items-center justify-center gap-3 text-sm text-slate-500"
      role="status"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-pine-200 border-t-pine-600" />
      {label}
    </div>
  );
}

export function ErrorState({
  message = "We could not load this information.",
  action,
}: {
  message?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-44 flex-col items-center justify-center text-center">
      <AlertCircle className="mb-3 text-rose-500" aria-hidden="true" />
      <p className="font-semibold text-slate-800">Something went wrong</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-56 flex-col items-center justify-center border-dashed text-center shadow-none">
      <span className="mb-4 rounded-2xl bg-pine-50 p-3 text-pine-700">
        <Inbox aria-hidden="true" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
