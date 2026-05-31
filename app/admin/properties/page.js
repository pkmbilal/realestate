import Link from "next/link";
import { redirect } from "next/navigation";
import { updatePropertyStatus } from "@/app/actions";
import { PageShell } from "@/components/layout/PageShell";
import { inputClass } from "@/components/forms/Field";
import { formatPrice, getSessionProfile } from "@/lib/data";
import { StatusBadge } from "@/components/property/StatusBadge";

export default async function AdminPropertiesPage() {
  const { supabase, profile } = await getSessionProfile();
  if (!profile || profile.role !== "admin") redirect("/auth/login");

  const { data: propertiesData } = await supabase
    .from("properties")
    .select("*, profiles(full_name, agency_name, email)")
    .order("created_at", { ascending: false });
  const properties = propertiesData ?? [];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Property approvals</h1>
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
          {properties.length === 0 ? <p className="p-6 text-sm text-zinc-600">No properties yet.</p> : null}
        </div>
      </main>
    </PageShell>
  );
}
