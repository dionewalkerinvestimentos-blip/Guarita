-- SUPABASE_SCHEMA_COMPLETO.sql
-- Projeto alvo: https://supabase.com/dashboard/project/angdyppdbwwytjvczyuo
-- Execute no Supabase Dashboard > SQL Editor > New query.
-- Script idempotente para criar/ajustar a base usada pela aplicacao Guarita.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  username varchar(100) unique not null,
  email varchar(255) unique not null,
  password_hash text,
  full_name varchar(255),
  role varchar(50) default 'user',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.producers (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null,
  code varchar(50) unique,
  description text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into public.producers (name, code) values
  ('SANTA LUZIA', 'SL'),
  ('SAO JOSE', 'SJ'),
  ('PLANTA', 'PL'),
  ('CARAJAS', 'CR'),
  ('VENTANIA', 'VT'),
  ('SIMARELLI', 'SM'),
  ('MAMOSE', 'MM'),
  ('JUCARA', 'JC')
on conflict (code) do nothing;

create table if not exists public.vehicles (
  id uuid primary key default uuid_generate_v4(),
  type varchar(50) not null,
  date date not null,
  entry_time time,
  exit_time time,
  exit_date date,
  plate varchar(20) not null,
  driver varchar(255) not null,
  vehicle_type varchar(100) not null,
  company varchar(255),
  purpose text,
  producer_id uuid references public.producers(id),
  producer_name varchar(255),
  observations text,
  internal_time_minutes integer,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.vehicles add column if not exists exit_date date;
alter table public.vehicles add column if not exists company varchar(255);
alter table public.vehicles alter column entry_time drop not null;

create table if not exists public.equipment (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  photo_url text,
  name varchar(255) not null,
  type varchar(100) not null,
  destination varchar(255) not null,
  purpose varchar(255) not null,
  donation_to varchar(255),
  authorized_by varchar(255) not null,
  withdrawn_by varchar(255) not null,
  status varchar(50) default 'pending',
  return_date date,
  return_notes text,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cotton_pull (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  entry_time time not null,
  exit_time time,
  producer varchar(255) not null,
  farm varchar(255) not null,
  talhao varchar(100),
  plate varchar(20) not null,
  driver varchar(255) not null,
  rolls integer not null,
  observations text,
  parada_puxe boolean default false,
  hora_parada_puxe time,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.cotton_pull add column if not exists talhao varchar(100);
alter table public.cotton_pull add column if not exists parada_puxe boolean default false;
alter table public.cotton_pull add column if not exists hora_parada_puxe time;

create table if not exists public.rain_records (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  time time,
  start_time time,
  end_time time,
  millimeters decimal(5,2) not null,
  location varchar(255) default 'Principal',
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.rain_records alter column time drop not null;
alter table public.rain_records add column if not exists start_time time;
alter table public.rain_records add column if not exists end_time time;

create table if not exists public.saved_values (
  id uuid primary key default uuid_generate_v4(),
  category varchar(50) not null,
  value varchar(255) not null,
  is_active boolean default true,
  usage_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.loading_records (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  time time not null,
  product varchar(100) not null,
  harvest_year varchar(10) default '2024/2025',
  truck_type varchar(50) not null,
  is_sider boolean default false,
  carrier varchar(255) not null,
  destination varchar(255),
  client varchar(255),
  invoice_number varchar(255),
  status varchar(50) default 'fila',
  plate varchar(20) not null,
  driver varchar(255) not null,
  entry_date date,
  entry_time time,
  exit_date date,
  exit_time time,
  bales integer default 0,
  weight decimal(10,2) default 0,
  notes text,
  acompanhante boolean default false,
  loaded_at timestamptz,
  created_by varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.loading_records add column if not exists harvest_year varchar(10) default '2024/2025';
alter table public.loading_records add column if not exists client varchar(255);
alter table public.loading_records add column if not exists invoice_number varchar(255);
alter table public.loading_records add column if not exists status varchar(50) default 'fila';
alter table public.loading_records add column if not exists entry_date date;
alter table public.loading_records add column if not exists exit_date date;
alter table public.loading_records add column if not exists acompanhante boolean default false;
alter table public.loading_records add column if not exists loaded_at timestamptz;

create table if not exists public.material_receipts (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  entry_time time not null default current_time,
  exit_time time,
  exit_date date,
  material_type varchar(50) not null,
  plate varchar(20) not null,
  driver varchar(255) not null,
  supplier varchar(255),
  net_weight decimal(10,3) not null,
  volume_m3 decimal(10,3),
  volume_m2 decimal(10,3),
  volume_liters decimal(10,3),
  unit_type varchar(10) not null default 'KG',
  observations text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references public.users(id)
);

alter table public.material_receipts add column if not exists exit_date date;
alter table public.material_receipts add column if not exists supplier varchar(255);
alter table public.material_receipts drop constraint if exists material_receipts_unit_type_check;
alter table public.material_receipts add constraint material_receipts_unit_type_check
  check (unit_type in ('KG','M3','M2','LITROS','UN'));

create table if not exists public.rain_alert (
  id uuid primary key default uuid_generate_v4(),
  is_raining boolean not null default false,
  started_at timestamptz,
  stopped_at timestamptz,
  updated_at timestamptz default now(),
  updated_by text,
  created_at timestamptz default now()
);

insert into public.rain_alert (id, is_raining, updated_at)
values ('00000000-0000-0000-0000-000000000001', false, now())
on conflict (id) do nothing;

create table if not exists public.puxe_viagens (
  id uuid primary key default gen_random_uuid(),
  placa text not null,
  motorista text not null,
  fazenda_origem text not null,
  data date not null,
  hora_chegada timestamp not null,
  hora_saida timestamp,
  tempo_unidade_min numeric,
  tempo_lavoura_min numeric,
  total_viagem_min numeric,
  observacao text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists public.loading_history (
  id uuid primary key default uuid_generate_v4(),
  original_id uuid not null unique,
  date date not null,
  time_value text not null,
  entry_date date,
  entry_time text,
  exit_date date,
  exit_time text,
  product text not null,
  harvest_year text not null,
  truck_type text not null,
  plate text not null,
  driver text not null,
  carrier text not null,
  destination text,
  client text,
  invoice_number text,
  bales integer,
  weight numeric,
  is_sider boolean default false,
  status text,
  observations text,
  created_by text,
  created_at timestamptz default now(),
  completed_at timestamptz,
  updated_at timestamptz
);

create table if not exists public.aeration_events (
  id uuid primary key default gen_random_uuid(),
  barracao integer not null,
  motor_index integer not null,
  start_at timestamptz not null,
  end_at timestamptz,
  status text not null default 'off',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_state (
  key text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

insert into public.app_state (key, value)
values ('guards_on_duty', '[]'::jsonb)
on conflict (key) do nothing;

create or replace function public.authenticate_user(input_username text, input_password text)
returns table (
  id uuid,
  username varchar,
  email varchar,
  full_name varchar,
  role varchar,
  is_active boolean
)
language plpgsql
security definer
as $$
begin
  return query
  select u.id, u.username, u.email, u.full_name, u.role, u.is_active
  from public.users u
  where u.username = input_username
    and u.password_hash = crypt(input_password, u.password_hash)
    and u.is_active = true;
end;
$$;

insert into public.users (username, email, password_hash, full_name, role, is_active)
values ('guarita', 'guarita@iba.com', crypt('Senha@2026', gen_salt('bf')), 'Guarita', 'user', true)
on conflict (username) do update set
  email = excluded.email,
  password_hash = excluded.password_hash,
  full_name = excluded.full_name,
  role = excluded.role,
  is_active = excluded.is_active,
  updated_at = now();

create or replace function public.calcular_tempos_viagem()
returns trigger as $$
begin
  if new.hora_saida is not null then
    new.tempo_unidade_min := extract(epoch from (new.hora_saida - new.hora_chegada)) / 60;
  end if;

  update public.puxe_viagens
  set tempo_lavoura_min = extract(epoch from (new.hora_chegada - hora_saida)) / 60,
      total_viagem_min = tempo_unidade_min + extract(epoch from (new.hora_chegada - hora_saida)) / 60
  where placa = new.placa
    and hora_saida is not null
    and hora_chegada < new.hora_chegada
    and id = (
      select id from public.puxe_viagens
      where placa = new.placa
        and hora_saida < new.hora_chegada
      order by hora_saida desc
      limit 1
    );

  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create or replace function public.preserve_loaded_at()
returns trigger as $$
begin
  if old.loaded_at is not null then
    new.loaded_at := old.loaded_at;
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function public.archive_completed_loadings()
returns void
language plpgsql
as $$
begin
  insert into public.loading_history (
    original_id, date, time_value, entry_date, entry_time, exit_date, exit_time,
    product, harvest_year, truck_type, plate, driver, carrier,
    destination, client, invoice_number, bales, weight, is_sider,
    status, observations, created_by, created_at, completed_at, updated_at
  )
  select
    id, date, "time"::text, entry_date, entry_time::text, exit_date, exit_time::text,
    product, harvest_year, truck_type, plate, driver, carrier,
    destination, client, invoice_number, bales, weight, is_sider,
    status, notes, created_by, created_at, now(), updated_at
  from public.loading_records
  where status = 'concluido'
    and exit_date is not null
  on conflict (original_id) do nothing;

  delete from public.loading_records
  where status = 'concluido'
    and exit_date is not null;
end;
$$;

create or replace function public.get_loading_history(
  start_date date default null,
  end_date date default null,
  plate_filter text default null
)
returns table (
  id uuid,
  date date,
  time_value text,
  entry_date date,
  entry_time text,
  exit_date date,
  exit_time text,
  product text,
  harvest_year text,
  truck_type text,
  plate text,
  driver text,
  carrier text,
  destination text,
  client text,
  invoice_number text,
  bales integer,
  weight numeric,
  is_sider boolean,
  status text,
  completed_at timestamptz
)
language plpgsql
as $$
begin
  return query
  select
    h.id, h.date, h.time_value, h.entry_date, h.entry_time, h.exit_date, h.exit_time,
    h.product, h.harvest_year, h.truck_type, h.plate, h.driver, h.carrier,
    h.destination, h.client, h.invoice_number, h.bales, h.weight, h.is_sider,
    h.status, h.completed_at
  from public.loading_history h
  where (start_date is null or h.date >= start_date)
    and (end_date is null or h.date <= end_date)
    and (plate_filter is null or h.plate ilike '%' || plate_filter || '%')
  order by h.completed_at desc, h.date desc, h.time_value desc;
end;
$$;

drop trigger if exists update_users_updated_at on public.users;
create trigger update_users_updated_at before update on public.users for each row execute function public.update_updated_at_column();
drop trigger if exists update_producers_updated_at on public.producers;
create trigger update_producers_updated_at before update on public.producers for each row execute function public.update_updated_at_column();
drop trigger if exists update_vehicles_updated_at on public.vehicles;
create trigger update_vehicles_updated_at before update on public.vehicles for each row execute function public.update_updated_at_column();
drop trigger if exists update_equipment_updated_at on public.equipment;
create trigger update_equipment_updated_at before update on public.equipment for each row execute function public.update_updated_at_column();
drop trigger if exists update_cotton_pull_updated_at on public.cotton_pull;
create trigger update_cotton_pull_updated_at before update on public.cotton_pull for each row execute function public.update_updated_at_column();
drop trigger if exists update_rain_records_updated_at on public.rain_records;
create trigger update_rain_records_updated_at before update on public.rain_records for each row execute function public.update_updated_at_column();
drop trigger if exists update_saved_values_updated_at on public.saved_values;
create trigger update_saved_values_updated_at before update on public.saved_values for each row execute function public.update_updated_at_column();
drop trigger if exists update_loading_records_updated_at on public.loading_records;
create trigger update_loading_records_updated_at before update on public.loading_records for each row execute function public.update_updated_at_column();
drop trigger if exists update_material_receipts_updated_at on public.material_receipts;
create trigger update_material_receipts_updated_at before update on public.material_receipts for each row execute function public.update_updated_at_column();
drop trigger if exists trigger_calcular_tempos on public.puxe_viagens;
create trigger trigger_calcular_tempos before insert or update on public.puxe_viagens for each row execute function public.calcular_tempos_viagem();
drop trigger if exists preserve_loaded_at_trigger on public.loading_records;
create trigger preserve_loaded_at_trigger before update on public.loading_records for each row execute function public.preserve_loaded_at();

create index if not exists idx_vehicles_date on public.vehicles(date);
create index if not exists idx_vehicles_plate on public.vehicles(plate);
create index if not exists idx_vehicles_exit_date on public.vehicles(exit_date);
create index if not exists idx_equipment_date on public.equipment(date);
create index if not exists idx_equipment_status on public.equipment(status);
create index if not exists idx_cotton_pull_date on public.cotton_pull(date);
create index if not exists idx_cotton_pull_plate on public.cotton_pull(plate);
create index if not exists idx_rain_records_date on public.rain_records(date);
create index if not exists idx_saved_values_category on public.saved_values(category);
create unique index if not exists idx_saved_values_category_value on public.saved_values(category, value);
create index if not exists idx_loading_records_date on public.loading_records(date);
create index if not exists idx_loading_records_status on public.loading_records(status);
create index if not exists idx_loading_records_plate on public.loading_records(plate);
create index if not exists idx_material_receipts_date on public.material_receipts(date);
create index if not exists idx_material_receipts_plate on public.material_receipts(plate);
create index if not exists idx_rain_alert_updated on public.rain_alert(updated_at desc);
create index if not exists idx_puxe_viagens_placa on public.puxe_viagens(placa);
create index if not exists idx_puxe_viagens_data on public.puxe_viagens(data);
create index if not exists idx_puxe_viagens_motorista on public.puxe_viagens(motorista);
create index if not exists idx_loading_history_date on public.loading_history(date);
create index if not exists idx_loading_history_plate on public.loading_history(plate);
create index if not exists idx_aeration_barracao on public.aeration_events(barracao);
create index if not exists idx_aeration_motor on public.aeration_events(motor_index);

create or replace view public.view_relatorio_puxe as
select
  pv.id,
  pv.placa,
  pv.motorista,
  pv.fazenda_origem as fazenda,
  pv.data,
  pv.hora_chegada,
  pv.hora_saida,
  pv.tempo_unidade_min,
  pv.tempo_lavoura_min,
  pv.total_viagem_min,
  pv.observacao,
  date_trunc('day', pv.hora_chegada) as dia,
  date_trunc('month', pv.hora_chegada) as mes,
  date_trunc('year', pv.hora_chegada) as ano
from public.puxe_viagens pv
where pv.hora_chegada is not null;

create or replace view public.view_gestao_tempo as
with viagens_hoje as (
  select id, plate, date, entry_time, exit_time, created_at,
    row_number() over (partition by plate, date order by entry_time) as viagem_num,
    count(*) over (partition by plate, date) as total_viagens_dia
  from public.cotton_pull
  where date = current_date and entry_time is not null
),
tempos_algodoeira as (
  select plate, date, entry_time, exit_time, viagem_num, total_viagens_dia,
    case when entry_time is not null and exit_time is not null then
      extract(epoch from ((date || ' ' || exit_time)::timestamp - (date || ' ' || entry_time)::timestamp)) / 60
    else null end as tempo_algodoeira_min
  from viagens_hoje
  where viagem_num > 1 and viagem_num < total_viagens_dia
),
viagens_sequenciais as (
  select plate, date as data_entrada, entry_time, exit_time, tempo_algodoeira_min,
    lag(date) over (partition by plate order by date, entry_time) as data_saida_anterior,
    lag(exit_time) over (partition by plate order by date, entry_time) as exit_time_anterior
  from tempos_algodoeira
  where tempo_algodoeira_min is not null and tempo_algodoeira_min > 0 and tempo_algodoeira_min < 300
),
tempos_lavoura as (
  select plate, tempo_algodoeira_min,
    case when data_saida_anterior is not null and exit_time_anterior is not null then
      extract(epoch from ((data_entrada || ' ' || entry_time)::timestamp - (data_saida_anterior || ' ' || exit_time_anterior)::timestamp)) / 60
    else null end as tempo_lavoura_min
  from viagens_sequenciais
)
select
  coalesce(round(avg(tempo_algodoeira_min)::numeric, 0), 0) as tempo_algodoeira,
  coalesce(round(avg(case when tempo_lavoura_min is not null and tempo_lavoura_min > 0 and tempo_lavoura_min < 300 then tempo_lavoura_min end)::numeric, 0), 0) as tempo_lavoura
from tempos_lavoura
where tempo_algodoeira_min > 0;

create or replace view public.view_gestao_tempo_cargas as
with viagens_dia as (
  select
    id, plate, driver, date, entry_time,
    cast(case when parada_puxe = true and hora_parada_puxe is not null then hora_parada_puxe else exit_time::time end as varchar) as exit_time,
    rolls, talhao, parada_puxe, hora_parada_puxe, created_at,
    case
      when entry_time is not null and parada_puxe = true and hora_parada_puxe is not null then
        extract(epoch from ((date || ' ' || cast(hora_parada_puxe as varchar))::timestamp - (date || ' ' || entry_time)::timestamp)) / 60
      when entry_time is not null and exit_time is not null then
        extract(epoch from ((date || ' ' || exit_time)::timestamp - (date || ' ' || entry_time)::timestamp)) / 60
      else null
    end as tempo_algodoeira,
    row_number() over (partition by plate, date order by entry_time) as viagem_num,
    count(*) over (partition by plate, date) as total_viagens_dia
  from public.cotton_pull
  where date = current_date
    and entry_time is not null
    and (exit_time is not null or (parada_puxe = true and hora_parada_puxe is not null))
),
viagens_com_tempo_lavoura as (
  select
    v1.*,
    lag(v1.exit_time) over (partition by v1.plate, v1.date order by v1.entry_time) as exit_time_anterior,
    case when lag(v1.exit_time) over (partition by v1.plate, v1.date order by v1.entry_time) is not null then
      extract(epoch from ((v1.date || ' ' || v1.entry_time)::timestamp - (v1.date || ' ' || lag(v1.exit_time) over (partition by v1.plate, v1.date order by v1.entry_time))::timestamp)) / 60
    else null end as tempo_lavoura
  from viagens_dia v1
)
select
  plate as placa,
  driver as motorista,
  talhao,
  viagem_num,
  rolls as qtd_rolos,
  parada_puxe,
  round(tempo_lavoura::numeric, 0) as tempo_lavoura,
  round(tempo_algodoeira::numeric, 0) as tempo_algodoeira,
  case
    when tempo_lavoura is not null then round((tempo_lavoura + tempo_algodoeira)::numeric, 0)
    when tempo_algodoeira is not null then round(tempo_algodoeira::numeric, 0)
    else null
  end as tempo_total,
  entry_time as hora_entrada,
  exit_time as hora_saida
from viagens_com_tempo_lavoura
where tempo_algodoeira is not null
order by plate, viagem_num;

create or replace view public.view_ranking_puxe as
with viagens_por_dia as (
  select
    plate, driver, date, entry_time, exit_time, rolls, talhao,
    row_number() over (partition by plate, date order by entry_time) as viagem_num,
    count(*) over (partition by plate, date) as total_viagens_dia,
    case when entry_time is not null and exit_time is not null then
      extract(epoch from ((date || ' ' || exit_time)::timestamp - (date || ' ' || entry_time)::timestamp)) / 60
    else null end as tempo_algodoeira
  from public.cotton_pull
  where entry_time is not null and exit_time is not null
),
viagens_com_tempo_lavoura as (
  select
    v1.*,
    case when lag(v1.exit_time) over (partition by v1.plate, v1.date order by v1.entry_time) is not null then
      extract(epoch from ((v1.date || ' ' || v1.entry_time)::timestamp - (v1.date || ' ' || lag(v1.exit_time) over (partition by v1.plate, v1.date order by v1.entry_time))::timestamp)) / 60
    else null end as tempo_lavoura
  from viagens_por_dia v1
),
viagens_validas as (
  select plate, driver, date, tempo_algodoeira, tempo_lavoura,
    tempo_algodoeira + coalesce(tempo_lavoura, 0) as tempo_total
  from viagens_com_tempo_lavoura
  where viagem_num > 1
    and viagem_num < total_viagens_dia
    and tempo_algodoeira is not null
    and tempo_algodoeira > 0
    and tempo_algodoeira < 300
    and (tempo_lavoura is null or (tempo_lavoura > 0 and tempo_lavoura < 300))
)
select
  driver as motorista,
  plate as placa,
  count(*) as viagens,
  round(avg(tempo_algodoeira)::numeric, 0) as media_algodoeira_min,
  round(avg(coalesce(tempo_lavoura, 0))::numeric, 0) as media_viagem_min,
  round(avg(tempo_total)::numeric, 0) as media_total_min,
  max(date) as ultima_viagem
from viagens_validas
group by driver, plate
having count(*) >= 3
order by viagens desc, media_total_min asc;

create or replace view public.all_loadings as
select
  id, date, "time"::text as time_value, entry_date, entry_time::text as entry_time,
  exit_date, exit_time::text as exit_time, product, harvest_year, truck_type,
  plate, driver, carrier, destination, client, invoice_number, bales, weight,
  is_sider, status, 'active' as source, created_at, updated_at
from public.loading_records
union all
select
  original_id as id, date, time_value, entry_date, entry_time, exit_date, exit_time,
  product, harvest_year, truck_type, plate, driver, carrier, destination, client,
  invoice_number, bales, weight, is_sider, status, 'history' as source, created_at, updated_at
from public.loading_history;

-- A aplicacao usa login local e chave anon, portanto RLS precisa permitir o uso direto.
alter table public.users disable row level security;
alter table public.producers disable row level security;
alter table public.vehicles disable row level security;
alter table public.equipment disable row level security;
alter table public.cotton_pull disable row level security;
alter table public.rain_records disable row level security;
alter table public.saved_values disable row level security;
alter table public.loading_records disable row level security;
alter table public.material_receipts disable row level security;
alter table public.rain_alert disable row level security;
alter table public.puxe_viagens disable row level security;
alter table public.loading_history disable row level security;
alter table public.aeration_events disable row level security;
alter table public.app_state disable row level security;

-- Bucket publico para fotos de equipamentos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'equipment-photos',
  'equipment-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "equipment photos public read" on storage.objects;
create policy "equipment photos public read"
on storage.objects for select
using (bucket_id = 'equipment-photos');

drop policy if exists "equipment photos public insert" on storage.objects;
create policy "equipment photos public insert"
on storage.objects for insert
with check (bucket_id = 'equipment-photos');

drop policy if exists "equipment photos public update" on storage.objects;
create policy "equipment photos public update"
on storage.objects for update
using (bucket_id = 'equipment-photos')
with check (bucket_id = 'equipment-photos');

drop policy if exists "equipment photos public delete" on storage.objects;
create policy "equipment photos public delete"
on storage.objects for delete
using (bucket_id = 'equipment-photos');

select 'Schema Guarita criado/atualizado com sucesso' as status;
