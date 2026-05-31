import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyCard } from "@/components/property/PropertyCard";
import { createClient } from "@/lib/supabase/server";

export default async function SavedPropertiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/auth/login?message=${encodeURIComponent("Login to view saved properties.")}&redirect_to=${encodeURIComponent(
        "/saved",
      )}`,
    );
  }

  const { data } = await supabase
    .from("saved_properties")
    .select("created_at, properties(*, property_images(public_url, sort_order), profiles(full_name, phone, whatsapp, agency_name))")
    .order("created_at", { ascending: false });

  const properties = (data || [])
    .map((savedProperty) => savedProperty.properties)
    .filter(Boolean)
    .map((property) => ({
      ...property,
      property_images: [...(property.property_images || [])].sort((a, b) => a.sort_order - b.sort_order),
    }));

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Saved properties</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Review the listings you saved while browsing.
            </p>
          </div>
          <Link className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900" href="/">
            Browse properties
          </Link>
        </div>

        <section className="mt-8">
          {properties.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} isSaved returnTo="/saved" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-zinc-950">No saved properties yet</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Save listings from the property results or detail pages to build a shortlist.
              </p>
              <Link className="mt-5 inline-flex rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white" href="/">
                Find properties
              </Link>
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
