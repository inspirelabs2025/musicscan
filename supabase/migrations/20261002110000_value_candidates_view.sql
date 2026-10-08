-- Kandidaten voor een waardepagina: albumgroepen die nog niet verrijkt zijn,
-- gerangschikt op hoeveel er over te vertellen valt. Een pagina leeft van de
-- persingentabel, dus het aantal verschillende catalogusnummers en landen is
-- de beste voorspeller van een pagina die niet dun aanvoelt.
--
-- Twee vangrails kwamen pas bij het opschalen boven water. Er bestaan groepen
-- waarvan het group_slug alleen de artiest is ('the-beatles', 'elvis-presley');
-- die leveren een URL zonder albumdeel op en een titel uit een willekeurige
-- rij — bij The Beatles kwam er "A Taste Of Honey" uit, een nummer. En een
-- handvol groepen draagt een Japanse of Chinese titel; een Nederlandse pagina
-- met de kop "Wat is ロックン・ロール・ミュージック waard?" hoort niet
-- gepubliceerd te worden. Beide vallen hier weg in plaats van dat we ze
-- onderweg proberen te repareren.
create or replace view public.value_candidates as
select
  r.group_slug,
  r.artist_slug,
  substr(r.group_slug, length(r.artist_slug) + 2) as album_slug,
  max(r.artist)                                   as artist,
  max(r.album_title)                              as album_title,
  max(r.master_id)                                as master_id,
  count(*)                                        as db_rijen,
  count(distinct r.catalog_number) filter (
    where r.catalog_number is not null
      and r.catalog_number not in ('none', 'None', '-')
  )                                               as catnos,
  count(distinct r.country) filter (where r.country is not null) as landen,
  coalesce(sum(r.total_scans), 0)                 as scans,
  (
    count(distinct r.catalog_number) filter (
      where r.catalog_number is not null
        and r.catalog_number not in ('none', 'None', '-')
    ) * 3
    + count(distinct r.country) filter (where r.country is not null) * 2
    + coalesce(sum(r.total_scans), 0) * 5
    + case when max(r.master_id) is not null then 10 else 0 end
  )                                               as score
from public.releases r
where r.group_slug is not null
  and r.artist_slug is not null
  and r.enriched_at is null
group by r.group_slug, r.artist_slug
having count(distinct r.catalog_number) filter (
         where r.catalog_number is not null
           and r.catalog_number not in ('none', 'None', '-')
       ) >= 3
   and count(distinct r.country) filter (where r.country is not null) >= 2
   and length(substr(r.group_slug, length(r.artist_slug) + 2)) >= 3
   and max(r.album_title) ~ '[A-Za-z]';

grant select on public.value_candidates to anon, authenticated, service_role;

comment on view public.value_candidates is
  'Nog niet verrijkte albumgroepen met genoeg persingsvariatie, een echt albumdeel in de slug en een leesbare titel, gesorteerd op score.';
