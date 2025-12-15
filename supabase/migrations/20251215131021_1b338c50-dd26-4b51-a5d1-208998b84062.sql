-- 1) Bucket voor sokken
insert into storage.buckets (id, name, public)
values ('socks', 'socks', true)
on conflict (id) do update set public = excluded.public;

-- 2) Public read
create policy "Public read socks"
on storage.objects
for select
to public
using (bucket_id = 'socks');

-- 3) Service role (edge functions) mag uploaden
create policy "Service role can upload socks"
on storage.objects
for insert
to service_role
with check (bucket_id = 'socks');

create policy "Service role can update socks"
on storage.objects
for update
to service_role
using (bucket_id = 'socks');

create policy "Service role can delete socks"
on storage.objects
for delete
to service_role
using (bucket_id = 'socks');