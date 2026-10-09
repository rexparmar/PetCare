import { CalendarDays, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

export function AccountPage() {
  const { user } = useAuth();
  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Your profile"
        description="The account information connected to your private PetCare workspace."
      />
      <div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
        <Card className="text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-pine-100 font-display text-3xl font-extrabold text-pine-700">
            {user?.fullName.charAt(0).toUpperCase()}
          </span>
          <h2 className="mt-4 text-xl font-bold">{user?.fullName}</h2>
          <p className="mt-1 text-sm text-slate-500">Pet owner</p>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Account details</h2>
          <dl className="mt-5 divide-y divide-slate-100">
            <div className="flex items-center gap-4 py-4 first:pt-0">
              <span className="rounded-xl bg-pine-50 p-2.5 text-pine-700">
                <UserRound size={19} />
              </span>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full name
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {user?.fullName}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-4 py-4">
              <span className="rounded-xl bg-pine-50 p-2.5 text-pine-700">
                <Mail size={19} />
              </span>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {user?.email}
                </dd>
              </div>
            </div>
            <div className="flex items-center gap-4 py-4">
              <span className="rounded-xl bg-pine-50 p-2.5 text-pine-700">
                <CalendarDays size={19} />
              </span>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Member since
                </dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {formatDate(user?.createdAt)}
                </dd>
              </div>
            </div>
          </dl>
          <div className="mt-3 flex gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            <LockKeyhole size={20} className="shrink-0 text-pine-700" />
            <p>
              Your session is stored in a secure HTTP-only cookie. Password
              hashes and session tokens are never exposed to the browser.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
