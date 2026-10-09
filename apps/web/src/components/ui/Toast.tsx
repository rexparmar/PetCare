import { CheckCircle2, X, XCircle } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Toast = { id: number; message: string; type: "success" | "error" };
type ToastContextValue = {
  showToast: (message: string, type?: Toast["type"]) => void;
};
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback(
    (id: number) =>
      setToasts((items) => items.filter((item) => item.id !== id)),
    [],
  );
  const showToast = useCallback(
    (message: string, type: Toast["type"] = "success") => {
      const id = Date.now() + Math.random();
      setToasts((items) => [...items, { id, message, type }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-xl border bg-white p-4 shadow-xl ${toast.type === "success" ? "border-pine-200" : "border-rose-200"}`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="shrink-0 text-pine-600" />
            ) : (
              <XCircle className="shrink-0 text-rose-600" />
            )}
            <p className="flex-1 text-sm font-medium text-slate-700">
              {toast.message}
            </p>
            <button
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-slate-400"
            >
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
