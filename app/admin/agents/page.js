import Link from "next/link";
import { redirect } from "next/navigation";
import { updateAgentStatus } from "@/app/actions";
import { Field } from "@/components/forms/Field";
import { PageShell } from "@/components/layout/PageShell";
import { getSessionProfile } from "@/lib/data";
import { StatusBadge } from "@/components/property/StatusBadge";
import { inputClass } from "@/components/forms/Field";
import { SAUDI_CITIES } from "@/lib/constants/options";

const AGENT_ROLES = ["agent", "broker"];
const AGENT_STATUSES = ["pending", "approved", "rejected", "suspended"];

function stringParam(searchParams, key) {
  const value = searchParams?.[key];
  return String(Array.isArray(value) ? value[0] || "" : value || "").trim();
}

function buildReturnTo(searchParams) {
  const params = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([key, currentValue]) => {
    const values = Array.isArray(currentValue) ? currentValue : [currentValue];
    values.forEach((item) => {
      if (item) params.append(key, item);
    });
  });

  const query = params.toString();
  return query ? `/admin/agents?${query}` : "/admin/agents";
}

function nextDay(date) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString();
}

function dateParam(searchParams, key) {
  const value = stringParam(searchParams, key);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function searchTerm(value) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

export default async function AdminAgentsPage(props) {
  const searchParams = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/auth/login");

  const statusFilter = AGENT_STATUSES.includes(stringParam(searchParams, "status"))
    ? stringParam(searchParams, "status")
    : "";
  const roleFilter = AGENT_ROLES.includes(stringParam(searchParams, "role"))
    ? stringParam(searchParams, "role")
    : "";
  const cityFilter = SAUDI_CITIES.includes(stringParam(searchParams, "city"))
    ? stringParam(searchParams, "city")
    : "";
  const createdFrom = dateParam(searchParams, "created_from");
  const createdTo = dateParam(searchParams, "created_to");
  const queryText = searchTerm(stringParam(searchParams, "q"));
  const returnTo = buildReturnTo(searchParams);

  let query = supabase
    .from("profiles")
    .select("*")
    .in("role", ["agent", "broker"])
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("approval_status", statusFilter);
  if (roleFilter) query = query.eq("role", roleFilter);
  if (cityFilter) query = query.eq("city", cityFilter);
  if (createdFrom) query = query.gte("created_at", `${createdFrom}T00:00:00.000Z`);
  if (createdTo) query = query.lt("created_at", nextDay(createdTo));
  if (queryText) {
    query = query.or(
      `full_name.ilike.%${queryText}%,email.ilike.%${queryText}%,phone.ilike.%${queryText}%,agency_name.ilike.%${queryText}%,license_number.ilike.%${queryText}%`,
    );
  }

  const { data: agentsData } = await query;
  const agents = agentsData ?? [];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Agent approvals</h1>
            <p className="mt-2 text-sm text-zinc-600">
              {agents.length} {agents.length === 1 ? "agent" : "agents"} match the current filters.
            </p>
          </div>
          <Link className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900" href="/admin">
            Dashboard
          </Link>
        </div>

        <form className="mt-6 grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-[1.3fr_180px_180px_180px_160px_160px_auto_auto] lg:items-end">
          <Field label="Search">
            <input className={inputClass} name="q" defaultValue={queryText} placeholder="Name, email, phone, agency" />
          </Field>
          <Field label="Status">
            <select className={inputClass} name="status" defaultValue={statusFilter}>
              <option value="">All statuses</option>
              {AGENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status[0].toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Role">
            <select className={inputClass} name="role" defaultValue={roleFilter}>
              <option value="">All roles</option>
              {AGENT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role[0].toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City">
            <select className={inputClass} name="city" defaultValue={cityFilter}>
              <option value="">All cities</option>
              {SAUDI_CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Field>
          <Field label="From">
            <input className={inputClass} name="created_from" type="date" defaultValue={createdFrom} />
          </Field>
          <Field label="To">
            <input className={inputClass} name="created_to" type="date" defaultValue={createdTo} />
          </Field>
          <button className="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white">
            Filter
          </button>
          <Link className="rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-900" href="/admin/agents">
            Reset
          </Link>
        </form>

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
                <input type="hidden" name="return_to" value={returnTo} />
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
          {agents.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-lg font-semibold text-zinc-950">No agents found</h2>
              <p className="mt-2 text-sm text-zinc-600">Adjust the filters or reset the search to review all accounts.</p>
            </div>
          ) : null}
        </div>
      </main>
    </PageShell>
  );
}
