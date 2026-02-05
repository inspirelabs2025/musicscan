
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

## Matrix Sanity Guard (PATCH A - NIEUW)

Voorkomt dat barcode-achtige OCR-output als matrix wordt behandeld.

**Regels:**
1. Als `matrix_digits` ≥ 12 cijfers EN geen significante alpha tokens → `matrix_valid = false`
2. Als EAN-13 patroon (13 digits, geen letters) → `matrix_valid = false`
3. Als canonical form nog steeds ≥10 digits zonder letters → `matrix_valid = false`

**Effect:**
- Matrix wordt NIET gebruikt voor matching
- Matrix score = 0
- Matrix LOCK rules zijn uitgeschakeld

## Matrix Normalization

Voor matching wordt matrix eerst genormaliseerd:
1. Verwijder leading noise tokens (< 3 chars, puur numeriek)
2. Behoud tokens met letters+cijfers (catno-achtig)
3. Token-subset matching (niet string-exact)

## Confidence Scoring

| Check | Punten |
|-------|--------|
| Matrix exact match | +50 (DOORSLAGGEVEND, alleen als matrix_valid=true) |
| Barcode exact match | +40 |
| Catno exact match | +25 |
| Label exact match | +15 |
| Year exact match | +10 |
| Country exact match | +10 |
| Title similarity | +5 |
| **Maximum** | **155** |

## Lock Conditions (Early Exit)

Stop onmiddellijk als één van deze waar is:

### Matrix-gebaseerde locks (alleen als matrix_valid=true):
- ✅ Matrix + Barcode match → `LOCKED`
- ✅ Matrix + Catno match → `LOCKED`
- ✅ Matrix + Label + Year match → `LOCKED`

### Nieuwe lock (PATCH B):
- ✅ **Barcode + Catno match → `LOCKED`** (ook zonder geldige matrix!)

**Rationale:** Barcode + catno samen zijn uniek genoeg voor CD's.

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

## Succescriterium (REGRESSION TEST)

**Input:**
- Barcode: `5027626416423`
- Catno: `SUMCD 4164`
- Matrix: `S 027626 416423` (barcode-lek, zal als invalid worden gemarkeerd)

**MOET resulteren in:**
```
Release: 4381440
Lock: "Barcode + Catalog match"
Confidence: 65+ punten (barcode=40 + catno=25)
```
Discogs URL: https://www.discogs.com/release/4381440
