import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePropertyStatus } from "@/app/actions";
import { Field } from "@/components/forms/Field";
import { PageShell } from "@/components/layout/PageShell";
import { inputClass } from "@/components/forms/Field";
import { PROPERTY_STATUSES, SAUDI_CITIES } from "@/lib/constants/options";
import { formatPrice, getSessionProfile } from "@/lib/data";
import { StatusBadge } from "@/components/property/StatusBadge";

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
  return query ? `/admin/properties?${query}` : "/admin/properties";
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

function uuidParam(searchParams, key) {
  const value = stringParam(searchParams, key);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : "";
}

function searchTerm(value) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
}

export default async function AdminPropertiesPage(props) {
  const searchParams = await props.searchParams;
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/auth/login");

  const statusFilter = PROPERTY_STATUSES.includes(stringParam(searchParams, "status"))
    ? stringParam(searchParams, "status")
    : "";
  const cityFilter = SAUDI_CITIES.includes(stringParam(searchParams, "city"))
    ? stringParam(searchParams, "city")
    : "";
  const agentFilter = uuidParam(searchParams, "agent_id");
  const createdFrom = dateParam(searchParams, "created_from");
  const createdTo = dateParam(searchParams, "created_to");
  const queryText = searchTerm(stringParam(searchParams, "q"));
  const returnTo = buildReturnTo(searchParams);

  let query = supabase
    .from("properties")
    .select("*, profiles(full_name, agency_name, email)")
    .order("created_at", { ascending: false });

  if (statusFilter) query = query.eq("status", statusFilter);
  if (cityFilter) query = query.eq("city", cityFilter);
  if (agentFilter) query = query.eq("agent_id", agentFilter);
  if (createdFrom) query = query.gte("created_at", `${createdFrom}T00:00:00.000Z`);
  if (createdTo) query = query.lt("created_at", nextDay(createdTo));
  if (queryText) {
    query = query.or(
      `title.ilike.%${queryText}%,description.ilike.%${queryText}%,district.ilike.%${queryText}%,address.ilike.%${queryText}%`,
    );
  }

  const [{ data: propertiesData }, { data: agentsData }] = await Promise.all([
    query,
    supabase
      .from("profiles")
      .select("id, full_name, agency_name, email")
      .in("role", ["agent", "broker"])
      .order("full_name", { ascending: true }),
  ]);
  const properties = propertiesData ?? [];
  const agents = agentsData ?? [];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Property approvals</h1>
            <p className="mt-2 text-sm text-zinc-600">
              {properties.length} {properties.length === 1 ? "listing" : "listings"} match the current filters.
            </p>
          </div>
          <Link className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900" href="/admin">
            Dashboard
          </Link>
        </div>

        <form className="mt-6 grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-[1.3fr_180px_180px_220px_160px_160px_auto_auto] lg:items-end">
          <Field label="Search">
            <input className={inputClass} name="q" defaultValue={queryText} placeholder="Title, district, address" />
          </Field>
          <Field label="Status">
            <select className={inputClass} name="status" defaultValue={statusFilter}>
              <option value="">All statuses</option>
              {PROPERTY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status[0].toUpperCase() + status.slice(1)}
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
          <Field label="Agent">
            <select className={inputClass} name="agent_id" defaultValue={agentFilter}>
              <option value="">All agents</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.full_name || agent.email}
                  {agent.agency_name ? `, ${agent.agency_name}` : ""}
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
          <Link className="rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-900" href="/admin/properties">
            Reset
          </Link>
        </form>

        <div className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
          {properties.map((property) => (
            <div key={property.id} className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link className="font-semibold text-zinc-950" href={`/properties/${property.id}`}>
                    {property.title}
                  </Link>
                  <StatusBadge status={property.status} />
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  {formatPrice(property.price, property.purpose)} · {property.district}, {property.city}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {property.profiles?.full_name} · {property.profiles?.agency_name}
                </p>
              </div>
              <form action={updatePropertyStatus} className="grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                <input type="hidden" name="property_id" value={property.id} />
                <input type="hidden" name="return_to" value={returnTo} />
                <select className={inputClass} name="status" defaultValue={property.status}>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input className={inputClass} name="rejection_reason" placeholder="Reason" defaultValue={property.rejection_reason || ""} />
                <button className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white">
                  Save
                </button>
              </form>
            </div>
          ))}
          {properties.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-lg font-semibold text-zinc-950">No properties found</h2>
              <p className="mt-2 text-sm text-zinc-600">Adjust the filters or reset the search to review all listings.</p>
            </div>
          ) : null}
        </div>
      </main>
    </PageShell>
  );
}
