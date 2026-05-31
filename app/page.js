import { PageShell } from "@/components/layout/PageShell";
import { Field, inputClass } from "@/components/forms/Field";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PROPERTY_TYPES, SAUDI_CITIES } from "@/lib/constants/options";
import { createClient } from "@/lib/supabase/server";

export default async function Home(props) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("properties")
    .select("*, property_images(public_url, sort_order), profiles(full_name, phone, whatsapp, agency_name)")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (searchParams?.purpose) query = query.eq("purpose", searchParams.purpose);
  if (searchParams?.city) query = query.eq("city", searchParams.city);
  if (searchParams?.district) query = query.ilike("district", `%${searchParams.district}%`);
  if (searchParams?.property_type) query = query.eq("property_type", searchParams.property_type);
  if (searchParams?.min_price) query = query.gte("price", Number(searchParams.min_price));
  if (searchParams?.max_price) query = query.lte("price", Number(searchParams.max_price));
  if (searchParams?.bedrooms) query = query.gte("bedrooms", Number(searchParams.bedrooms));

  const { data } = await query;
  const properties = data ?? [];

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Saudi real estate marketplace
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl">
              Find approved broker listings without the noise.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
              Browse homes, land, and commercial spaces from reviewed agents and brokers.
            </p>
          </div>
          <form className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-2">
            <Field label="Purpose">
              <select className={inputClass} name="purpose" defaultValue={searchParams?.purpose || ""}>
                <option value="">Any</option>
                <option value="sale">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </Field>
            <Field label="City">
              <select className={inputClass} name="city" defaultValue={searchParams?.city || ""}>
                <option value="">Any city</option>
                {SAUDI_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="District">
              <input className={inputClass} name="district" defaultValue={searchParams?.district || ""} />
            </Field>
            <Field label="Property type">
              <select className={inputClass} name="property_type" defaultValue={searchParams?.property_type || ""}>
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Min price">
              <input className={inputClass} name="min_price" type="number" defaultValue={searchParams?.min_price || ""} />
            </Field>
            <Field label="Max price">
              <input className={inputClass} name="max_price" type="number" defaultValue={searchParams?.max_price || ""} />
            </Field>
            <Field label="Bedrooms">
              <input className={inputClass} name="bedrooms" type="number" min="0" defaultValue={searchParams?.bedrooms || ""} />
            </Field>
            <button className="self-end rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white">
              Search properties
            </button>
          </form>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-950">Published properties</h2>
            <p className="text-sm text-zinc-600">{properties.length} results</p>
          </div>
          {properties.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600">
              No published properties match this search.
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}
