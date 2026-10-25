-- Uni Carpool – Member 2 Driver feature backend contract
-- Run this in the Supabase SQL Editor if the shared schema is not in place yet.
-- Do not use the service-role key in the mobile app. RLS + these RPCs enforce authorization.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone_number text,
  profile_image_url text,
  average_rating numeric,
  rating_count integer not null default 0
);

create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles (id) on delete cascade,
  pickup_point text not null,
  dropoff_point text not null,
  departure_time timestamptz not null,
  total_seats integer not null,
  available_seats integer not null,
  fare numeric not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rides_status_check check (status in ('active', 'completed', 'canceled')),
  constraint rides_seats_range check (total_seats between 1 and 6),
  constraint rides_available_range check (available_seats >= 0 and available_seats <= total_seats),
  constraint rides_fare_positive check (fare > 0),
  constraint rides_points_distinct check (lower(btrim(pickup_point)) <> lower(btrim(dropoff_point)))
);

create table if not exists public.ride_requests (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides (id) on delete cascade,
  rider_id uuid not null references public.profiles (id) on delete cascade,
  requested_seats integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ride_requests_status_check check (status in ('pending', 'accepted', 'rejected', 'canceled')),
  constraint ride_requests_seats_range check (requested_seats between 1 and 6)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  type text not null,
  ride_id uuid references public.rides (id) on delete set null,
  request_id uuid references public.ride_requests (id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists ride_requests_unique_open
  on public.ride_requests (ride_id, rider_id)
  where status in ('pending', 'accepted');

create index if not exists rides_driver_id_idx on public.rides (driver_id);
create index if not exists rides_departure_time_idx on public.rides (departure_time);
create index if not exists ride_requests_ride_id_idx on public.ride_requests (ride_id);
create index if not exists notifications_user_id_idx on public.notifications (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rides_set_updated_at on public.rides;
create trigger rides_set_updated_at
before update on public.rides
for each row execute function public.set_updated_at();

drop trigger if exists ride_requests_set_updated_at on public.ride_requests;
create trigger ride_requests_set_updated_at
before update on public.ride_requests
for each row execute function public.set_updated_at();

create or replace function public.accepted_seats_for_ride(p_ride_id uuid)
returns integer
language sql
stable
as $$
  select coalesce(sum(requested_seats), 0)::integer
  from public.ride_requests
  where ride_id = p_ride_id
    and status = 'accepted';
$$;

create or replace function public.enforce_ride_seat_invariant()
returns trigger
language plpgsql
as $$
declare
  v_accepted integer;
begin
  if new.status in ('canceled', 'completed') then
    return new;
  end if;

  v_accepted := public.accepted_seats_for_ride(new.id);

  if new.total_seats < v_accepted then
    raise exception 'Total seats cannot be below accepted bookings';
  end if;

  if new.available_seats <> new.total_seats - v_accepted then
    raise exception 'available_seats must equal total_seats minus accepted seats';
  end if;

  return new;
end;
$$;

drop trigger if exists rides_seat_invariant on public.rides;
create trigger rides_seat_invariant
before insert or update of total_seats, available_seats, status
on public.rides
for each row execute function public.enforce_ride_seat_invariant();

create or replace function public.enforce_future_departure_on_create()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.status = 'active' and new.departure_time <= now() then
    raise exception 'Departure must be in the future';
  end if;
  return new;
end;
$$;

drop trigger if exists rides_future_departure on public.rides;
create trigger rides_future_departure
before insert on public.rides
for each row execute function public.enforce_future_departure_on_create();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.notify_rider(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_type text,
  p_ride_id uuid,
  p_request_id uuid
)
returns void
language plpgsql
as $$
begin
  insert into public.notifications (user_id, title, body, type, ride_id, request_id)
  values (p_user_id, p_title, p_body, p_type, p_ride_id, p_request_id);
exception
  when undefined_table then
    null;
end;
$$;

create or replace function public.accept_ride_request(p_request_id uuid)
returns public.ride_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.ride_requests;
  v_ride public.rides;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  select * into v_ride
  from public.rides
  where id = v_request.ride_id
  for update;

  if not found then
    raise exception 'Ride not found';
  end if;

  if v_ride.driver_id <> v_user_id then
    raise exception 'Not authorized';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request is not pending';
  end if;

  if v_ride.status <> 'active' then
    raise exception 'Ride is not active';
  end if;

  if v_ride.departure_time <= now() then
    raise exception 'Ride has already departed';
  end if;

  if v_ride.available_seats < v_request.requested_seats then
    raise exception 'Not enough seats';
  end if;

  update public.ride_requests
  set status = 'accepted'
  where id = p_request_id
  returning * into v_request;

  update public.rides
  set available_seats = available_seats - v_request.requested_seats
  where id = v_ride.id;

  perform public.notify_rider(
    v_request.rider_id,
    'Ride request accepted',
    'Your request was accepted. See you on the ride!',
    'ride_request_accepted',
    v_ride.id,
    v_request.id
  );

  return v_request;
end;
$$;

create or replace function public.reject_ride_request(p_request_id uuid)
returns public.ride_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_request public.ride_requests;
  v_ride public.rides;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_request
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  select * into v_ride
  from public.rides
  where id = v_request.ride_id
  for update;

  if not found then
    raise exception 'Ride not found';
  end if;

  if v_ride.driver_id <> v_user_id then
    raise exception 'Not authorized';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Request is not pending';
  end if;

  update public.ride_requests
  set status = 'rejected'
  where id = p_request_id
  returning * into v_request;

  perform public.notify_rider(
    v_request.rider_id,
    'Ride request declined',
    'The driver declined your ride request.',
    'ride_request_rejected',
    v_ride.id,
    v_request.id
  );

  return v_request;
end;
$$;

create or replace function public.update_driver_ride(
  p_ride_id uuid,
  p_pickup_point text,
  p_dropoff_point text,
  p_departure_time timestamptz,
  p_total_seats integer,
  p_fare numeric
)
returns public.rides
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_ride public.rides;
  v_accepted integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_ride
  from public.rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception 'Ride not found';
  end if;

  if v_ride.driver_id <> v_user_id then
    raise exception 'Not authorized';
  end if;

  if v_ride.status <> 'active' then
    raise exception 'Only active rides can be edited';
  end if;

  if v_ride.departure_time <= now() then
    raise exception 'Past rides cannot be edited';
  end if;

  if p_departure_time <= now() then
    raise exception 'Departure must be in the future';
  end if;

  if btrim(p_pickup_point) = '' or btrim(p_dropoff_point) = '' then
    raise exception 'Pickup and drop-off are required';
  end if;

  if lower(btrim(p_pickup_point)) = lower(btrim(p_dropoff_point)) then
    raise exception 'Pickup and destination cannot be identical';
  end if;

  if p_total_seats < 1 or p_total_seats > 6 then
    raise exception 'Seats must be between 1 and 6';
  end if;

  if p_fare <= 0 then
    raise exception 'Fare must be a positive number';
  end if;

  v_accepted := public.accepted_seats_for_ride(p_ride_id);

  if p_total_seats < v_accepted then
    raise exception 'Total capacity cannot be reduced below accepted bookings';
  end if;

  update public.rides
  set
    pickup_point = btrim(p_pickup_point),
    dropoff_point = btrim(p_dropoff_point),
    departure_time = p_departure_time,
    total_seats = p_total_seats,
    available_seats = p_total_seats - v_accepted,
    fare = p_fare
  where id = p_ride_id
  returning * into v_ride;

  return v_ride;
end;
$$;

create or replace function public.cancel_driver_ride(p_ride_id uuid)
returns public.rides
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_ride public.rides;
  v_request public.ride_requests;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_ride
  from public.rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception 'Ride not found';
  end if;

  if v_ride.driver_id <> v_user_id then
    raise exception 'Not authorized';
  end if;

  if v_ride.status <> 'active' then
    raise exception 'Only active rides can be canceled';
  end if;

  update public.rides
  set status = 'canceled'
  where id = p_ride_id
  returning * into v_ride;

  for v_request in
    select *
    from public.ride_requests
    where ride_id = p_ride_id
      and status in ('pending', 'accepted')
    for update
  loop
    update public.ride_requests
    set status = 'canceled'
    where id = v_request.id;

    perform public.notify_rider(
      v_request.rider_id,
      'Ride canceled',
      'A ride you requested was canceled by the driver.',
      'ride_canceled',
      p_ride_id,
      v_request.id
    );
  end loop;

  return v_ride;
end;
$$;

alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Authenticated users can view profiles" on public.profiles;
create policy "Authenticated users can view profiles"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "Authenticated users can view rides" on public.rides;
create policy "Authenticated users can view rides"
  on public.rides for select
  to authenticated
  using (true);

drop policy if exists "Drivers can create their own rides" on public.rides;
create policy "Drivers can create their own rides"
  on public.rides for insert
  to authenticated
  with check (driver_id = auth.uid());

drop policy if exists "Drivers can update their own rides" on public.rides;
create policy "Drivers can update their own rides"
  on public.rides for update
  to authenticated
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

drop policy if exists "Users can view relevant ride requests" on public.ride_requests;
create policy "Users can view relevant ride requests"
  on public.ride_requests for select
  to authenticated
  using (
    rider_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.id = ride_id and r.driver_id = auth.uid()
    )
  );

drop policy if exists "Riders can create their own requests" on public.ride_requests;
create policy "Riders can create their own requests"
  on public.ride_requests for insert
  to authenticated
  with check (rider_id = auth.uid());

drop policy if exists "Riders can update their own requests" on public.ride_requests;
create policy "Riders can update their own requests"
  on public.ride_requests for update
  to authenticated
  using (rider_id = auth.uid())
  with check (rider_id = auth.uid());

drop policy if exists "Users can view their notifications" on public.notifications;
create policy "Users can view their notifications"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update their notifications" on public.notifications;
create policy "Users can update their notifications"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.rides to authenticated;
grant select, insert, update on public.ride_requests to authenticated;
grant select, update on public.notifications to authenticated;

grant execute on function public.accept_ride_request(uuid) to authenticated;
grant execute on function public.reject_ride_request(uuid) to authenticated;
grant execute on function public.update_driver_ride(uuid, text, text, timestamptz, integer, numeric) to authenticated;
grant execute on function public.cancel_driver_ride(uuid) to authenticated;
grant execute on function public.accepted_seats_for_ride(uuid) to authenticated;
