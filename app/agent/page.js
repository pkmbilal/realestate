import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { StatusBadge } from "@/components/property/StatusBadge";
import { deleteProperty } from "@/app/actions";
import { formatPrice, getSessionProfile } from "@/lib/data";

export default async function AgentDashboard(props) {
  const searchParams = await props.searchParams;
  const { supabase, user, profile } = await getSessionProfile();

  if (!user) redirect("/auth/login");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile || !["agent", "broker"].includes(profile.role)) redirect("/");

  const { data: propertiesData } = await supabase
    .from("properties")
    .select("*, property_images(public_url, sort_order)")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false });

  const properties = propertiesData ?? [];

  const { data: leadsData } = await supabase
    .from("leads")
    .select("id, property_id, customer_name, customer_phone, customer_email, message, created_at, properties(title)")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(8);
  const leads = leadsData ?? [];

  const stats = {
    total: properties.length,
    pending: properties.filter((item) => item.status === "pending").length,
    published: properties.filter((item) => item.status === "published").length,
    leads: leads.length,
  };

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Agent dashboard</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Account status: <StatusBadge status={profile.approval_status} />
            </p>
          </div>
          <Link className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white" href="/agent/properties/new">
            Add property
          </Link>
        </div>
        {searchParams?.error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</p>
        ) : null}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stats).map(([label, value]) => (
            <div key={label} className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-sm capitalize text-zinc-600">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-zinc-950">{value}</p>
            </div>
          ))}
        </section>
        <section className="mt-8 rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-4">
            <h2 className="font-semibold text-zinc-950">My properties</h2>
          </div>
          <div className="divide-y divide-zinc-200">
            {properties.map((property) => (
              <div key={property.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-zinc-950">{property.title}</h3>
                    <StatusBadge status={property.status} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-600">
                    {formatPrice(property.price, property.purpose)} · {property.district}, {property.city}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium" href={`/agent/properties/${property.id}/edit`}>
                    Edit
                  </Link>
                  <form action={deleteProperty}>
                    <input type="hidden" name="property_id" value={property.id} />
                    <button className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
            {properties.length === 0 ? <p className="p-6 text-sm text-zinc-600">No properties yet.</p> : null}
          </div>
        </section>
        <section className="mt-8 rounded-lg border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 p-4">
            <h2 className="font-semibold text-zinc-950">Recent leads</h2>
          </div>
          <div className="divide-y divide-zinc-200">
            {leads.map((lead) => (
              <div key={lead.id} className="p-4">
                <p className="font-medium text-zinc-950">{lead.customer_name || "Customer enquiry"}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {lead.properties?.title} · {lead.customer_phone || lead.customer_email}
                </p>
                {lead.message ? <p className="mt-2 text-sm text-zinc-700">{lead.message}</p> : null}
              </div>
            ))}
            {leads.length === 0 ? <p className="p-6 text-sm text-zinc-600">No leads yet.</p> : null}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
