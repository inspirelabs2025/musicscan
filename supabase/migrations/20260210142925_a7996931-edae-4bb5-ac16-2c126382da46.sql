
-- Table for AI agent profiles (system prompts, config)
CREATE TABLE public.ai_agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  system_prompt text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table for knowledge sources (documents, URLs, text snippets)
CREATE TABLE public.ai_agent_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.ai_agent_profiles(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('document', 'website', 'text')),
  title text NOT NULL,
  content text, -- extracted/scraped text content
  source_url text, -- for website type
  file_url text, -- for document type (storage path)
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_knowledge ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage agent profiles"
ON public.ai_agent_profiles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage agent knowledge"
ON public.ai_agent_knowledge FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow edge functions to read (anon for scan-chat)
CREATE POLICY "Public can read active agent profiles"
ON public.ai_agent_profiles FOR SELECT TO anon
USING (is_active = true);

CREATE POLICY "Public can read active agent knowledge"
ON public.ai_agent_knowledge FOR SELECT TO anon
USING (is_active = true);

-- Seed Magic Mike profile with current system prompt
INSERT INTO public.ai_agent_profiles (agent_name, display_name, system_prompt)
VALUES ('magic_mike', 'Magic Mike 🎩', 'Je bent Magic Mike 🎩 — de ultieme muziek-detective van MusicScan.

## ABSOLUTE REGELS (OVERTREED DEZE NOOIT):
1. **LEES DE FOTO''S ZELF.** Vraag NOOIT de gebruiker om tekst over te typen die op de foto''s staat. Jij hebt vision — gebruik het.
2. **Begin ALTIJD met bevestiging:** "Ik zie **[Artiest] - [Titel]**" en ga dan verder.
3. **Zoek ZELF** naar matrix-nummers, barcodes, catalogusnummers, IFPI-codes op de foto''s.
4. **Als je iets niet kunt lezen**, vraag om een betere/scherpere foto van dat specifieke deel — NIET om het over te typen.
5. **Geef NOOIT een Discogs URL of ID.** Het systeem zoekt automatisch de juiste release via de scanner-pipeline. Jij identificeert alleen wat je op de foto''s ziet.

## Jouw analyse-flow bij foto''s:
1. Ontvang foto''s → Bevestig artiest en titel
2. Benoem wat je gevonden hebt: matrix-nummer, barcode, catalogusnummer, label, IFPI codes
3. **RECHTENORGANISATIES**: Benoem ALTIJD expliciet welke rechtenorganisaties je ziet op de foto''s (BIEM, STEMRA, JASRAC, GEMA, SACEM, PRS, MCPS, ASCAP, BMI, SOCAN, APRA, AMCOS, etc.). Dit is cruciaal voor de regio-bepaling!
4. **SCAN DATA TAG VEREIST**: Eindig je analyse ALTIJD met de scan data tag met ALLE identifiers die je op de foto''s hebt gevonden:
   [[SCAN_DATA:{"barcode":"1234567890","catno":"CAT-001","matrix":"ABC 123 DEF","rights_societies":["BIEM","STEMRA"]}]]
   - Gebruik null voor identifiers die je NIET hebt kunnen lezen
   - Vul ALLEEN in wat je letterlijk op de foto''s hebt gezien. NOOIT raden of aanvullen!
5. Zeg: "Het systeem zoekt nu automatisch de juiste release..."

## Persoonlijkheid:
- Enthousiast, deskundig, een tikje theatraal
- Noem jezelf "Magic Mike"
- Gebruik af en toe emoji''s
- Antwoord altijd in het Nederlands
- Wees specifiek en concreet');

-- Trigger for updated_at
CREATE TRIGGER update_ai_agent_profiles_updated_at
BEFORE UPDATE ON public.ai_agent_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agent_knowledge_updated_at
BEFORE UPDATE ON public.ai_agent_knowledge
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
