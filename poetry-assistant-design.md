# Poetry Assistant — Design Document

## Overview

**Poetry Assistant** is a fully offline, single-file HTML application for poets. It requires no internet connection, no API key, and no installation — just open the HTML file in any browser. All data is embedded directly in the file.

---

## Design Philosophy

### Aesthetic Direction: *Parchment & Ink*

The app evokes the feeling of a handwritten notebook or a well-worn poetry anthology. The visual language is warm, analog, and literary — intentionally avoiding the cold blue-grey palette common in modern apps.

**One line summary:** *A poet's desk in digital form.*

### Core Principles

- **Offline-first.** All data is embedded. No CDN fonts are required to function (they enhance if available).
- **No noise.** Three screens only. Every tool is one tap away.
- **Tactile feel.** Chips, tags, and results feel hand-placed, not grid-locked.
- **Readable typography.** Serif fonts throughout — this is a writing tool.

---

## Visual Design

### Color Palette

| Token         | Hex       | Usage                              |
|---------------|-----------|------------------------------------|
| `--ink`       | `#1a1209` | Primary text, buttons              |
| `--parchment` | `#f5f0e8` | Background, active tab bg          |
| `--gold`      | `#c9973a` | Accents, focus rings, patterns     |
| `--rust`      | `#8b3a2a` | Stressed syllables, form labels, italic headings |
| `--sage`      | `#4a6741` | Perfect rhyme chips                |
| `--mist`      | `#ede8dc` | Card backgrounds, stat tiles       |

Background uses two radial gradients — gold at top-left, rust at bottom-right — for warmth without heaviness.

### Typography

| Role          | Font                        | Style           |
|---------------|-----------------------------|-----------------|
| Display / H1  | Playfair Display            | Bold, 700       |
| Headings      | Playfair Display            | Regular, italic |
| Body / UI     | Crimson Pro                 | Light 300–400   |
| Meter pattern | System monospace            | Small, tracking |

**Fallback stack:** Georgia, serif — the app remains beautiful even without web fonts loaded.

### Spacing & Layout

- Max content width: `780px`, centered
- Base padding: `1rem` horizontal, `1.2rem` top on main
- Border radius: `6px` inputs/buttons, `8px` result cards, `20px` chips
- All touch targets ≥ 44px tall

---

## Screen Architecture

### Three-Screen Model

```
┌─────────────────────────────┐
│         HEADER              │  Fixed, ~80px
├─────────────────────────────┤
│                             │
│         MAIN AREA           │  Scrollable, flex-grow
│     (active screen only)    │
│                             │
├─────────────────────────────┤
│   🎵 Words │ 📖 Thes │ ✍️  │  Fixed bottom nav
└─────────────────────────────┘
```

Navigation sits at the **bottom** (thumb-friendly on mobile). Active tab uses a rust top-border indicator + italic text — subtle but clear.

---

### Screen 1: Words & Sounds

Two tools stacked vertically, separated by a decorative ornament `— ✦ —`.

**Rhyme Finder**
- Input + Find button in a flex row
- Results rendered as colored chips in three groups:
  - 🟢 **Perfect** (sage green) — same vowel+ending sound
  - 🟡 **Near** (gold) — shared vowel or close ending
  - 🔴 **Slant** (rust) — partial rhyme, consonance
- Chips are tappable to copy the word to clipboard
- Toast notification confirms the copy

**Syllable Counter**
- Input + Count button
- Results show:
  - Large number display (syllable count)
  - Word-by-word breakdown with `·` separators and per-syllable spans underlined in gold
  - Haiku check: if 3 lines detected, validates 5·7·5
  - Hint bar for special counts (10 = iambic pentameter, 17 = potential haiku)

---

### Screen 2: Poetic Thesaurus

Single search → four grouped results:

| Group              | Purpose                                    |
|--------------------|--------------------------------------------|
| Common synonyms    | Direct, everyday replacements              |
| Poetic & elevated  | Literary register, elevated diction        |
| Vivid & imagistic  | Concrete, sensory, metaphor-ready          |
| Archaic & classical | Old English, Latin-root, formal verse      |

Words render as `wtag` tiles — tappable to copy. Fuzzy matching (Levenshtein distance ≤ 2) handles minor misspellings. If no match, shows a list of available words as quick-tap suggestions.

**Current thesaurus covers:** sad, happy, dark, love, beautiful, night, walk, water, light, wind, old, cold, red, white, sky, time, die (17 entries, ~500 words).

---

### Screen 3: Poem Workshop

Four offline analysis tools accessible via a toolbar of ghost buttons (no selection required — tap to run instantly).

| Tool          | What it does                                                  |
|---------------|---------------------------------------------------------------|
| **〜 Meter**  | Marks stressed/unstressed syllables per line; guesses meter form |
| **📜 Form**   | Identifies sonnet, haiku, quatrain, villanelle, free verse etc |
| **📐 Line Stats** | Word count, syllable count, lexical density per line       |
| **🎵 Sound Devices** | Detects alliteration, assonance, consonance, repetition |

The poem textarea is always visible; the result area updates below.

---

## Data Architecture

