import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Field, inputClass } from "@/components/forms/Field";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PROPERTY_TYPES, SAUDI_CITIES } from "@/lib/constants/options";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 9;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "area_desc", label: "Largest area" },
];

function stringParam(searchParams, key) {
  const value = searchParams?.[key];
  return String(Array.isArray(value) ? value[0] || "" : value || "").trim();
}

function enumParam(searchParams, key, allowedValues) {
  const value = stringParam(searchParams, key);
  return allowedValues.includes(value) ? value : "";
}

function numberParam(searchParams, key) {
  const value = stringParam(searchParams, key);
  if (!value) return "";

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : "";
}

function pageParam(searchParams) {
  const value = Number(stringParam(searchParams, "page"));
  return Number.isInteger(value) && value > 0 ? value : 1;
}

function searchTerm(value) {
  return value.replace(/[%,()]/g, " ").replace(/\s+/g, " ").trim();
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
  return query ? `/?${query}` : "/";
}

function buildPageHref(searchParams, page) {
  const params = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([key, currentValue]) => {
    if (key === "page") return;

    const values = Array.isArray(currentValue) ? currentValue : [currentValue];
    values.forEach((item) => {
      if (item) params.append(key, item);
    });
  });

  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function applyPropertyFilters(query, filters) {
  let filteredQuery = query.eq("status", "published");

  if (filters.purpose) filteredQuery = filteredQuery.eq("purpose", filters.purpose);
  if (filters.city) filteredQuery = filteredQuery.eq("city", filters.city);
  if (filters.district) filteredQuery = filteredQuery.ilike("district", `%${filters.district}%`);
  if (filters.propertyType) filteredQuery = filteredQuery.eq("property_type", filters.propertyType);
  if (filters.minPrice !== "") filteredQuery = filteredQuery.gte("price", filters.minPrice);
  if (filters.maxPrice !== "") filteredQuery = filteredQuery.lte("price", filters.maxPrice);
  if (filters.bedrooms !== "") filteredQuery = filteredQuery.gte("bedrooms", filters.bedrooms);
  if (filters.bathrooms !== "") filteredQuery = filteredQuery.gte("bathrooms", filters.bathrooms);
  if (filters.minArea !== "") filteredQuery = filteredQuery.gte("area_sqm", filters.minArea);
  if (filters.maxArea !== "") filteredQuery = filteredQuery.lte("area_sqm", filters.maxArea);
  if (filters.furnished) filteredQuery = filteredQuery.eq("furnished", filters.furnished === "yes");
  if (filters.q) {
    filteredQuery = filteredQuery.or(
      `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%,district.ilike.%${filters.q}%,address.ilike.%${filters.q}%`,
    );
  }

  return filteredQuery;
}

function applySort(query, sort) {
  if (sort === "price_asc") return query.order("price", { ascending: true }).order("created_at", { ascending: false });
  if (sort === "price_desc") return query.order("price", { ascending: false }).order("created_at", { ascending: false });
  if (sort === "area_desc") return query.order("area_sqm", { ascending: false }).order("created_at", { ascending: false });

  return query.order("created_at", { ascending: false });
}

