import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { createClient } from "@/lib/supabase/server";

export default async function AgentProfilePage(props) {
  const { id } = await props.params;
  const supabase = await createClient();

  const { data: agent } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!agent) notFound();

  const { data: propertiesData } = await supabase
    .from("properties")
    .select("*, property_images(public_url, sort_order)")
    .eq("agent_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  const properties = propertiesData ?? [];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{agent.role}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{agent.full_name}</h1>
          <p className="mt-2 text-zinc-600">{agent.agency_name} · {agent.city}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.phone ? (
              <a className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white" href={`tel:${agent.phone}`}>
                Call
              </a>
            ) : null}
            {agent.whatsapp ? (
              <a className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-900" href={`https://wa.me/${agent.whatsapp.replace(/[^0-9]/g, "")}`}>
                WhatsApp
              </a>
            ) : null}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-950">Published listings</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
          {properties.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
              No published listings for this agent yet.
            </div>
          ) : null}
        </section>
      </main>
    </PageShell>
  );
}
