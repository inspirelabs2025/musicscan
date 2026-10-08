-- Verrijken op zoekvraag in plaats van op catalogusvariatie.
--
-- value_candidates rangschikt gescande albumgroepen op hoeveel verschillende
-- catalogusnummers en landen ze hebben. Dat levert vooral indie en metal op,
-- terwijl het zoekvraagonderzoek van 8 oktober liet zien dat Nederlanders
-- zoeken naar de Beatles, Elvis, Michael Jackson, de Rolling Stones, ABBA,
-- Pink Floyd en soundtracks als Grease en Saturday Night Fever. Die vallen
-- buiten de kandidaten: hun groepen hebben geen albumdeel in de slug, geen
-- master_id, of een Japanse titel.
--
-- value_seeds is een lijst albums die we willen hebben, los van wat er ooit
-- gescand is. enrich-value-pages?source=seeds zoekt de Discogs-master erbij,
-- haalt de persingen op en schrijft ze als releases weg, precies zoals bij
-- de kandidaten.
create table if not exists public.value_seeds (
  id bigserial primary key,
  artist text not null,
  title text not null,
  master_id integer,
  priority integer not null default 0,
  source text not null default 'zoekvraag',
  status text not null default 'pending',   -- pending | enriched | exists | skipped
  note text,
  group_slug text,
  attempted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (artist, title)
);

comment on table public.value_seeds is
  'Albums die een waardepagina moeten krijgen omdat er op gezocht wordt; verwerkt door enrich-value-pages?source=seeds.';

create index if not exists value_seeds_pending_idx
  on public.value_seeds (priority desc, id) where status = 'pending';

-- Alleen de service role schrijft en leest hier; geen publieke policies.
alter table public.value_seeds enable row level security;
