create table if not exists public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saved_properties_user_property_unique unique (user_id, property_id)
);

create index if not exists saved_properties_user_id_created_at_idx
  on public.saved_properties(user_id, created_at desc);

create index if not exists saved_properties_property_id_idx
  on public.saved_properties(property_id);

alter table public.saved_properties enable row level security;

drop policy if exists saved_properties_select_own on public.saved_properties;
create policy saved_properties_select_own
  on public.saved_properties
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists saved_properties_insert_own_published on public.saved_properties;
create policy saved_properties_insert_own_published
  on public.saved_properties
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.properties p
      where p.id = saved_properties.property_id
        and p.status = 'published'::property_status
    )
  );

drop policy if exists saved_properties_delete_own on public.saved_properties;
create policy saved_properties_delete_own
  on public.saved_properties
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
