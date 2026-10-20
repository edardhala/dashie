-- Dashie database schema.
-- Paste into Supabase → SQL Editor → New query → Run.
-- Safe to re-run: it only creates what's missing and recreates the policies.

-- ─── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.rides (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users on delete cascade,
  description  text not null check (char_length(description) between 1 and 200),
  direction    text not null default 'Madrid → Segovia'
                 check (direction in ('Madrid → Segovia', 'Segovia → Madrid')),
  seats        int  not null default 1 check (seats between 1 and 8),
  departure_at timestamptz null,
  created_at   timestamptz not null default now()
);

create table if not exists public.seat_requests (
  id              uuid primary key default gen_random_uuid(),
  ride_id         uuid not null references public.rides on delete cascade,
  requester_id    uuid not null default auth.uid() references auth.users on delete cascade,
  requester_email text not null default (auth.jwt() ->> 'email'),
  status          text not null default 'pending'
                    check (status in ('pending', 'accepted', 'declined')),
  created_at      timestamptz not null default now(),
  unique (ride_id, requester_id)
);

-- Upgrade for databases created before Accept/Decline existed.
alter table public.seat_requests
  add column if not exists status text not null default 'pending';
alter table public.seat_requests drop constraint if exists seat_requests_status_check;
alter table public.seat_requests add constraint seat_requests_status_check
  check (status in ('pending', 'accepted', 'declined'));

create index if not exists rides_created_at_idx on public.rides (created_at desc);
create index if not exists seat_requests_ride_id_idx on public.seat_requests (ride_id);

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table public.rides enable row level security;
alter table public.seat_requests enable row level security;

-- Logged-out visitors (anon) get nothing at all.
revoke all on public.rides from anon;
revoke all on public.seat_requests from anon;

-- Logged-in users only get the operations the app uses.
revoke all on public.rides from authenticated;
revoke all on public.seat_requests from authenticated;
grant select, insert, update, delete on public.rides to authenticated;
grant select, insert, delete on public.seat_requests to authenticated;
-- The only column anyone can ever change on a request is its status.
grant update (status) on public.seat_requests to authenticated;

-- rides: every logged-in user can read every ride.
drop policy if exists "rides: logged-in users can read" on public.rides;
create policy "rides: logged-in users can read"
  on public.rides for select to authenticated
  using (auth.uid() is not null);

-- rides: you can only create rides as yourself.
drop policy if exists "rides: insert own" on public.rides;
create policy "rides: insert own"
  on public.rides for insert to authenticated
  with check (user_id = auth.uid());

-- rides: only the author can edit, and can't hand the ride to someone else.
drop policy if exists "rides: update own" on public.rides;
create policy "rides: update own"
  on public.rides for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- rides: only the author can delete.
drop policy if exists "rides: delete own" on public.rides;
create policy "rides: delete own"
  on public.rides for delete to authenticated
  using (user_id = auth.uid());

-- seat_requests: request as yourself, with your real email, never on your own ride.
drop policy if exists "seat_requests: insert own" on public.seat_requests;
create policy "seat_requests: insert own"
  on public.seat_requests for insert to authenticated
  with check (
    requester_id = auth.uid()
    and requester_email = (auth.jwt() ->> 'email')
    and status = 'pending'
    and not exists (
      select 1 from public.rides r
      where r.id = seat_requests.ride_id
        and r.user_id = auth.uid()
    )
  );

-- seat_requests: visible only to the requester and to the ride's author.
drop policy if exists "seat_requests: requester or ride owner can read" on public.seat_requests;
create policy "seat_requests: requester or ride owner can read"
  on public.seat_requests for select to authenticated
  using (
    requester_id = auth.uid()
    or exists (
      select 1 from public.rides r
      where r.id = seat_requests.ride_id
        and r.user_id = auth.uid()
    )
  );

-- seat_requests: only the requester can cancel their request.
drop policy if exists "seat_requests: requester can delete" on public.seat_requests;
create policy "seat_requests: requester can delete"
  on public.seat_requests for delete to authenticated
  using (requester_id = auth.uid());

-- seat_requests: only the ride's author can accept or decline.
drop policy if exists "seat_requests: ride owner can accept or decline" on public.seat_requests;
create policy "seat_requests: ride owner can accept or decline"
  on public.seat_requests for update to authenticated
  using (
    exists (
      select 1 from public.rides r
      where r.id = seat_requests.ride_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.rides r
      where r.id = seat_requests.ride_id
        and r.user_id = auth.uid()
    )
  );

-- Never accept more people than the seats offered. This lives in a trigger,
-- not the policy, because a policy can't query its own table (infinite recursion).
create or replace function public.enforce_seat_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    if (
      select count(*) from public.seat_requests s
      where s.ride_id = new.ride_id
        and s.status = 'accepted'
        and s.id <> new.id
    ) >= (
      select r.seats from public.rides r where r.id = new.ride_id
    ) then
      raise exception 'This ride is full. Decline someone to free a seat.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists seat_requests_seat_limit on public.seat_requests;
create trigger seat_requests_seat_limit
  before update on public.seat_requests
  for each row execute function public.enforce_seat_limit();
