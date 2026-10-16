-- Run once in a new Supabase project using the SQL editor.
create extension if not exists pgcrypto;
create table public.profiles (id uuid primary key references auth.users on delete cascade,name text not null default '',avatar_url text,created_at timestamptz not null default now());
create table public.user_roles (user_id uuid primary key references auth.users on delete cascade,role text not null check(role='admin'));
create table public.emergency_data (user_id uuid primary key references auth.users on delete cascade,name text not null default '',phone text not null default '',blood text not null default '',allergies text not null default '',medical text not null default '',contact text not null default '',alt_contact text not null default '',share boolean not null default false);
create table public.chat_groups(id uuid primary key default gen_random_uuid(),name text not null,owner_id uuid not null references auth.users,created_at timestamptz not null default now());
create table public.group_members(group_id uuid references public.chat_groups on delete cascade,user_id uuid references auth.users on delete cascade,primary key(group_id,user_id));
create function public.is_group_member(g uuid) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from group_members where group_id=g and user_id=auth.uid()) $$;
create table public.messages(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users,recipient_id uuid references auth.users,group_id uuid references public.chat_groups,body text not null check(length(body) between 1 and 4000),created_at timestamptz not null default now(),check((recipient_id is null)<>(group_id is null)));
create table public.message_receipts(message_id uuid references public.messages on delete cascade,user_id uuid references auth.users,acknowledged_at timestamptz not null default now(),primary key(message_id,user_id));
create table public.sos_records(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users,recipient_id uuid references auth.users,category text not null check(category in ('Medical','Trapped','Lost','Fire')),notes text not null default '' check(length(notes)<=2000),latitude double precision check(latitude between -90 and 90),longitude double precision check(longitude between -180 and 180),created_at timestamptz not null default now(),acknowledged_at timestamptz,acknowledged_by uuid references auth.users);
create table public.hazard_reports(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users,kind text not null check(kind in ('Hazard','Shelter','Hospital','Water')),description text not null check(length(description) between 1 and 2000),latitude double precision not null check(latitude between -90 and 90),longitude double precision not null check(longitude between -180 and 180),severity text not null check(severity in ('yellow','orange','red')),verified boolean not null default false,hidden boolean not null default false,created_at timestamptz not null default now());
create table public.bands(id uuid primary key default gen_random_uuid(),activation_hash text not null unique,user_id uuid references auth.users,activated_at timestamptz,created_at timestamptz not null default now());
create table public.orders(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users,quantity integer not null check(quantity between 1 and 10),amount integer not null check(amount=quantity*29900),razorpay_order_id text not null unique,payment_id text unique,status text not null default 'created' check(status in ('created','paid')),fulfillment text not null default 'pending' check(fulfillment in ('pending','shipped')),created_at timestamptz not null default now());
create table public.weather_alerts(id uuid primary key default gen_random_uuid(),title text not null,description text not null,severity text not null check(severity in ('yellow','orange','red')),region text not null,source_url text not null,source_name text not null,issued_at timestamptz not null,expires_at timestamptz not null,ingested_at timestamptz not null default now());
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.emergency_data enable row level security;
alter table public.chat_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_receipts enable row level security;
alter table public.sos_records enable row level security;
alter table public.hazard_reports enable row level security;
alter table public.bands enable row level security;
alter table public.orders enable row level security;
alter table public.weather_alerts enable row level security;
-- Explicit grants prevent clients writing server-owned payment, role, or verification fields.
revoke all on public.profiles,public.user_roles,public.emergency_data,public.chat_groups,public.group_members,public.messages,public.message_receipts,public.sos_records,public.hazard_reports,public.bands,public.orders,public.weather_alerts from anon,authenticated;
grant select,insert,update on public.profiles,public.emergency_data to authenticated;
grant select on public.chat_groups,public.group_members,public.messages,public.message_receipts,public.sos_records,public.hazard_reports,public.orders,public.weather_alerts to authenticated;
grant select(id,user_id,activated_at,created_at) on public.bands to authenticated;
grant insert(id,user_id,recipient_id,group_id,body) on public.messages to authenticated;
grant insert(message_id,user_id),update(message_id,user_id) on public.message_receipts to authenticated;
grant insert(id,user_id,recipient_id,category,notes,latitude,longitude) on public.sos_records to authenticated;
grant insert(id,user_id,kind,description,latitude,longitude,severity) on public.hazard_reports to authenticated;
create policy profile_owner on public.profiles for all to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy emergency_owner on public.emergency_data for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy group_read on public.chat_groups for select to authenticated using(public.is_group_member(id));
create policy members_read on public.group_members for select to authenticated using(public.is_group_member(group_id));
create policy message_read on public.messages for select to authenticated using(user_id=auth.uid() or recipient_id=auth.uid() or public.is_group_member(group_id));
create policy message_insert on public.messages for insert to authenticated with check(user_id=auth.uid() and (group_id is null or public.is_group_member(group_id)));
create policy receipt_read on public.message_receipts for select to authenticated using(exists(select 1 from public.messages m where m.id=message_id));
create policy receipt_insert on public.message_receipts for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.messages m where m.id=message_id and m.user_id<>auth.uid() and (m.recipient_id=auth.uid() or public.is_group_member(m.group_id))));
create policy receipt_update on public.message_receipts for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and exists(select 1 from public.messages m where m.id=message_id and m.user_id<>auth.uid() and (m.recipient_id=auth.uid() or public.is_group_member(m.group_id))));
create policy sos_read on public.sos_records for select to authenticated using(user_id=auth.uid() or recipient_id=auth.uid());
create policy sos_insert on public.sos_records for insert to authenticated with check(user_id=auth.uid());
create policy hazards_read on public.hazard_reports for select to authenticated using(not hidden or user_id=auth.uid());
create policy hazards_insert on public.hazard_reports for insert to authenticated with check(user_id=auth.uid());
create policy bands_owner on public.bands for select to authenticated using(user_id=auth.uid());
create policy orders_owner on public.orders for select to authenticated using(user_id=auth.uid());
create policy alerts_read on public.weather_alerts for select to authenticated using(true);
create function public.create_chat_group(group_name text,member_ids uuid[]) returns uuid language plpgsql security definer set search_path=public as $$
declare g uuid;
begin
 if auth.uid() is null or length(group_name) not between 1 and 100 or coalesce(array_length(member_ids,1),0) not between 1 and 30 then raise exception 'Invalid group'; end if;
 insert into chat_groups(name,owner_id) values(group_name,auth.uid()) returning id into g;
 insert into group_members(group_id,user_id) select g,unnest(array_append(member_ids,auth.uid())) on conflict do nothing;
 return g;
end; $$;
revoke all on function public.create_chat_group(text,uuid[]) from public;
grant execute on function public.create_chat_group(text,uuid[]) to authenticated;
revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;
create index messages_recipient on public.messages(recipient_id,created_at);
create index messages_group on public.messages(group_id,created_at);
create index sos_owner on public.sos_records(user_id,created_at);
create index hazard_recent on public.hazard_reports(created_at desc);
-- Grant admin only through trusted SQL, never user-editable metadata:
-- insert into public.user_roles(user_id,role) values ('YOUR_AUTH_USER_UUID','admin');

-- Existing projects created before alt_contact: safe to re-run.
alter table public.emergency_data add column if not exists alt_contact text not null default '';
alter table public.emergency_data add column if not exists phone text not null default '';
