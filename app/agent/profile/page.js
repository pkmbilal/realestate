import Link from "next/link";
import { redirect } from "next/navigation";
import { AgentProfileForm } from "@/components/forms/AgentProfileForm";
import { PageShell } from "@/components/layout/PageShell";
import { getSessionProfile } from "@/lib/data";

export default async function AgentProfileSettingsPage(props) {
  const searchParams = await props.searchParams;
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/auth/login");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile || !["agent", "broker"].includes(profile.role)) redirect("/");

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Profile settings</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Update your public profile and contact details.
            </p>
          </div>
          <Link className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900" href="/agent">
            Dashboard
          </Link>
        </div>

        {searchParams?.message ? (
          <p className="mt-4 rounded-md bg-teal-50 p-3 text-sm text-teal-900">{searchParams.message}</p>
        ) : null}
        {searchParams?.error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</p>
        ) : null}

        <section className="mt-6">
          <AgentProfileForm profile={profile} />
        </section>
      </main>
    </PageShell>
  );
}
