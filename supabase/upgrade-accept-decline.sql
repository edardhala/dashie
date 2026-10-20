alter table public.seat_requests
  add column if not exists status text not null default 'pending';
alter table public.seat_requests drop constraint if exists seat_requests_status_check;
alter table public.seat_requests add constraint seat_requests_status_check
  check (status in ('pending', 'accepted', 'declined'));

grant update (status) on public.seat_requests to authenticated;

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
