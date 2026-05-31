import Link from "next/link";
import { redirect } from "next/navigation";
import { updateLead } from "@/app/actions";
import { Field, inputClass } from "@/components/forms/Field";
import { PageShell } from "@/components/layout/PageShell";
import { StatusBadge } from "@/components/property/StatusBadge";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/constants/leads";
import { getSessionProfile } from "@/lib/data";

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function datetimeLocalValue(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

function buildReturnTo(searchParams) {
  const params = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([key, currentValue]) => {
    if (!currentValue) return;
    params.set(key, currentValue);
  });

  const query = params.toString();
  return query ? `/agent/leads?${query}` : "/agent/leads";
}

function leadMatchesSearch(lead, search) {
  if (!search) return true;
  const haystack = [
    lead.customer_name,
    lead.customer_email,
    lead.customer_phone,
    lead.message,
    lead.properties?.title,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
}

export default async function AgentLeadsPage(props) {
  const searchParams = await props.searchParams;
  const { supabase, user, profile } = await getSessionProfile();

  if (!user) redirect("/auth/login");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile || !["agent", "broker"].includes(profile.role)) redirect("/");

  const statusFilter = LEAD_STATUSES.includes(searchParams?.status) ? searchParams.status : "";
  const search = String(searchParams?.q || "").trim();
  const returnTo = buildReturnTo(searchParams);

  const { data: leadsData } = await supabase
    .from("leads")
    .select(
      "id, property_id, customer_name, customer_phone, customer_email, message, lead_type, status, agent_notes, follow_up_at, created_at, updated_at, properties(title)",
    )
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  const searchedLeads = (leadsData || []).filter((lead) => leadMatchesSearch(lead, search));
  const leads = statusFilter
    ? searchedLeads.filter((lead) => lead.status === statusFilter)
    : searchedLeads;

  const counts = LEAD_STATUSES.reduce(
    (items, status) => ({
      ...items,
      [status]: searchedLeads.filter((lead) => lead.status === status).length,
    }),
    {},
  );

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Leads</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Track enquiries, follow-ups, and outcomes for your listings.
            </p>
          </div>
          <Link className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900" href="/agent">
            Dashboard
          </Link>
        </div>

        {searchParams?.error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</p>
        ) : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {LEAD_STATUSES.map((status) => (
            <div key={status} className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm text-zinc-600">{LEAD_STATUS_LABELS[status]}</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{counts[status] || 0}</p>
            </div>
          ))}
        </section>

        <form className="mt-6 grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-[1fr_220px_auto_auto] md:items-end">
          <Field label="Search">
            <input className={inputClass} name="q" defaultValue={search} placeholder="Name, phone, email, property" />
          </Field>
          <Field label="Status">
            <select className={inputClass} name="status" defaultValue={statusFilter}>
              <option value="">All statuses</option>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </Field>
          <button className="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white">
            Filter
          </button>
          <Link className="rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-900" href="/agent/leads">
            Reset
          </Link>
        </form>

        <section className="mt-8 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {leads.map((lead) => (
            <article key={lead.id} className="grid gap-5 p-4 lg:grid-cols-[1fr_420px]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-zinc-950">{lead.customer_name || "Customer enquiry"}</h2>
                  <StatusBadge status={lead.status} />
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                    {lead.lead_type}
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  {lead.properties?.title || "Property"} · {formatDate(lead.created_at)}
                </p>
                <div className="mt-3 grid gap-1 text-sm text-zinc-700">
                  {lead.customer_phone ? <a href={`tel:${lead.customer_phone}`}>{lead.customer_phone}</a> : null}
                  {lead.customer_email ? <a href={`mailto:${lead.customer_email}`}>{lead.customer_email}</a> : null}
                </div>
                {lead.message ? <p className="mt-4 whitespace-pre-line text-sm leading-6 text-zinc-700">{lead.message}</p> : null}
                <p className="mt-4 text-xs font-medium text-zinc-500">Follow-up: {formatDate(lead.follow_up_at)}</p>
              </div>

              <form action={updateLead} className="grid gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
                <input type="hidden" name="lead_id" value={lead.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <Field label="Status">
                  <select className={inputClass} name="status" defaultValue={lead.status}>
                    {LEAD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {LEAD_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Follow-up">
                  <input className={inputClass} name="follow_up_at" type="datetime-local" defaultValue={datetimeLocalValue(lead.follow_up_at)} />
                </Field>
                <Field label="Agent notes">
                  <textarea className={`${inputClass} min-h-28`} name="agent_notes" defaultValue={lead.agent_notes || ""} />
                </Field>
                <button className="rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white">
                  Save lead
                </button>
              </form>
            </article>
          ))}
          {leads.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-lg font-semibold text-zinc-950">No leads found</h2>
              <p className="mt-2 text-sm text-zinc-600">New enquiries will appear here after users contact you.</p>
            </div>
          ) : null}
        </section>
      </main>
    </PageShell>
  );
}
