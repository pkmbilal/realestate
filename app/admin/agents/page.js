import { redirect } from "next/navigation";
import { updateAgentStatus } from "@/app/actions";
import { PageShell } from "@/components/layout/PageShell";
import { getSessionProfile } from "@/lib/data";
import { StatusBadge } from "@/components/property/StatusBadge";
import { inputClass } from "@/components/forms/Field";

export default async function AdminAgentsPage() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/auth/login");

  const { data: agentsData } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["agent", "broker"])
    .order("created_at", { ascending: false });
  const agents = agentsData ?? [];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Agent approvals</h1>
        <div className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {agents.map((agent) => (
            <div key={agent.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-zinc-950">{agent.full_name}</h2>
                  <StatusBadge status={agent.approval_status} />
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  {agent.role} · {agent.agency_name} · {agent.city}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {agent.email} · {agent.phone} · License {agent.license_number}
                </p>
              </div>
              <form action={updateAgentStatus} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                <input type="hidden" name="agent_id" value={agent.id} />
                <select className={inputClass} name="approval_status" defaultValue={agent.approval_status}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
                <input className={inputClass} name="rejection_reason" placeholder="Reason" defaultValue={agent.rejection_reason || ""} />
                <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
              </form>
            </div>
          ))}
          {agents.length === 0 ? <p className="p-6 text-sm text-zinc-600">No agents yet.</p> : null}
        </div>
      </main>
    </PageShell>
  );
}
