alter table public.profiles
  add column if not exists bio text,
  add column if not exists profile_public boolean not null default true;

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible
  on public.profiles
  for select
  using (
    private.is_admin()
    or id = (select auth.uid())
    or (
      role in ('agent'::user_role, 'broker'::user_role)
      and approval_status = 'approved'::approval_status
      and profile_public = true
    )
  );
