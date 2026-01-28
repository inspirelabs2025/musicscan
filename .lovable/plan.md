
# Plan: Automatische Artist/Album Linking na Scan

## Probleem Analyse

De matrix OCR-registratie werkt correct, maar de koppeling naar de canonieke `releases` tabel gebeurt niet automatisch. Dit betekent:
- Scans staan los van de centrale release database
- Artist stories en album verhalen worden niet gekoppeld
- Statistieken en aggregatie werken niet

## Oplossing: Post-Scan Release Linking

### Stap 1: Uitbreiden ai_scan_results tabel
Toevoegen van een `release_id` kolom aan `ai_scan_results`:

```sql
ALTER TABLE ai_scan_results 
ADD COLUMN release_id UUID REFERENCES releases(id);

CREATE INDEX idx_ai_scan_release ON ai_scan_results(release_id);
```

### Stap 2: Automatische linking in ai-photo-analysis-v2
Na succesvolle Discogs match, direct `find-or-create-release` aanroepen:

```text
Location: supabase/functions/ai-photo-analysis-v2/index.ts

Na regel ~350 (na artwork enrichment):
1. Aanroepen van find-or-create-release met Discogs data
2. Update ai_scan_results met release_id
```

### Stap 3: Update Scanner.tsx voor vinyl2_scan/cd_scan
In de `saveFinalScan` functie (rond regel 359-410):
1. Na insert, aanroepen van `find-or-create-release` 
2. Update scan record met verkregen `release_id`

### Stap 4: Backfill bestaande scans
Edge function voor achtergrond-koppeling van bestaande scans zonder release_id:

```text
Nieuwe edge function: backfill-scan-releases
- Query scans met discogs_id maar zonder release_id
- Batch processing (100 per run)
- Automatisch via cronjob
```

## Technische Details

### Wijzigingen ai-photo-analysis-v2/index.ts

```typescript
// Na artwork enrichment (regel ~350)
if (discogsResult?.discogsId) {
  try {
    console.log('🔗 Linking to releases table...');
    const { data: releaseData } = await supabase.functions.invoke('find-or-create-release', {
      body: {
        discogs_id: discogsResult.discogsId,
        artist: discogsResult.artist,
        title: discogsResult.title,
        label: discogsResult.label,
        catalog_number: discogsResult.catalogNumber,
        year: discogsResult.year,
        genre: combinedData.genre,
        country: combinedData.country,
        discogs_url: discogsResult.discogsUrl,
      }
    });
    
    if (releaseData?.release_id) {
      await supabase.from('ai_scan_results')
        .update({ release_id: releaseData.release_id })
        .eq('id', scanId);
      console.log('✅ Linked to release:', releaseData.release_id);
    }
  } catch (error) {
    console.log('⚠️ Release linking failed:', error);
  }
}
```

### Wijzigingen Scanner.tsx

```typescript
// Na succesvolle insert (regel ~410)
if (data && searchResults[0]?.discogs_id) {
  try {
    const { data: releaseData } = await supabase.functions.invoke('find-or-create-release', {
      body: {
        discogs_id: searchResults[0].discogs_id,
        artist: bestArtist,
        title: bestTitle,
        // ... rest van de data
      }
    });
    
    if (releaseData?.release_id) {
      await supabase.from(tableName)
        .update({ release_id: releaseData.release_id })
        .eq('id', data.id);
    }
  } catch (error) {
    console.error('Release linking failed:', error);
  }
}
```

## Bestanden die aangepast worden

| Bestand | Actie |
|---------|-------|
| Database migratie | `release_id` kolom toevoegen aan `ai_scan_results` |
| `supabase/functions/ai-photo-analysis-v2/index.ts` | Automatische release linking na scan |
| `src/pages/Scanner.tsx` | Release linking na vinyl/cd scan |
| `supabase/functions/backfill-scan-releases/index.ts` | Nieuwe functie voor bestaande scans |

## Impact

Na implementatie:
- Elke nieuwe scan wordt automatisch gekoppeld aan releases tabel
- Bestaande scans worden via backfill gekoppeld
- Artist stories en album verhalen zijn vindbaar via scans
- Platform-brede statistieken werken correct
