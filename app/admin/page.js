import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { getSessionProfile } from "@/lib/data";

export default async function AdminDashboard() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/auth/login");

  const [{ count: pendingAgents = 0 }, { count: pendingProperties = 0 }, { count: published = 0 }, { count: leads = 0 }] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("leads").select("id", { count: "exact", head: true }),
    ]);

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Admin dashboard</h1>
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Pending agents", pendingAgents],
            ["Pending properties", pendingProperties],
            ["Published", published],
            ["Leads", leads],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
            </div>
          ))}
        </section>
        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Link className="rounded-lg border border-zinc-200 bg-white p-6" href="/admin/agents">
            <h2 className="font-semibold text-zinc-950">Review agents</h2>
            <p className="mt-2 text-sm text-zinc-600">Approve, reject, or suspend broker accounts.</p>
          </Link>
          <Link className="rounded-lg border border-zinc-200 bg-white p-6" href="/admin/properties">
            <h2 className="font-semibold text-zinc-950">Review properties</h2>
            <p className="mt-2 text-sm text-zinc-600">Publish or reject submitted listings.</p>
          </Link>
        </section>
      </main>
    </PageShell>
  );
}
