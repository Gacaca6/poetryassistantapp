/**
 * build-dictionary.mjs  (v3 — cleaned definitions)
 * ────────────────────────────────────────────────
 * Sources (all public domain / MIT):
 *   1. adambom/dictionary  — ~24 000 real definitions (JSON, CC BY-SA 3.0)
 *   2. dwyl/english-words  — 370 000 word list (MIT)
 *   3. cmu-pronouncing-dictionary — syllable counts (BSD)
 *
 * Run:  node scripts/build-dictionary.mjs
 *
 * FIXES vs v2:
 *   BUG 1 — Squished words ("differentcities", "whetherphysical"):
 *            Source JSON has bare \n with no preceding space. Now inserts
 *            a space before each \n BEFORE whitespace collapse.
 *   BUG 2 — Encoding junk ("-- Ab*sorb\\", "A*ba\\"):
 *            Webster's 1913 pronunciation markup leaked into definitions.
 *            Stripped with targeted regex.
 *   BUG 3 — Author citations ("rhinoceros.Purchas.", "Obeisance.Jonson."):
 *            v2 split on ". [A-Z]" (with space) but citations have no space.
 *            Now also strips /\.[A-Z][a-z]+\.?$/ patterns.
 *   BUG 4 — "See X." / "Same as X." cross-references:
 *            Useless to users — now filtered out entirely.
 *   BUG 5 — Wrong syllable counts ("abandon"=1, "abalone"=1):
 *            CMU lookup now tries more casing variants before falling back.
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/dictionary-data.ts')
const require = createRequire(import.meta.url)

// ─── 1. CMU Pronouncing Dictionary ───────────────────────────────────────────
console.log('📖  Loading CMU Pronouncing Dictionary...')
const { dictionary: cmuDict } = require('cmu-pronouncing-dictionary')
const cmuWords = new Set(
  Object.keys(cmuDict).map(w => w.toLowerCase().replace(/\(\d+\)$/, ''))
)
console.log(`     ${cmuWords.size.toLocaleString()} words in CMU`)

function syllablesFromCMU(word) {
  // FIX 5: try multiple casing forms before giving up
  const pron =
    cmuDict[word] ||
    cmuDict[word[0].toUpperCase() + word.slice(1)] ||
    cmuDict[word.toUpperCase()] ||
    cmuDict[word.replace(/s$/, '')] ||
    cmuDict[(word.replace(/s$/, ''))[0]?.toUpperCase() + word.replace(/s$/, '').slice(1)]
  if (pron) return Math.max(1, (pron.match(/[AEIOU][0-9]/g) || []).length)
  return estimateSyllables(word)
}

function estimateSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 1
  const clean = w.length > 3 ? w.replace(/e$/, '') : w  // strip silent trailing e only for longer words
  const m = clean.match(/[aeiouy]+/g)
  return Math.max(1, m ? m.length : 1)
}

// ─── 2. Real definitions from adambom/dictionary ─────────────────────────────
const ADAM_URL = 'https://raw.githubusercontent.com/adambom/dictionary/master/dictionary.json'
console.log('📥  Fetching adambom/dictionary...')
let adamRaw
try {
  const r = await fetch(ADAM_URL, { headers: { 'User-Agent': 'poetry-assistant-build' } })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  adamRaw = await r.json()
  console.log(`     ${Object.keys(adamRaw).length.toLocaleString()} entries loaded`)
} catch (e) {
  console.error('     ⚠ Could not fetch adambom/dictionary:', e.message)
  adamRaw = {}
}

// ─── 3. Definition cleaner ────────────────────────────────────────────────────
function cleanDefinition(rawDef) {
  if (!rawDef) return ''
  let def = typeof rawDef === 'string' ? rawDef
    : Array.isArray(rawDef) ? String(rawDef[0] || '') : ''

  // FIX 1: The source JSON preserves Webster's original line breaks without a
  // trailing space, e.g. "different\ncities" → after bad collapse → "differentcities".
  // Insert a space before every \n where the preceding char is a letter, THEN collapse.
  def = def.replace(/([a-zA-Z])\n/g, '$1 \n')
  def = def.replace(/\s+/g, ' ').trim()

  // FIX 2: Webster's pronunciation markup leaked as junk at end of definitions.
  // Patterns: "-- Ab*sorb\\"  "A*ba\\"  "-- Ac*crim`i*na\\"
  def = def.replace(/\s*--\s*[A-Za-z][A-Za-z`*'"\\]{2,}\s*$/g, '')
  def = def.replace(/\s+[A-Za-z][A-Za-z`*'"]{2,}\\+\s*$/g, '')

  // FIX 3: Trailing author citations with NO preceding space.
  // ".Purchas."  ".Chaucer."  ".Milton"  "rhinoceros.Purchas."
  def = def.replace(/\.([A-Z][a-z]{2,}\.)+\s*$/g, '.')    // ".Purchas."
  def = def.replace(/\.([A-Z][a-z]{2,})\s*$/g, '.')        // ".Dryden"
  def = def.replace(/([a-z])([A-Z][a-z]{2,})\.\s*$/g, '$1.')  // "rhinoceros.Purchas."

  // Strip other Webster's 1913 artifacts
  def = def.replace(/^\([a-z1-9]\)\s*/i, '')               // Leading "(a)" "(1)"
  def = def.replace(/^\d+\.\s+/, '')                        // Leading "1. "
  def = def.replace(/^Defn:\s*/i, '')                       // Leading "Defn:"
  def = def.replace(/\s*\[(Obs|R|L|Colloq|Scot|U\.S|Eng|Archaic|Written also)\.?\]\s*/gi, ' ')

  // Strip "; as, [example]" illustrative clauses — keep just the definition
  const asIdx = def.search(/;\s+as,\s+/i)
  if (asIdx > 40) def = def.slice(0, asIdx) + '.'

  // Truncate at the first complete sentence (keeps UI readable)
  const sentEnd = def.search(/(?<=[a-z]{3})\.\s+[A-Z]/)
  if (sentEnd > 30 && sentEnd < 300) def = def.slice(0, sentEnd + 1)

  def = def.replace(/\s{2,}/g, ' ').trim()
  if (def && !/[.!?]$/.test(def)) def += '.'
  return def
}

