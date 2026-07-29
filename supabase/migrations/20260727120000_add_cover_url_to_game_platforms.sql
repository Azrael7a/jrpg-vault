alter table public.game_platforms
add column if not exists cover_url text;

comment on column public.game_platforms.cover_url is
  'URL Supabase Storage de la jaquette spécifique à cette combinaison jeu, plateforme et région.';

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'game-covers',
  'game-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can upload game covers" on storage.objects;
create policy "Admins can upload game covers"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'game-covers'
  and (select public.is_admin())
);

drop policy if exists "Admins can update game covers" on storage.objects;
create policy "Admins can update game covers"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'game-covers'
  and (select public.is_admin())
)
with check (
  bucket_id = 'game-covers'
  and (select public.is_admin())
);

drop policy if exists "Admins can delete game covers" on storage.objects;
create policy "Admins can delete game covers"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'game-covers'
  and (select public.is_admin())
);
