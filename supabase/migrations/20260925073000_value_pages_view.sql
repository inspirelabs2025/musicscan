-- Waardepagina's: één rij per albumgroep als bron voor /waarde/{artiest}/{album}.
-- De groepsvelden staan in public.releases op elke rij van de groep herhaald;
-- deze view brengt ze terug tot één rij en levert meteen de persingentabel.

create or replace function public.dedup_labels(txt text) returns text
language sql immutable as $$
  select nullif(string_agg(distinct btrim(part), ', ' order by btrim(part)), '')
  from unnest(string_to_array(coalesce(txt, ''), ',')) as part
  where btrim(part) <> ''
$$;

create or replace view public.value_pages as
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