export default async function Home(props) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const returnTo = buildReturnTo(searchParams);
  const filters = {
    q: searchTerm(stringParam(searchParams, "q")),
    purpose: enumParam(searchParams, "purpose", ["sale", "rent"]),
    city: enumParam(searchParams, "city", SAUDI_CITIES),
    district: searchTerm(stringParam(searchParams, "district")),
    propertyType: enumParam(searchParams, "property_type", PROPERTY_TYPES),
    minPrice: numberParam(searchParams, "min_price"),
    maxPrice: numberParam(searchParams, "max_price"),
    bedrooms: numberParam(searchParams, "bedrooms"),
    bathrooms: numberParam(searchParams, "bathrooms"),
    minArea: numberParam(searchParams, "min_area"),
    maxArea: numberParam(searchParams, "max_area"),
    furnished: enumParam(searchParams, "furnished", ["yes", "no"]),
    sort: enumParam(searchParams, "sort", SORT_OPTIONS.map((option) => option.value)) || "newest",
    page: pageParam(searchParams),
  };
  const rangeStart = (filters.page - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;

  function buildPropertyQuery() {
    const propertyQuery = supabase
      .from("properties")
      .select("*, property_images(public_url, sort_order), profiles(full_name, phone, whatsapp, agency_name)", {
        count: "exact",
      });

    return applySort(applyPropertyFilters(propertyQuery, filters), filters.sort);
  }

  const { count, data } = await buildPropertyQuery().range(rangeStart, rangeEnd);
  const totalResults = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const currentPage = Math.min(filters.page, totalPages);
  let properties = data ?? [];

  if (totalResults > 0 && filters.page > totalPages) {
    const lastPageStart = (totalPages - 1) * PAGE_SIZE;
    const lastPageEnd = lastPageStart + PAGE_SIZE - 1;
    const { data: lastPageData } = await buildPropertyQuery().range(lastPageStart, lastPageEnd);
    properties = lastPageData ?? [];
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: savedData } = user && properties.length > 0
    ? await supabase
        .from("saved_properties")
        .select("property_id")
        .in("property_id", properties.map((property) => property.id))
    : { data: [] };
  const savedPropertyIds = new Set((savedData || []).map((item) => item.property_id));

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
          <form action="/" className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-3">
            <Field label="Keyword">
              <input className={inputClass} name="q" defaultValue={filters.q} placeholder="Title, district, address" />
            </Field>
            <Field label="Purpose">
              <select className={inputClass} name="purpose" defaultValue={filters.purpose}>
                <option value="">Any</option>
                <option value="sale">Buy</option>
                <option value="rent">Rent</option>
              </select>
            </Field>
            <Field label="City">
              <select className={inputClass} name="city" defaultValue={filters.city}>
                <option value="">Any city</option>
                {SAUDI_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="District">
              <input className={inputClass} name="district" defaultValue={filters.district} />
            </Field>
            <Field label="Property type">
              <select className={inputClass} name="property_type" defaultValue={filters.propertyType}>
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Min price">
              <input className={inputClass} name="min_price" type="number" min="0" defaultValue={filters.minPrice} />
            </Field>
            <Field label="Max price">
              <input className={inputClass} name="max_price" type="number" min="0" defaultValue={filters.maxPrice} />
            </Field>
            <Field label="Bedrooms">
              <input className={inputClass} name="bedrooms" type="number" min="0" defaultValue={filters.bedrooms} />
            </Field>
            <Field label="Bathrooms">
              <input className={inputClass} name="bathrooms" type="number" min="0" defaultValue={filters.bathrooms} />
            </Field>
            <Field label="Min area">
              <input className={inputClass} name="min_area" type="number" min="0" defaultValue={filters.minArea} />
            </Field>
            <Field label="Max area">
              <input className={inputClass} name="max_area" type="number" min="0" defaultValue={filters.maxArea} />
            </Field>
            <Field label="Furnished">
              <select className={inputClass} name="furnished" defaultValue={filters.furnished}>
                <option value="">Any</option>
                <option value="yes">Furnished</option>
                <option value="no">Unfurnished</option>
              </select>
            </Field>
            <Field label="Sort">
              <select className={inputClass} name="sort" defaultValue={filters.sort}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <button className="self-end rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white">
              Search properties
            </button>
            <Link className="self-end rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-900" href="/">
              Reset
            </Link>
          </form>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-zinc-950">Published properties</h2>
            <p className="text-sm text-zinc-600">
              {totalResults} {totalResults === 1 ? "result" : "results"}
            </p>
          </div>
          {properties.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isSaved={savedPropertyIds.has(property.id)}
                  returnTo={returnTo}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-zinc-600">
              No published properties match this search.
            </div>
          )}
          {totalPages > 1 ? (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                  currentPage <= 1
                    ? "pointer-events-none border-zinc-200 text-zinc-400"
                    : "border-zinc-300 text-zinc-900"
                }`}
                href={buildPageHref(searchParams, Math.max(1, currentPage - 1))}
              >
                Previous
              </Link>
              <span className="text-sm text-zinc-600">
                Page {currentPage} of {totalPages}
              </span>
              <Link
                className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                  currentPage >= totalPages
                    ? "pointer-events-none border-zinc-200 text-zinc-400"
                    : "border-zinc-300 text-zinc-900"
                }`}
                href={buildPageHref(searchParams, Math.min(totalPages, currentPage + 1))}
              >
                Next
              </Link>
            </div>
          ) : null}
        </section>
      </main>
    </PageShell>
  );
}