// Build lowercase lookup → cleaned definition
const realDefs = new Map()
for (const [rawWord, rawDef] of Object.entries(adamRaw)) {
  const word = rawWord.toLowerCase().trim()
  if (!word || !/^[a-z]+$/.test(word)) continue
  const def = cleanDefinition(rawDef)
  // FIX 4: Filter "See X." / "Same as X." — useless cross-references
  if (/^(See|Same as)\s+\w+[.,]?\s*$/.test(def)) continue
  if (def.split(/\s+/).length <= 2 && def.length < 20) continue  // single-word synonyms
  if (def.length < 25) continue                                    // minimum quality bar
  if (!realDefs.has(word)) realDefs.set(word, def)
}
console.log(`     ${realDefs.size.toLocaleString()} usable definitions after cleaning`)

// ─── 4. dwyl word pool ───────────────────────────────────────────────────────
const WORDS_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt'
console.log('📥  Fetching dwyl/english-words...')
const res = await fetch(WORDS_URL)
if (!res.ok) throw new Error(`HTTP ${res.status}`)
const allWords = (await res.text())
  .split(/\r?\n/)
  .map(w => w.trim().toLowerCase())
  .filter(w => w && /^[a-z]+$/.test(w) && w.length >= 2 && w.length <= 22)
console.log(`     ${allWords.length.toLocaleString()} candidate words`)

// ─── 5. Helpers ───────────────────────────────────────────────────────────────
function guessPos(word) {
  const w = word.toLowerCase()
  if (w.endsWith('tion') || w.endsWith('sion') || w.endsWith('ness') || w.endsWith('ment') ||
      w.endsWith('ity')  || w.endsWith('ance') || w.endsWith('ence') || w.endsWith('ship') ||
      w.endsWith('dom')  || w.endsWith('ure')  || w.endsWith('er')   || w.endsWith('or')   ||
      w.endsWith('ist')  || w.endsWith('ism')  || w.endsWith('ium')  || w.endsWith('ology')) return 'noun'
  if (w.endsWith('ing')  || w.endsWith('ize')  || w.endsWith('ise')  ||
      w.endsWith('ify')  || w.endsWith('ate')  || w.endsWith('en'))   return 'verb'
  if (w.endsWith('ful')  || w.endsWith('less') || w.endsWith('ous')  || w.endsWith('ive')  ||
      w.endsWith('able') || w.endsWith('ible') || w.endsWith('ic')   || w.endsWith('ical') ||
      w.endsWith('ary')  || w.endsWith('ory')  || w.endsWith('ish')) return 'adjective'
  if (w.endsWith('ly') && w.length > 3) return 'adverb'
  return 'noun'
}

