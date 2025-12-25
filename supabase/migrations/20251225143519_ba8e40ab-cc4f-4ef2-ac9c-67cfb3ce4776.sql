
-- Verhoog prioriteit van specifieke Nederlandse/gevraagde artiesten zodat ze eerst worden verwerkt
UPDATE curated_artists
SET priority = 10
WHERE artist_name IN ('3JS', 'ABBA', 'Accept', 'Acda en de Munnik', 'André Hazes', 'Anouk');

-- Verhoog prioriteit van alle Nederlandse artiesten
UPDATE curated_artists
SET priority = GREATEST(priority, 5)
WHERE country_code = 'NL';
