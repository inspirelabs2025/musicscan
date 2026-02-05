
# MusicScan Discogs Matching Protocol v3.0

## ✅ GEÏMPLEMENTEERD

### Kernprincipe
**Technische identifiers bepalen waarheid. Titel en artiest zijn slechts decoratie.**

## Zoek Hiërarchie (VERPLICHTE VOLGORDE)

### 🥇 STRATEGY 1: BARCODE (PRIMARY, HARD)
```
Parameters: barcode={barcode_digits}&type=release
❌ VERBODEN: format, country, year, fuzzy q
```

### 🥈 STRATEGY 2: CATNO + LABEL (HIGH)
```
Parameters: catno={catno_norm}&type=release
Optioneel: &label={label}
❌ VERBODEN: format
```

### 🥉 STRATEGY 3: ARTIST + TITLE (SUGGEST ONLY)
```
Parameters: artist={artist}&release_title={title}&type=release&format={CD|Vinyl}
⚠️ MAG NOOIT automatisch selecteren bij aanwezige technische identifiers
```

## Confidence Scoring

| Check | Punten |
|-------|--------|
| Matrix exact match | +50 (DOORSLAGGEVEND) |
| Barcode exact match | +40 |
| Catno exact match | +25 |
| Label exact match | +15 |
| Year exact match | +10 |
| Country exact match | +10 |
| Title similarity | +5 |
| **Maximum** | **155** |

## Lock Conditions (Early Exit)

Stop onmiddellijk als één van deze waar is:
- ✅ Matrix + Barcode match → `LOCKED`
- ✅ Matrix + Catno match → `LOCKED`
- ✅ Matrix + Label + Year match → `LOCKED`

## Hard Gating Rules

### RULE 1: Identifier Minimum
Een release MAG NIET gekozen worden als:
- Geen match op barcode, catno of matrix
- → DISQUALIFY

### RULE 2: Confidence Threshold
- Score < 70 → NO_MATCH
- Score ≥ 70 → eligible

### RULE 3: Fallback Safety
Als STRATEGY 3 (fuzzy) is gebruikt bij aanwezige technische identifiers:
- Auto-selectie = VERBODEN
- Status = `manual_review_required`

## Absoluut Verboden Gedrag

- ❌ NOOIT format filter op barcode of catno searches
- ❌ NOOIT fuzzy title/artist match kiezen bij aanwezige technische identifiers
- ❌ NOOIT confidence afronden of ophogen
- ❌ NOOIT "best guess" selecties

## Succescriterium (Regression Test)

**Input:**
- Barcode: `5027626416423`
- Catno: `SUMCD 4164`
- Matrix: `SUMCD 4164 01`

**MOET resulteren in:**
```
https://www.discogs.com/release/4381440
```
