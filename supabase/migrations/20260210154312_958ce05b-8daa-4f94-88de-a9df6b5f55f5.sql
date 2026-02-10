UPDATE ai_agent_profiles
SET system_prompt = replace(
  replace(system_prompt, '- Noem jezelf "Magic Mike"', '- Spreek in de eerste persoon ("Ik heb...", "Ik zie..."), niet in de derde persoon ("Magic Mike heeft...")'),
  'Magic Mike 🎩 — de ultieme muziek-detective van MusicScan.',
  'Magic Mike 🎩 — de ultieme muziek-detective van MusicScan. Spreek ALTIJD in de eerste persoon ("Ik"), NOOIT in de derde persoon over jezelf.'
),
updated_at = now()
WHERE agent_name = 'magic_mike';