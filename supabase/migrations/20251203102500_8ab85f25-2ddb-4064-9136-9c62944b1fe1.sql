-- 13 Contextuele Popup Stories voor MusicScan
-- Elk popup is gekoppeld aan specifieke pagina's met relevante content

INSERT INTO public.site_popups (name, popup_type, title, description, button_text, button_url, trigger_type, trigger_value, trigger_pages, display_frequency, priority, show_to_guests, show_to_users, is_active) VALUES

-- 1. De Tijdreiziger (Nieuws → Muziekgeschiedenis)
('De Tijdreiziger', 'contextual_redirect', '🕐 Reis door de tijd!', 'Ontdek wat er vandaag in de muziekgeschiedenis gebeurde. Van legendarische optredens tot iconische album releases.', 'Bekijk Vandaag', '/vandaag-in-de-muziekgeschiedenis', 'scroll_depth', 40, ARRAY['/nieuws'], 'once_per_day', 70, true, true, true),

-- 2. Superfan Challenge (Artists → Quiz)
('Superfan Challenge', 'quiz_prompt', '🎤 Ken jij deze artiest echt?', 'Test je kennis over je favoriete artiesten in onze uitdagende quiz. Bewijs dat je een echte superfan bent!', 'Start de Quiz', '/quizzen/artiesten', 'time_on_page', 30, ARRAY['/artists'], 'once_per_session', 65, true, true, true),

-- 3. Verhaal Achter de Muziek (Singles/Verhalen → Meer verhalen)
('Verhaal Achter de Muziek', 'contextual_redirect', '📖 Honger naar meer verhalen?', 'Duik dieper in de wereld van muziek. Ontdek de fascinerende verhalen achter je favoriete songs en albums.', 'Ontdek Meer Verhalen', '/singles', 'scroll_depth', 50, ARRAY['/muziek-verhaal', '/plaat-verhaal'], 'once_per_day', 60, true, true, true),

-- 4. Trots op NL (Nederland → NL Quiz)
('Trots op Nederland', 'quiz_prompt', '🇳🇱 Hoe goed ken jij Nederlandse muziek?', 'Van André Hazes tot Tiësto - test je kennis over de rijke muziekgeschiedenis van Nederland!', 'Start NL Quiz', '/quizzen/nederland', 'time_on_page', 45, ARRAY['/nederland'], 'once_per_session', 75, true, true, true),

-- 5. Vive la Musique (Frankrijk → FR Quiz)
('Vive la Musique', 'quiz_prompt', '🇫🇷 Vive la musique française!', 'Van Édith Piaf tot Daft Punk - hoe goed ken jij de Franse muziekscene?', 'Start FR Quiz', '/quizzen/frankrijk', 'time_on_page', 45, ARRAY['/frankrijk'], 'once_per_session', 75, true, true, true),

-- 6. Feel the Beat (Dance-House → Dance Quiz)
('Feel the Beat', 'quiz_prompt', '🎧 Feel the beat!', 'Van Chicago House tot Amsterdam Trance - test je kennis over de electronic dance muziek scene!', 'Start Dance Quiz', '/quizzen/dance-house', 'time_on_page', 45, ARRAY['/dance-house'], 'once_per_session', 75, true, true, true),

-- 7. Dagelijkse Nostalgie (Muziekgeschiedenis → Newsletter)
('Dagelijkse Nostalgie', 'newsletter', '📬 Dagelijkse dosis nostalgie', 'Ontvang elke dag een uniek muziekfeit in je inbox. Van verborgen parels tot iconische momenten.', NULL, NULL, 'scroll_depth', 60, ARRAY['/vandaag-in-de-muziekgeschiedenis'], 'once_per_day', 55, true, true, true),

-- 8. Word een Legende (Quiz Hub → Motivatie)
('Word een Legende', 'gamification', '🏆 Word een MusicScan Legende!', 'Speel dagelijks quizzen, verzamel badges en klim op de ranglijst. Jouw muziekkennis verdient erkenning!', 'Bekijk Mijn Stats', '/quizzen', 'time_on_page', 20, ARRAY['/quizzen'], 'once_per_day', 50, true, true, true),

-- 9. Ken je Collectie (My Collection → Collectie Quiz)
('Ken je Collectie', 'quiz_prompt', '💿 Ken jij je eigen collectie?', 'Test je kennis over de albums in je persoonlijke verzameling. Hoeveel weet je echt over je vinyl?', 'Start Collectie Quiz', '/quizzen/collectie', 'time_on_page', 30, ARRAY['/mijn-collectie', '/collection'], 'once_per_session', 65, true, true, true),

-- 10. Breaking Releases (New Releases → Newsletter)
('Breaking Releases', 'newsletter', '🔔 Mis nooit meer een release!', 'Schrijf je in voor release alerts en weet als eerste wanneer je favoriete artiesten nieuwe muziek uitbrengen.', NULL, NULL, 'scroll_depth', 50, ARRAY['/new-release', '/releases'], 'once_per_day', 60, true, true, true),

-- 11. Wist Je Dat (Anekdotes → Random anekdote)
('Wist Je Dat', 'contextual_redirect', '💡 Wist je dat...?', 'Ontdek nog meer fascinerende muziekanekdotes. Van backstage geheimen tot onverwachte samenwerkingen.', 'Lees Meer Anekdotes', '/anekdotes', 'scroll_depth', 40, ARRAY['/anekdotes'], 'once_per_day', 55, true, true, true),

-- 12. Van Fan naar Kunstenaar (Shop → Exit intent promo)
('Van Fan naar Kunstenaar', 'promo', '🎨 Draag je passie!', 'Transformeer je favoriete albumart in unieke merchandise. Van posters tot T-shirts - maak kunst van muziek.', 'Bekijk de Shop', '/shop', 'exit_intent', NULL, ARRAY['/product', '/shop', '/posters', '/canvas', '/shirts', '/merchandise'], 'once_per_session', 80, true, true, true),

-- 13. Welcome Explorer (Homepage → Quiz intro)
('Welcome Explorer', 'quiz_prompt', '🎵 Welkom bij MusicScan!', 'Ontdek hoe goed je muziekkennis echt is. Start met een snelle quiz en ontdek je muzikale IQ!', 'Test Je Kennis', '/quizzen', 'time_on_page', 60, ARRAY['/'], 'once_per_session', 40, true, true, true);