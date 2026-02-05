
# MusicScan Discogs Matching Protocol v4.0 (CANONICAL · NO FALSE NEGATIVES)

## 🎯 Core Principle

**Barcode + catalog number define the release. Matrix refines, never blocks.**

False negatives are unacceptable.
False positives are worse → choose NO_MATCH over guessing.

## 🔧 Normalization (Mandatory)

```
barcode_digits = digits only (5027626416423)
catno_norm = uppercase, collapse spaces
matrix_canonical = remove leading noise tokens (length < 3, purely numeric)
```

### Matrix Normalization Example
```
"S 2 SUMCD 4164 01" → ["SUMCD","4164","01"] → "SUMCD 4164 01"
```

## 🔍 Discogs Search Strategy

### 🥇 STRATEGY 1: BARCODE (PRIMARY)
```
GET /database/search?barcode={barcode_digits}&type=release
```
❌ FORBIDDEN: `q=`, `format=`, any other filters

### 🥈 STRATEGY 2: CATNO (+ optional label)
```
GET /database/search?catno={catno_norm}&type=release
```
❌ FORBIDDEN: `format=`

### ⛔ STRATEGY 3: ARTIST/TITLE
Never auto-select. Suggestion only for manual review.
Used ONLY when Strategy 1+2 return 0 results AND technical identifiers exist.

**UI Flow for Strategy 3:**
1. Show message: "Exacte release niet gevonden (barcode/catno niet geregistreerd in Discogs)"
2. Show suggestions from artist+title search
3. User can manually select or mark as "Not in Discogs"

## 🧪 Verification & Scoring (MAX 160)

| Check | Points |
|-------|--------|
| Matrix match (relaxed subset, order-insensitive) | +50 |
| Barcode exact match | +40 |
| Catno exact match | +25 |
| Label exact match | +15 |
| Year exact match | +10 |
| Country exact match | +10 |
| IFPI codes present | +5 |
| Title similarity | +5 |
| **Maximum** | **160** |

### Matrix Matching (RELAXED BUT SAFE)
Matrix match = TRUE if ALL canonical tokens appear in candidate matrix tokens.
- Order-insensitive
- Subset match
- Matrix absence does NOT block if barcode + catno match

## 🔒 Lock Conditions (NON-NEGOTIABLE)

Immediately `LOCKED` if ANY is true:

1. **Barcode + Catno match** ← HIGHEST PRIORITY
2. Matrix + Barcode match
3. Matrix + Catno match
4. Barcode + Label + Year match
5. Matrix + Label + Year match

➡️ Status = `verified`

## ⛔ Hard Gating Rules

- Never require matrix match if barcode + catno match
- Never drop to fuzzy title matching when barcode exists
- Confidence < 70 → `no_match`
- Strategy 3 results = suggestion only, never auto-select
- Must match at least TWO of {barcode, catno, matrix} OR score >= 70
- Must match at least TWO of {barcode, catno, matrix} OR score >= 70

## 🌐 HTTP Integrity Rules

For EVERY Discogs API call:

**Required Headers:**
```
User-Agent: MusicScan/1.0 +https://musicscan.app
Authorization: Discogs token=YOUR_TOKEN
```

**Response Handling:**
- HTTP status ≠ 200 → STOP, return `api_error`
- Parse results ONLY from `json.results` array
- `results.length === 0` is legitimate empty (not an error)

## ✅ Regression Test (MANDATORY)

**Input:**
```
Barcode: 5027626416423
Catno: SUMCD 4164
Matrix: SUMCD 4164 01 (or "S 2 SUMCD 4164 01")
```

**MUST return:**
```
Release: 4381440
URL: https://www.discogs.com/release/4381440
Lock: "Barcode + Catalog match"
Confidence: 65+ points (barcode=40 + catno=25)
```

## 📤 Output Format

### ✅ Verified
```json
{
  "status": "verified",
  "discogs_release_id": 4381440,
  "discogs_url": "https://www.discogs.com/release/4381440",
  "confidence_score": 155,
  "matched_on": ["barcode", "catno", "matrix"],
  "explain": [
    "Barcode matched exactly",
    "Catalog number matched",
    "Matrix canonical match after noise removal"
  ]
}
```

### ❌ API Error
```json
{
  "status": "api_error",
  "reason": "Discogs API returned non-200 response",
  "action": "retry_with_backoff_or_manual_review"
}
```

### ❌ No Match
```json
{
  "status": "no_match",
  "reason": "No Discogs release matches barcode and catalog number",
  "action": "manual_review_required"
}
```

## 🧠 Final Principle

> A empty candidate set is acceptable.
> A incorrect match is never acceptable.
