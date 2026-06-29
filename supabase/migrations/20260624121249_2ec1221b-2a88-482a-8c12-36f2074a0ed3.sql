-- ============ ENUM ============
create type public.org_role as enum ('owner','admin','member');

-- ============ ORGANIZATIONS ============
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  brand_name text,
  logo_url text,
  primary_color text not null default '#10b981',
  plan text not null default 'enterprise',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;

-- ============ ORGANIZATION MEMBERS ============
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

grant select, insert, update, delete on public.organization_members to authenticated;
grant all on public.organization_members to service_role;

-- ============ API KEYS ============
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.api_keys to authenticated;
grant all on public.api_keys to service_role;

-- ============ DOCUMENTS: org link ============
alter table public.documents
  add column organization_id uuid references public.organizations(id) on delete set null;

-- ============ PRIVATE HELPERS (no API exposure) ============
create or replace function private.is_org_member(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org and user_id = _user
  );
$$;

create or replace function private.is_org_admin(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org and user_id = _user and role in ('owner','admin')
  );
$$;

create or replace function private.is_org_owner(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = _org and user_id = _user and role = 'owner'
  );
$$;

-- ============ AUTO-OWNER TRIGGER ============
create or replace function public.handle_new_organization()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (NEW.id, NEW.created_by, 'owner');
  return NEW;
end; $$;

revoke execute on function public.handle_new_organization() from public, anon, authenticated;

create trigger on_organization_created
after insert on public.organizations
for each row execute function public.handle_new_organization();

-- ============ updated_at TRIGGER ============
create trigger update_organizations_updated_at
before update on public.organizations
for each row execute function public.update_updated_at_column();

-- ============ RLS ============
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.api_keys enable row level security;

-- organizations
create policy "Members can view their organizations"
on public.organizations for select to authenticated
using (private.is_org_member(id, auth.uid()));

create policy "Authenticated users can create organizations"
on public.organizations for insert to authenticated
with check (created_by = auth.uid());

create policy "Admins can update their organization"
on public.organizations for update to authenticated
using (private.is_org_admin(id, auth.uid()))
with check (private.is_org_admin(id, auth.uid()));

create policy "Owners can delete their organization"
on public.organizations for delete to authenticated
using (private.is_org_owner(id, auth.uid()));

-- organization_members
create policy "Members can view co-members"
on public.organization_members for select to authenticated
using (private.is_org_member(organization_id, auth.uid()));

create policy "Admins can add members"
on public.organization_members for insert to authenticated
with check (private.is_org_admin(organization_id, auth.uid()));

create policy "Admins can update members"
on public.organization_members for update to authenticated
using (private.is_org_admin(organization_id, auth.uid()))
with check (private.is_org_admin(organization_id, auth.uid()));

create policy "Admins can remove members"
on public.organization_members for delete to authenticated
using (private.is_org_admin(organization_id, auth.uid()));

-- api_keys
create policy "Admins can view api keys"
on public.api_keys for select to authenticated
using (private.is_org_admin(organization_id, auth.uid()));

create policy "Admins can create api keys"
on public.api_keys for insert to authenticated
with check (private.is_org_admin(organization_id, auth.uid()) and created_by = auth.uid());

create policy "Admins can update api keys"
on public.api_keys for update to authenticated
using (private.is_org_admin(organization_id, auth.uid()))
with check (private.is_org_admin(organization_id, auth.uid()));

create policy "Admins can delete api keys"
on public.api_keys for delete to authenticated
using (private.is_org_admin(organization_id, auth.uid()));

-- documents: org members can view org documents
create policy "Org members can view org documents"
on public.documents for select to authenticated
using (organization_id is not null and private.is_org_member(organization_id, auth.uid()));