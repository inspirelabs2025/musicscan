-- priced_at = wanneer we voor het laatst gekeken hebben (staat op de pagina).
-- price_changed_at = wanneer de vork daadwerkelijk veranderde (voedt lastmod).
-- Die twee uit elkaar halen omdat een lastmod die elke run opschuift terwijl
-- de inhoud gelijk blijft, Google leert die lastmod te negeren.
alter table public.releases
  add column if not exists price_changed_at timestamptz;

update public.releases
set price_changed_at = priced_at
where priced_at is not null and price_changed_at is null;

-- De view krijgt price_changed_at erbij; de rest is ongewijzigd, zie
-- 20260925075500_value_pages_median.sql voor de opbouw.
drop view if exists public.value_pages;

create view public.value_pages as
select
  r.group_slug,
  r.artist_slug,
  substr(r.group_slug, length(r.artist_slug) + 2)            as album_slug,
  max(r.artist)                                              as artist,
  max(r.album_title)                                         as album_title,
  max(r.version_count)                                       as version_count,
  max(r.country_count)                                       as country_count,
  (array_agg(r.pressings_by_country) filter (where r.pressings_by_country is not null))[1] as pressings_by_country,
  (array_agg(r.format_prices)        filter (where r.format_prices        is not null))[1] as format_counts,
  (array_agg(r.first_pressing)       filter (where r.first_pressing       is not null))[1] as first_pressing,
  (array_agg(r.example_pressing_by_locale) filter (where r.example_pressing_by_locale is not null))[1] as example_pressing_by_locale,
  (array_agg(r.reissue_years)        filter (where r.reissue_years        is not null))[1] as reissue_years,
  (array_agg(r.artwork_url)          filter (where r.artwork_url          is not null))[1] as artwork_url,
  (array_agg(r.story_url)            filter (where r.story_url            is not null))[1] as story_url,
  min(r.price_range_min)                                     as price_range_min,
  max(r.price_range_max)                                     as price_range_max,
  max(r.priced_at)                                           as priced_at,
  max(r.price_changed_at)                                    as price_changed_at,
  ((array_agg(r.price_sources) filter (where r.price_sources is not null and jsonb_array_length(r.price_sources) > 0))[1] -> 0 ->> 'median')::numeric as price_median,
  ((array_agg(r.price_sources) filter (where r.price_sources is not null and jsonb_array_length(r.price_sources) > 0))[1] -> 0 ->> 'n')::int          as price_observations,
  count(*)                                                   as db_pressings,
  coalesce(sum(r.total_scans), 0)                            as total_scans,
  max(r.enriched_at)                                         as enriched_at,
  (
    select jsonb_agg(p order by jaar, land)
    from (
      select jaar, land, p
      from (
        select distinct on (r2.catalog_number, r2.country)
               r2.year as jaar, r2.country as land,
               jsonb_build_object(
                 'year', r2.year, 'country', r2.country,
                 'label', public.dedup_labels(r2.label),
                 'catno', r2.catalog_number, 'format', r2.format
               ) as p
        from public.releases r2
        where r2.group_slug = r.group_slug
          and r2.catalog_number is not null
          and r2.catalog_number not in ('none', 'None', '-')
          and r2.year is not null and r2.year > 1900
        order by r2.catalog_number, r2.country, r2.year
      ) uniq
      order by jaar, land
      limit 12
    ) s
  ) as pressing_rows
from public.releases r
where r.group_slug is not null
  and r.artist_slug is not null
  and r.enriched_at is not null
group by r.group_slug, r.artist_slug;

grant select on public.value_pages to anon, authenticated;

-- Van elk uur naar een keer per dag om 04:25. Drie albums per run dekt 21 per
-- week, dus elk album komt ruim binnen zeven dagen aan de beurt. Opschalen
-- gaat via limit: runs per dag maal limit moet minstens albums/7 zijn.
select cron.unschedule('refresh-value-prices-hourly')
where exists (select 1 from cron.job where jobname = 'refresh-value-prices-hourly');

select cron.schedule(
  'refresh-value-prices-daily',
  '25 4 * * *',
  $$
  select net.http_post(
    url := 'https://ssxbpyqnjfiyubsuonar.supabase.co/functions/v1/refresh-value-prices?limit=3',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGJweXFuamZpeXVic3VvbmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMDgyNTMsImV4cCI6MjA2MTY4NDI1M30.UFZKmrN-gz4VUUlKmVfwocS5OQuxGm4ATYltBJn3Kq4"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