All data is a single embedded JavaScript object `DB` with three keys:

```js
const DB = {
  rhymes: {
    "ay": ["day","way","say",...],   // 34 sound groups, ~670 words
    "oon": ["moon","soon",...],
    // ...
  },
  syllableRules: {
    prefixes: ["un","re","pre",...],
    suffixes: ["ing","ed","er",...],
    vowel_pairs: ["ai","au","ea","ee",...],
    silent_e: true
  },
  thesaurus: {
    "sad": {
      common: [...], poetic: [...], vivid: [...], archaic: [...]
    },
    // 17 entries
  }
}
```

**Data sources:** Modeled on the CMU Pronouncing Dictionary (public domain), WordNet structure (Princeton, public domain use), and classic English poetry wordlists.

**Total embedded data size:** ~14 KB (unminified JSON).

---

## Algorithms

### Rhyme Matching

1. Look up input word in all rhyme groups
2. If found → return group members as **perfect rhymes**; find words in other groups with matching endings as **near/slant**
3. If not found → **heuristic fallback**: match by last 4, 3, 2 characters across all groups

### Syllable Counting

Rule-based algorithm:
1. Scan for vowel groups (pairs treated as one syllable)
2. Count vowel nuclei
3. Subtract 1 for trailing silent `e` (when count > 1)
4. Minimum 1 syllable per word
5. Visual breakdown built by splitting around `vowel + consonant(s) + vowel` boundaries

### Meter Analysis

- Per-word syllable count → spacing heuristics assign stress
- Content words (≥4 chars) → stressed; function words → unstressed
- Multi-syllable words → alternate stress starting from first syllable
- Stress pattern compared to known metrical feet to guess form

### Form Detection

- Line count → known forms (14=sonnet, 3=tercet/haiku, 19=villanelle, 4=quatrain)
- Syllable counts → 5-7-5 = haiku confirmation
- Rhyme scheme extracted by comparing final words using a rhyme-score function (shared suffix length / max length)

### Sound Device Detection

- **Alliteration:** consecutive words sharing initial consonant
- **Assonance:** frequency map of vowel-cluster substrings (≥2 chars) appearing 2+ times
- **Consonance:** frequency map of final 2-consonant clusters
- **Repetition:** non-stopword words appearing 2+ times

---

## File Structure

The app is a **single HTML file** (~48 KB). No dependencies, no build step.

```
poetry-assistant-offline.html
├── <style>          CSS (~8 KB, all inline)
├── <body>           3 panels + nav + toast
└── <script>
    ├── DB           Embedded JSON data (~14 KB)
    ├── Tab logic    switchTab()
    ├── Toast        showToast(), copyWord()
    ├── Rhymes       findRhymes(), renderRhymes(), heuristicRhymes()
    ├── Syllables    countSyllablesInWord(), countSyllables()
    ├── Thesaurus    findSynonyms(), renderThesaurus(), levenshtein()
    └── Workshop     analyzeMeter(), identifyForm(), lineStats(), soundDevices()
```

---

## Extending the App

### Adding More Rhyme Words

Edit the `DB.rhymes` object. Add a new group:
```js
"ight": ["night","light","right","bright", /* add here */]
```

### Adding Thesaurus Entries

```js
DB.thesaurus["fire"] = {
  common: ["flame","blaze","heat","burn"],
  poetic: ["conflagration","inferno","pyre","ember"],
  vivid: ["roaring","devouring","crackling","incandescent"],
  archaic: ["ignis","combustion","brand","hearth-flame"]
}
```

### Switching to a Larger Dataset

To use the full CMU Pronouncing Dictionary (~134K words, public domain):
1. Download from `http://www.speech.cs.cmu.edu/cgi-bin/cmudict`
2. Parse phoneme endings to group words by rime
3. Replace `DB.rhymes` with the generated groups
4. Keep the same API — no other code changes needed

### Adding AI Features (optional)

The original API-powered version can be layered back in. Replace any result box call with a `callAI()` function using Claude, Kimi, or any OpenAI-compatible endpoint. The offline version remains the fallback if no key is present.

---

## Responsive Behavior

| Breakpoint  | Changes                                         |
|-------------|-------------------------------------------------|
| > 780px     | Content max-width centered, generous padding    |
| 480–780px   | Full width, normal sizing                       |
| < 480px     | Smaller tab labels, reduced padding, smaller font sizes |

The app is designed **mobile-first** — bottom navigation, large tap targets, and a single-column layout throughout.

---

## Roadmap (Future Screens / Features)

| Feature                     | Notes                                        |
|-----------------------------|----------------------------------------------|
| Rhyme scheme mapper         | Paste poem → visualize ABAB, ABBA etc        |
| Poetic form templates       | Blank sonnet, villanelle, ghazal scaffold    |
| Export poem as styled PDF   | Print-ready with decorative borders          |
| Extended thesaurus          | Full WordNet-style entries for 500+ words    |
| Line-by-line meter editor   | Click syllables to override stress marks     |
| Dark / Night mode           | Ink-on-black theme for evening writing       |

---

*Built for poets. No cloud, no keys, no noise — just words.*
