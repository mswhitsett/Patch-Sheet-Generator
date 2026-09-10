create extension if not exists pgcrypto;

create table public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.patch_sheets (
  id uuid primary key,
  title text not null,
  sheet_date date not null,
  name text not null default '',
  status text not null default 'draft' check (status in ('draft', 'final')),
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.patch_rows (
  id uuid primary key,
  sheet_id uuid not null references public.patch_sheets(id) on delete cascade,
  instrument text not null default '',
  source_type text not null check (source_type in ('DX1','DX2','DX3','DX4','Dante')),
  input_number integer not null check (input_number between 1 and 16),
  position integer not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.patch_sheet_revisions (
  id bigint generated always as identity primary key,
  sheet_id uuid not null,
  version bigint not null,
  snapshot jsonb not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users(id)
);

alter table public.team_members enable row level security;
alter table public.patch_sheets enable row level security;
alter table public.patch_rows enable row level security;
alter table public.patch_sheet_revisions enable row level security;

create function public.is_team_member() returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.team_members where user_id = auth.uid()) $$;

create policy "members read roster" on public.team_members for select to authenticated using (public.is_team_member());
create policy "members read sheets" on public.patch_sheets for select to authenticated using (public.is_team_member());
create policy "members read rows" on public.patch_rows for select to authenticated using (public.is_team_member());
create policy "members read revisions" on public.patch_sheet_revisions for select to authenticated using (public.is_team_member());

create or replace function public.save_patch_sheet(
  p_sheet_id uuid, p_expected_version bigint, p_title text, p_sheet_date date,
  p_name text, p_status text, p_rows jsonb
) returns bigint language plpgsql security definer set search_path = public as $$
declare current_sheet public.patch_sheets; new_version bigint;
begin
  if not public.is_team_member() then raise exception 'Not authorized'; end if;
  select * into current_sheet from public.patch_sheets where id = p_sheet_id for update;
  if found and current_sheet.status = 'final' and p_status = 'final' then raise exception 'Final sheets are locked'; end if;
  if found and current_sheet.version <> p_expected_version then raise exception 'Version conflict: reload before saving'; end if;
  if found then
    insert into public.patch_sheet_revisions(sheet_id, version, snapshot, changed_by)
    values (current_sheet.id, current_sheet.version, to_jsonb(current_sheet) || jsonb_build_object('rows',
      coalesce((select jsonb_agg(to_jsonb(r) order by position) from public.patch_rows r where r.sheet_id=current_sheet.id),'[]'::jsonb)), auth.uid());
    new_version := current_sheet.version + 1;
    update public.patch_sheets set title=p_title, sheet_date=p_sheet_date, name=p_name, status=p_status,
      version=new_version, updated_at=now(), updated_by=auth.uid() where id=p_sheet_id;
  else
    if p_expected_version <> 0 then raise exception 'Version conflict: sheet no longer exists'; end if;
    new_version := 1;
    insert into public.patch_sheets(id,title,sheet_date,name,status,version,updated_by)
    values(p_sheet_id,p_title,p_sheet_date,p_name,p_status,new_version,auth.uid());
  end if;
  insert into public.patch_rows(id,sheet_id,instrument,source_type,input_number,position,updated_by)
  select (x->>'id')::uuid,p_sheet_id,coalesce(x->>'instrument',''),x->>'source_type',(x->>'input_number')::int,
    (x->>'position')::int,auth.uid() from jsonb_array_elements(p_rows) x
  on conflict (id) do update set
    instrument=excluded.instrument, source_type=excluded.source_type, input_number=excluded.input_number,
    position=excluded.position, version=patch_rows.version+1, updated_at=now(), updated_by=auth.uid()
  where patch_rows.sheet_id=p_sheet_id;
  delete from public.patch_rows r where r.sheet_id=p_sheet_id
    and not exists (select 1 from jsonb_array_elements(p_rows) x where (x->>'id')::uuid=r.id);
  return new_version;
end $$;

revoke all on function public.save_patch_sheet(uuid,bigint,text,date,text,text,jsonb) from public;
grant execute on function public.save_patch_sheet(uuid,bigint,text,date,text,text,jsonb) to authenticated;

alter publication supabase_realtime add table public.patch_sheets, public.patch_rows;
