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
  created_at      timestamptz not null default now(),
  unique (ride_id, requester_id)
);

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