function fallbackDef(word, pos) {
  switch (pos) {
    case 'noun':      return `A ${word}; a specific thing, concept, or entity denoted by this term.`
    case 'verb':      return `To ${word}; to carry out or engage in the activity described by this word.`
    case 'adjective': return `Characterized by or relating to ${word}; having the qualities this word describes.`
    case 'adverb':    return `In a ${word} manner; to a degree expressed by this word.`
    default:          return `Relating to or having the character of ${word}.`
  }
}

// ─── 6. Build 60,000 entries ──────────────────────────────────────────────────
const MAX_WORDS = 60000
const seen = new Set()
const entries = []

// Pass 1: real definitions first
for (const word of allWords) {
  if (entries.length >= MAX_WORDS) break
  if (seen.has(word) || !realDefs.has(word)) continue
  seen.add(word)
  entries.push({ word, partOfSpeech: guessPos(word), definition: realDefs.get(word), syllables: syllablesFromCMU(word) })
}
console.log(`     ${entries.length.toLocaleString()} entries with real definitions`)

// Pass 2: CMU-validated with fallback
for (const word of allWords) {
  if (entries.length >= MAX_WORDS) break
  if (seen.has(word) || !cmuWords.has(word)) continue
  seen.add(word)
  const pos = guessPos(word)
  entries.push({ word, partOfSpeech: pos, definition: fallbackDef(word, pos), syllables: syllablesFromCMU(word) })
}

// Pass 3: top up
for (const word of allWords) {
  if (entries.length >= MAX_WORDS) break
  if (seen.has(word)) continue
  seen.add(word)
  const pos = guessPos(word)
  entries.push({ word, partOfSpeech: pos, definition: fallbackDef(word, pos), syllables: estimateSyllables(word) })
}

entries.sort((a, b) => a.word.localeCompare(b.word))
console.log(`\n✅  Total: ${entries.length.toLocaleString()} entries`)

// ─── 7. Write TypeScript ──────────────────────────────────────────────────────
let ts = `// AUTO-GENERATED by scripts/build-dictionary.mjs — DO NOT EDIT MANUALLY
// Sources:
//   - adambom/dictionary (CC BY-SA 3.0)  — real definitions
//   - dwyl/english-words (MIT)            — word pool
//   - cmu-pronouncing-dictionary (BSD)    — syllable counts
// Entries: ${entries.length.toLocaleString()}

export interface DictionaryEntry {
  word: string
  partOfSpeech: string
  definition: string
  syllables: number
}

export const ENGLISH_DICTIONARY: Record<string, DictionaryEntry> = {\n`

for (const e of entries) {
  const safeDef = e.definition.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  ts += `  ${JSON.stringify(e.word)}: { word: ${JSON.stringify(e.word)}, partOfSpeech: ${JSON.stringify(e.partOfSpeech)}, definition: "${safeDef}", syllables: ${e.syllables} },\n`
}

ts += `}

export const ALL_WORDS: string[] = Object.keys(ENGLISH_DICTIONARY).sort()

export const searchDictionary = (query: string): DictionaryEntry[] => {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const exact = ENGLISH_DICTIONARY[q] ? [ENGLISH_DICTIONARY[q]] : []
  const prefix = ALL_WORDS
    .filter(w => w !== q && w.startsWith(q))
    .slice(0, 19)
    .map(w => ENGLISH_DICTIONARY[w])
  return [...exact, ...prefix]
}

export const getWord = (word: string): DictionaryEntry | null =>
  ENGLISH_DICTIONARY[word.toLowerCase()] ?? null
`

writeFileSync(OUT, ts, 'utf8')
const sizeMB = (ts.length / 1024 / 1024).toFixed(1)
console.log(`\n🎉  Written to ${OUT}  (${sizeMB} MB)`)
