alter table public.leads
  add column if not exists status text not null default 'new',
  add column if not exists agent_notes text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.leads
  drop constraint if exists leads_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status = any (array['new'::text, 'contacted'::text, 'qualified'::text, 'closed'::text, 'lost'::text]));

create index if not exists leads_agent_id_status_created_at_idx
  on public.leads(agent_id, status, created_at desc);

create index if not exists leads_agent_id_follow_up_at_idx
  on public.leads(agent_id, follow_up_at)
  where follow_up_at is not null;

drop policy if exists leads_agent_update_own on public.leads;
create policy leads_agent_update_own
  on public.leads
  for update
  to authenticated
  using (agent_id = (select auth.uid()))
  with check (agent_id = (select auth.uid()));
