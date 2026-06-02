create extension if not exists pg_trgm with schema extensions;

create index if not exists properties_public_search_filters_idx
  on public.properties(status, purpose, city, property_type, bedrooms, bathrooms, price, area_sqm, created_at desc)
  where status = 'published'::property_status;

create index if not exists properties_public_furnished_idx
  on public.properties(status, furnished, created_at desc)
  where status = 'published'::property_status;

create index if not exists properties_public_district_trgm_idx
  on public.properties using gin (district gin_trgm_ops)
  where status = 'published'::property_status;

create index if not exists properties_public_title_trgm_idx
  on public.properties using gin (title gin_trgm_ops)
  where status = 'published'::property_status;

create index if not exists properties_public_description_trgm_idx
  on public.properties using gin (description gin_trgm_ops)
  where status = 'published'::property_status;

create index if not exists properties_public_address_trgm_idx
  on public.properties using gin (address gin_trgm_ops)
  where status = 'published'::property_status;
