create index if not exists profiles_admin_filters_idx
  on public.profiles(approval_status, role, city, created_at desc);

create index if not exists properties_admin_filters_idx
  on public.properties(status, city, agent_id, created_at desc);
