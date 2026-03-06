import { useState, useCallback, useRef } from 'react'
import {
  Music, BookOpen, PenTool, Search,
  Copy, Check, Sparkles, AlignLeft,
  BarChart3, Volume2, BookMarked
} from 'lucide-react'
import { dictionary } from 'cmu-pronouncing-dictionary'
import { syllable } from 'syllable'
import { ENGLISH_DICTIONARY, searchDictionary, type DictionaryEntry } from './dictionary-data'
import './App.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type TabType = 'rhymes' | 'syllables' | 'thesaurus' | 'dictionary' | 'workshop'

interface RhymeResult {
  perfect: string[]
  near: string[]
  slant: string[]
}

interface ThesaurusEntry {
  common: string[]
  poetic: string[]
  vivid: string[]
  archaic: string[]
}

// ─── Thesaurus data (module-level — never re-created) ─────────────────────────
const THESAURUS_DB: Record<string, ThesaurusEntry> = {
  sad: { common: ['unhappy', 'sorrowful', 'dejected', 'melancholy', 'gloomy'], poetic: ['forlorn', 'woebegone', 'lachrymose', 'dolorous', 'plaintive'], vivid: ['tear-stained', 'heavy-hearted', 'shadow-cast', 'soul-weary', 'grief-burdened'], archaic: ['wan', 'doleful', 'rueful', 'wan-faced', 'heavy of heart'] },
  happy: { common: ['joyful', 'cheerful', 'content', 'delighted', 'pleased'], poetic: ['blissful', 'elated', 'jubilant', 'rapturous', 'exultant'], vivid: ['sun-bright', 'heart-light', 'dancing', 'radiant', 'golden'], archaic: ['gay', 'merry', 'light of heart', 'in good cheer', 'buoyant'] },
  dark: { common: ['dim', 'shadowy', 'gloomy', 'murky', 'obscure'], poetic: ['tenebrous', 'stygian', 'crepuscular', 'light-forsaken', 'umbral'], vivid: ['pitch-black', 'starless', 'soul-dark', 'midnight-haunted', 'void-deep'], archaic: ['sable', 'ebon', 'waning', 'dusk-shrouded', 'night-bound'] },
  love: { common: ['affection', 'devotion', 'adoration', 'fondness', 'tenderness'], poetic: ['amour', 'ardor', 'rapture', 'enchantment', 'besottedness'], vivid: ['heart-flame', 'soul-binding', 'star-crossed', 'deep-rooted', 'eternal'], archaic: ['courtship', 'wooing', 'heart-thralldom', 'love-sickness', 'passion'] },
  beautiful: { common: ['pretty', 'lovely', 'attractive', 'gorgeous', 'stunning'], poetic: ['ethereal', 'radiant', 'sublime', 'resplendent', 'enchanting'], vivid: ['breathtaking', 'soul-stirring', 'light-kissed', 'dream-woven', 'heart-stopping'], archaic: ['fair', 'comely', 'beauteous', 'lovely to behold', 'graceful'] },
  night: { common: ['evening', 'darkness', 'twilight', 'dusk', 'midnight'], poetic: ['nocturne', 'gloaming', 'witching hour', 'dead of night', 'moonlit hours'], vivid: ['star-crowned', 'shadow-veiled', 'dream-draped', 'silence-wrapped', 'owl-haunted'], archaic: ['eve', 'nighttide', 'darkling hours', 'nightfall', 'black of night'] },
  walk: { common: ['stroll', 'amble', 'wander', 'stride', 'pace'], poetic: ['saunter', 'meander', 'promenade', 'perambulate', 'tread'], vivid: ['foot-fall', 'path-winding', 'leaf-crunching', 'dawn-breaking', 'slow-drifting'], archaic: ['peregrinate', 'go afoot', 'take the air', 'perambulation', 'tramp'] },
  water: { common: ['liquid', 'aqua', 'moisture', 'fluid', 'wetness'], poetic: ['brine', 'deep', 'main', 'billow', 'tide'], vivid: ['silver-stream', 'crystal-cascade', 'wave-whispered', 'foam-kissed', 'river-winding'], archaic: ['element', 'humour', 'watery realm', 'briny deep', 'aqua vitae'] },
  light: { common: ['brightness', 'illumination', 'radiance', 'glow', 'shine'], poetic: ['luminosity', 'effulgence', 'refulgence', 'incandescence', 'phosphorescence'], vivid: ['sun-gold', 'dawn-break', 'star-dust', 'flame-bright', 'soul-illuminating'], archaic: ['lustre', 'sheen', 'daylight', 'candle-glow', 'heavenly radiance'] },
  wind: { common: ['breeze', 'gale', 'gust', 'air', 'zephyr'], poetic: ['tempest', 'squall', 'whisper', 'sigh', 'breath'], vivid: ['leaf-rustling', 'hair-tousling', 'cloud-chasing', 'song-singing', 'wild-roaming'], archaic: ['aeolus', 'boreas', 'zephyrus', 'gale-force', 'whistling air'] },
  old: { common: ['aged', 'elderly', 'ancient', 'mature', 'senior'], poetic: ['venerable', 'time-worn', 'antiquated', 'hoary', 'patriarchal'], vivid: ['silver-haired', 'wrinkle-etched', 'memory-rich', 'wisdom-keeping', 'century-marked'], archaic: ['greybeard', 'ancient', 'of yore', 'long in the tooth', 'seasoned'] },
  cold: { common: ['chilly', 'frigid', 'freezing', 'icy', 'cool'], poetic: ['gelid', 'glacial', 'wintry', 'frost-bound', 'arctic'], vivid: ['bone-chilling', 'breath-misting', 'frost-nipped', 'shiver-inducing', 'winter-bitten'], archaic: ['raw', 'bleak', 'biting', 'nipping', 'frore'] },
  red: { common: ['crimson', 'scarlet', 'maroon', 'ruby', 'cherry'], poetic: ['vermilion', 'gules', 'carmine', 'sanguine', 'ruddy'], vivid: ['blood-bright', 'fire-hot', 'rose-deep', 'sunset-stained', 'heart-beat'], archaic: ['ruddy', 'rosy', 'florid', 'sanguineous', 'incarnadine'] },
  white: { common: ['pale', 'snowy', 'ivory', 'cream', 'milky'], poetic: ['alabaster', 'argent', 'pearly', 'hoary', 'candid'], vivid: ['moon-glow', 'cloud-soft', 'star-pale', 'swan-down', 'frost-pure'], archaic: ['fair', 'snow-white', 'milky-white', 'argent', 'crystal'] },
  sky: { common: ['heavens', 'firmament', 'atmosphere', 'space', 'air'], poetic: ['welkin', 'empyrean', 'azure', 'celestial sphere', 'vault of heaven'], vivid: ['cloud-canvas', 'star-field', 'blue-expanse', 'sun-throne', 'bird-domain'], archaic: ['heaven', 'firmament', 'vault', 'canopy', 'celestial dome'] },
  time: { common: ['period', 'duration', 'moment', 'era', 'age'], poetic: ['tempus', 'chronos', 'eon', 'epoch', 'span'], vivid: ['sand-falling', 'clock-ticking', 'sun-cycling', 'season-turning', 'life-measuring'], archaic: ['hour', 'tide', 'season', 'while', 'space'] },
  die: { common: ['perish', 'expire', 'pass away', 'decease', 'succumb'], poetic: ['demise', 'depart', 'cross over', "meet one's end", "breathe one's last"], vivid: ['light-fading', 'breath-stilling', 'soul-releasing', 'shadow-falling', 'final-sleep'], archaic: ['perish', 'yield the ghost', 'go the way of all flesh', 'pay the debt of nature', 'join the majority'] },
  fire: { common: ['flame', 'blaze', 'inferno', 'conflagration', 'burning'], poetic: ['pyre', 'ember', 'conflagration', 'holocaust', 'immolation'], vivid: ['crackling', 'devouring', 'dancing', 'roaring', 'all-consuming'], archaic: ['brand', 'hearth-fire', 'element', 'ignis', 'sacred flame'] },
  heart: { common: ['core', 'center', 'soul', 'spirit', 'essence'], poetic: ['bosom', 'breast', 'inmost being', 'seat of feeling', 'cardia'], vivid: ['life-pump', 'blood-chamber', 'emotion-well', 'love-source', 'soul-dwelling'], archaic: ['ticker', 'vital organ', 'inward', 'breast', 'bosom'] },
  dream: { common: ['vision', 'fantasy', 'reverie', 'aspiration', 'hope'], poetic: ['phantasm', 'somnium', 'idle fancy', 'waking dream', 'chimera'], vivid: ['sleep-woven', 'night-born', 'star-sent', 'soul-wandering', 'mind-painting'], archaic: ['slumber-vision', 'fancy', 'revelation', 'prophecy', 'apparition'] },
}

// ─── CMU rhyme groups (module-level — computed once) ──────────────────────────
const findLastIndex = <T,>(arr: T[], predicate: (item: T) => boolean): number => {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return i
  }
  return -1
}

const cmuRhymeGroups = (() => {
  const groups: Map<string, Set<string>> = new Map()
  Object.entries(dictionary).forEach(([word, pronunciation]) => {
    const phonemes = pronunciation.split(' ')
    const lastVowelIndex = findLastIndex(phonemes, (p: string) => /[AEIOU]/.test(p))
    if (lastVowelIndex >= 0) {
      const key = phonemes.slice(lastVowelIndex).join('-')
      if (!groups.has(key)) groups.set(key, new Set())
      groups.get(key)!.add(word.toLowerCase())
    }
  })
  return groups
})()

const levenshtein = (a: string, b: string): number => {
  const dp: number[][] = []
  for (let i = 0; i <= b.length; i++) dp[i] = [i]
  for (let j = 0; j <= a.length; j++) dp[0][j] = j
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      dp[i][j] = b[i - 1] === a[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j])
  return dp[b.length][a.length]
}

// ─── Tab components — defined OUTSIDE App so identity is stable ───────────────

interface RhymeTabProps {
  rhymeInput: string
  setRhymeInput: (v: string) => void
  rhymeResults: RhymeResult
  isSearchingRhymes: boolean
  onFind: () => void
  onCopy: (word: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}
function RhymeTab({ rhymeInput, setRhymeInput, rhymeResults, isSearchingRhymes, onFind, onCopy, inputRef }: RhymeTabProps) {
  return (
    <div className="space-y-6 pb-28">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-ink">Rhyme Finder</h2>
        <p className="font-body text-ink/70 text-sm">Find perfect, near, and slant rhymes</p>
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={rhymeInput}
          onChange={e => setRhymeInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onFind()}
          placeholder="Enter a word..."
          className="poetry-input flex-1"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        />
        <button onClick={onFind} className="poetry-button">
          <Search className="w-5 h-5" />
        </button>
      </div>
      {isSearchingRhymes && <div className="text-center text-ink/60 font-body">Searching...</div>}
      {(rhymeResults.perfect.length > 0 || rhymeResults.near.length > 0 || rhymeResults.slant.length > 0) && (
        <div className="space-y-4 animate-fade-in">
          <div className="ornament">✦</div>
          {rhymeResults.perfect.length > 0 && (
            <div>
              <h3 className="font-display text-sm font-semibold text-sage mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sage" />
                Perfect Rhymes ({rhymeResults.perfect.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {rhymeResults.perfect.map(word => (
                  <button key={word} onClick={() => onCopy(word)} className="poetry-chip poetry-chip-perfect">{word}</button>
                ))}
              </div>
            </div>
          )}
          {rhymeResults.near.length > 0 && (
            <div>
              <h3 className="font-display text-sm font-semibold text-gold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold" />
                Near Rhymes ({rhymeResults.near.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {rhymeResults.near.map(word => (
                  <button key={word} onClick={() => onCopy(word)} className="poetry-chip poetry-chip-near">{word}</button>
                ))}
              </div>
            </div>
          )}
          {rhymeResults.slant.length > 0 && (
            <div>
              <h3 className="font-display text-sm font-semibold text-rust mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rust" />
                Slant Rhymes ({rhymeResults.slant.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {rhymeResults.slant.map(word => (
                  <button key={word} onClick={() => onCopy(word)} className="poetry-chip poetry-chip-slant">{word}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {rhymeInput && !isSearchingRhymes && rhymeResults.perfect.length === 0 && rhymeResults.near.length === 0 && rhymeResults.slant.length === 0 && (
        <div className="text-center text-ink/60 font-body py-8">No rhymes found. Try a different word.</div>
      )}
    </div>
  )
}

interface SyllableTabProps {
  syllableInput: string
  setSyllableInput: (v: string) => void
  syllableCount: number
  syllableBreakdown: { word: string; count: number }[]
  haikuCheck: { isHaiku: boolean; pattern: number[] } | null
  onCount: () => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}
function SyllableTab({ syllableInput, setSyllableInput, syllableCount, syllableBreakdown, haikuCheck, onCount, inputRef }: SyllableTabProps) {
  return (
    <div className="space-y-6 pb-28">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-ink">Syllable Counter</h2>
        <p className="font-body text-ink/70 text-sm">Count syllables in your verses</p>
      </div>
      <textarea
        ref={inputRef}
        value={syllableInput}
        onChange={e => setSyllableInput(e.target.value)}
        placeholder="Type or paste your text here..."
        rows={4}
        className="poetry-input w-full resize-none"
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
      />
      <button onClick={onCount} className="poetry-button w-full">Count Syllables</button>
      {syllableCount > 0 && (
        <div className="animate-fade-in space-y-4">
          <div className="ornament">✦</div>
          <div className="poetry-card text-center">
            <div className="font-display text-5xl font-bold text-gold">{syllableCount}</div>
            <div className="font-body text-ink/70 text-sm mt-1">total syllables</div>
          </div>
          {syllableBreakdown.length > 0 && (
            <div className="poetry-card">
              <h3 className="font-display text-sm font-semibold text-ink mb-3">Word Breakdown</h3>
              <div className="flex flex-wrap gap-2">
                {syllableBreakdown.map(({ word, count }, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-parchment rounded text-sm font-body">
                    <span className="text-ink">{word}</span>
                    <span className="text-gold font-semibold">({count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
          {haikuCheck && (
            <div className={`poetry-card ${haikuCheck.isHaiku ? 'bg-sage/10 border-sage/30' : 'bg-rust/10 border-rust/30'}`}>
              <div className="flex items-center gap-2 mb-2">
                {haikuCheck.isHaiku ? <Check className="w-5 h-5 text-sage" /> : <Sparkles className="w-5 h-5 text-gold" />}
                <h3 className="font-display text-sm font-semibold">
                  {haikuCheck.isHaiku ? 'Valid Haiku!' : 'Not quite a haiku...'}
                </h3>
              </div>
              <p className="font-body text-sm text-ink/70">
                Pattern: {haikuCheck.pattern.join('-')} {haikuCheck.isHaiku ? ' (5-7-5 ✓)' : ' (needs 5-7-5)'}
              </p>
            </div>
          )}
          {syllableCount === 10 && (
            <div className="poetry-card bg-gold/10 border-gold/30">
              <p className="font-body text-sm text-ink/80 text-center">
                <Sparkles className="w-4 h-4 inline mr-1 text-gold" />
                10 syllables — perfect for iambic pentameter!
              </p>
            </div>
          )}
          {syllableCount === 17 && !haikuCheck && (
            <div className="poetry-card bg-gold/10 border-gold/30">
              <p className="font-body text-sm text-ink/80 text-center">
                <Sparkles className="w-4 h-4 inline mr-1 text-gold" />
                17 syllables — potential haiku material!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ThesaurusTabProps {
  thesaurusInput: string
  setThesaurusInput: (v: string) => void
  thesaurusResult: ThesaurusEntry | null
  suggestions: string[]
  onFind: () => void
  onCopy: (word: string) => void
  onSuggestion: (word: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}
function ThesaurusTab({ thesaurusInput, setThesaurusInput, thesaurusResult, suggestions, onFind, onCopy, onSuggestion, inputRef }: ThesaurusTabProps) {
  return (
    <div className="space-y-6 pb-28">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-ink">Poetic Thesaurus</h2>
        <p className="font-body text-ink/70 text-sm">Find words with poetic resonance</p>
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={thesaurusInput}
          onChange={e => setThesaurusInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onFind()}
          placeholder="Enter a word (e.g., love, dark, beautiful)..."
          className="poetry-input flex-1"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        />
        <button onClick={onFind} className="poetry-button">
          <Search className="w-5 h-5" />
        </button>
      </div>
      {thesaurusResult && (
        <div className="animate-fade-in space-y-4">
          <div className="ornament">✦</div>
          {thesaurusResult.common.length > 0 && (
            <div className="poetry-card">
              <h3 className="font-display text-sm font-semibold text-ink mb-2">Common Synonyms</h3>
              <div className="flex flex-wrap gap-2">
                {thesaurusResult.common.map(word => (
                  <button key={word} onClick={() => onCopy(word)} className="poetry-chip bg-mist text-ink border border-gold/20 hover:bg-gold/10">{word}</button>
                ))}
              </div>
            </div>
          )}
          {thesaurusResult.poetic.length > 0 && (
            <div className="poetry-card">
              <h3 className="font-display text-sm font-semibold text-gold mb-2">Poetic & Elevated</h3>
              <div className="flex flex-wrap gap-2">
                {thesaurusResult.poetic.map(word => (
                  <button key={word} onClick={() => onCopy(word)} className="poetry-chip bg-gold/10 text-gold border border-gold/30 hover:bg-gold/20">{word}</button>
                ))}
              </div>
            </div>
          )}
          {thesaurusResult.vivid.length > 0 && (
            <div className="poetry-card">
              <h3 className="font-display text-sm font-semibold text-rust mb-2">Vivid & Imagistic</h3>
              <div className="flex flex-wrap gap-2">
                {thesaurusResult.vivid.map(word => (
                  <button key={word} onClick={() => onCopy(word)} className="poetry-chip bg-rust/10 text-rust border border-rust/30 hover:bg-rust/20">{word}</button>
                ))}
              </div>
            </div>
          )}
          {thesaurusResult.archaic.length > 0 && (
            <div className="poetry-card">
              <h3 className="font-display text-sm font-semibold text-sage mb-2">Archaic & Classical</h3>
              <div className="flex flex-wrap gap-2">
                {thesaurusResult.archaic.map(word => (
                  <button key={word} onClick={() => onCopy(word)} className="poetry-chip bg-sage/10 text-sage border border-sage/30 hover:bg-sage/20">{word}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="poetry-card">
          <h3 className="font-display text-sm font-semibold text-ink mb-2">Did you mean?</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button key={s} onClick={() => onSuggestion(s)} className="poetry-chip bg-mist text-ink border border-gold/20 hover:bg-gold/10">{s}</button>
            ))}
          </div>
        </div>
      )}
      {thesaurusInput && !thesaurusResult && suggestions.length === 0 && (
        <div className="text-center text-ink/60 font-body py-8">
          Word not found. Try: {Object.keys(THESAURUS_DB).slice(0, 8).join(', ')}, ...
        </div>
      )}
    </div>
  )
}

interface DictionaryTabProps {
  dictInput: string
  dictResults: DictionaryEntry[]
  selectedWord: DictionaryEntry | null
  onSearch: () => void
  onSearchChange: (val: string) => void
  onSelect: (entry: DictionaryEntry) => void
  onCopy: (word: string) => void
  inputRef: React.RefObject<HTMLInputElement | null>
}
function DictionaryTab({ dictInput, dictResults, selectedWord, onSearch, onSearchChange, onSelect, onCopy, inputRef }: DictionaryTabProps) {
  return (
    <div className="space-y-6 pb-28">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-ink">Dictionary</h2>
        <p className="font-body text-ink/70 text-sm">Look up word definitions</p>
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={dictInput}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          placeholder="Type to search words..."
          className="poetry-input flex-1"
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
        />
        <button onClick={onSearch} className="poetry-button">
          <Search className="w-5 h-5" />
        </button>
      </div>
      {dictResults.length > 0 && !selectedWord && (
        <div className="poetry-card animate-fade-in">
          <h3 className="font-display text-sm font-semibold text-ink mb-3">Matches ({dictResults.length})</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {dictResults.map(entry => (
              <button key={entry.word} onClick={() => onSelect(entry)} className="w-full text-left px-3 py-2 rounded bg-parchment hover:bg-gold/10 transition-colors">
                <span className="font-display font-semibold text-ink">{entry.word}</span>
                <span className="text-ink/50 text-sm ml-2">({entry.syllables})</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {selectedWord && (
        <div className="poetry-card animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-display text-xl font-bold text-ink">{selectedWord.word}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gold font-body italic">{selectedWord.partOfSpeech}</span>
                <span className="text-sm text-ink/50">• {selectedWord.syllables} syllables</span>
              </div>
            </div>
            <button onClick={() => onCopy(selectedWord.word)} className="p-2 rounded-full hover:bg-gold/10 transition-colors">
              <Copy className="w-5 h-5 text-ink/60" />
            </button>
          </div>
          <p className="font-body text-ink/80 leading-relaxed">{selectedWord.definition}</p>
        </div>
      )}
      {!dictInput && (
        <div className="text-center text-ink/50 font-body text-sm py-8">
          <BookMarked className="w-12 h-12 mx-auto mb-3 text-gold/50" />
          <p>Start typing to search {Object.keys(ENGLISH_DICTIONARY).length.toLocaleString()}+ words</p>
        </div>
      )}
    </div>
  )
}

interface WorkshopTabProps {
  poemInput: string
  setPoemInput: (v: string) => void
  workshopResult: string | null
  workshopMode: 'meter' | 'form' | 'stats' | 'sound'
  setWorkshopMode: (m: 'meter' | 'form' | 'stats' | 'sound') => void
  onAnalyze: () => void
  inputRef: React.RefObject<HTMLTextAreaElement | null>
}
function WorkshopTab({ poemInput, setPoemInput, workshopResult, workshopMode, setWorkshopMode, onAnalyze, inputRef }: WorkshopTabProps) {
  return (
    <div className="space-y-6 pb-28">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-ink">Poem Workshop</h2>
        <p className="font-body text-ink/70 text-sm">Analyze your poetry</p>
      </div>
      <textarea
        ref={inputRef}
        value={poemInput}
        onChange={e => setPoemInput(e.target.value)}
        placeholder="Paste your poem here..."
        rows={6}
        className="poetry-input w-full resize-none"
        autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
      />
      <div className="grid grid-cols-2 gap-2">
        {(['meter', 'form', 'stats', 'sound'] as const).map(mode => (
          <button
            key={mode}
            onClick={() => setWorkshopMode(mode)}
            className={`poetry-button-secondary text-sm py-2 ${workshopMode === mode ? 'bg-ink/10 border-ink/50' : ''}`}
          >
            {mode === 'meter' && <><AlignLeft className="w-4 h-4 inline mr-1" />Meter</>}
            {mode === 'form' && <><BookOpen className="w-4 h-4 inline mr-1" />Form</>}
            {mode === 'stats' && <><BarChart3 className="w-4 h-4 inline mr-1" />Stats</>}
            {mode === 'sound' && <><Volume2 className="w-4 h-4 inline mr-1" />Sound</>}
          </button>
        ))}
      </div>
      <button onClick={onAnalyze} className="poetry-button w-full">Analyze</button>
      {workshopResult && (
        <div className="animate-fade-in">
          <div className="ornament">✦</div>
          <div className="poetry-card">
            <pre className="font-body text-sm text-ink/80 whitespace-pre-wrap">{workshopResult}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [activeTab, setActiveTab] = useState<TabType>('rhymes')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [rhymeInput, setRhymeInput] = useState('')
  const [rhymeResults, setRhymeResults] = useState<RhymeResult>({ perfect: [], near: [], slant: [] })
  const [isSearchingRhymes, setIsSearchingRhymes] = useState(false)
  const rhymeInputRef = useRef<HTMLInputElement>(null)

  const [syllableInput, setSyllableInput] = useState('')
  const [syllableCount, setSyllableCount] = useState(0)
  const [syllableBreakdown, setSyllableBreakdown] = useState<{ word: string; count: number }[]>([])
  const [haikuCheck, setHaikuCheck] = useState<{ isHaiku: boolean; pattern: number[] } | null>(null)
  const syllableInputRef = useRef<HTMLTextAreaElement>(null)

  const [thesaurusInput, setThesaurusInput] = useState('')
  const [thesaurusResult, setThesaurusResult] = useState<ThesaurusEntry | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const thesaurusInputRef = useRef<HTMLInputElement>(null)

  const [dictInput, setDictInput] = useState('')
  const [dictResults, setDictResults] = useState<DictionaryEntry[]>([])
  const [selectedWord, setSelectedWord] = useState<DictionaryEntry | null>(null)
  const dictInputRef = useRef<HTMLInputElement>(null)

  const [poemInput, setPoemInput] = useState('')
  const [workshopResult, setWorkshopResult] = useState<string | null>(null)
  const [workshopMode, setWorkshopMode] = useState<'meter' | 'form' | 'stats' | 'sound'>('meter')
  const workshopInputRef = useRef<HTMLTextAreaElement>(null)

  const showToast = useCallback((message: string) => {
    setToastMsg(message)
    setTimeout(() => setToastMsg(null), 2000)
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text) } catch { /* fallback */ }
    showToast(`Copied "${text}"`)
  }, [showToast])

  // ── Rhyme finder ────────────────────────────────────────────────────────────
  const findRhymes = useCallback(() => {
    if (!rhymeInput.trim()) return
    setIsSearchingRhymes(true)
    const word = rhymeInput.toLowerCase().trim()
    const pronunciation = dictionary[word] || dictionary[word.charAt(0).toUpperCase() + word.slice(1)]
    const results: RhymeResult = { perfect: [], near: [], slant: [] }

    if (pronunciation) {
      const phonemes = pronunciation.split(' ')
      const lastVowelIndex = findLastIndex(phonemes, (p: string) => /[AEIOU]/.test(p))
      const rhymeKey = phonemes.slice(lastVowelIndex).join('-')
      const perfectMatches = cmuRhymeGroups.get(rhymeKey)
      if (perfectMatches) {
        results.perfect = Array.from(perfectMatches).filter(w => w !== word && w !== word + '(1)').slice(0, 30)
      }
      cmuRhymeGroups.forEach((words, key) => {
        if (key !== rhymeKey) {
          const similarity = key.split('-').filter(p => rhymeKey.includes(p)).length
          if (similarity > 0) {
            words.forEach(w => {
              if (w !== word && !results.perfect.includes(w) && !results.near.includes(w)) results.near.push(w)
            })
          }
        }
      })
      results.near = results.near.slice(0, 20)
      const ending = word.slice(-3)
      Object.keys(dictionary).forEach(dictWord => {
        const lw = dictWord.toLowerCase()
        if (lw !== word && lw.endsWith(ending) && !results.perfect.includes(lw) && !results.near.includes(lw) && !results.slant.includes(lw))
          results.slant.push(lw)
      })
      results.slant = results.slant.slice(0, 20)
    } else {
      const e3 = word.slice(-3), e2 = word.slice(-2)
      Object.keys(dictionary).forEach(dictWord => {
        const lw = dictWord.toLowerCase()
        if (lw !== word) {
          if (lw.slice(-3) === e3 && !results.perfect.includes(lw)) results.perfect.push(lw)
          else if (lw.slice(-2) === e2 && !results.near.includes(lw)) results.near.push(lw)
          else if (lw.slice(-1) === word.slice(-1) && !results.slant.includes(lw)) results.slant.push(lw)
        }
      })
      results.perfect = results.perfect.slice(0, 15)
      results.near = results.near.slice(0, 15)
      results.slant = results.slant.slice(0, 15)
    }
    setRhymeResults(results)
    setIsSearchingRhymes(false)
  }, [rhymeInput])

  // ── Syllable counter ────────────────────────────────────────────────────────
  const countSyllables = useCallback(() => {
    if (!syllableInput.trim()) return
    const words = syllableInput.trim().split(/\s+/)
    const breakdown: { word: string; count: number }[] = []
    let total = 0
    words.forEach(word => {
      const clean = word.replace(/[^a-zA-Z]/g, '')
      if (clean) { const count = syllable(clean); breakdown.push({ word: clean, count }); total += count }
    })
    setSyllableCount(total)
    setSyllableBreakdown(breakdown)
    const lines = syllableInput.split(/\n/)
    if (lines.length === 3) {
      const pattern = lines.map(line => line.trim().split(/\s+/).reduce((sum, w) => sum + syllable(w.replace(/[^a-zA-Z]/g, '')), 0))
      setHaikuCheck({ isHaiku: pattern[0] === 5 && pattern[1] === 7 && pattern[2] === 5, pattern })
    } else {
      setHaikuCheck(null)
    }
  }, [syllableInput])

  // ── Thesaurus ───────────────────────────────────────────────────────────────
  const findSynonyms = useCallback(() => {
    const word = thesaurusInput.toLowerCase().trim()
    if (!word) return
    const result = THESAURUS_DB[word]
    if (result) { setThesaurusResult(result); setSuggestions([]) }
    else {
      setThesaurusResult(null)
      setSuggestions(
        Object.keys(THESAURUS_DB)
          .map(key => ({ key, distance: levenshtein(word, key) }))
          .filter(item => item.distance <= 2)
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5)
          .map(item => item.key)
      )
    }
  }, [thesaurusInput])

  const handleSuggestion = useCallback((word: string) => {
    setThesaurusInput(word)
    setThesaurusResult(THESAURUS_DB[word])
    setSuggestions([])
  }, [])

  // ── Dictionary ──────────────────────────────────────────────────────────────
  const searchDict = useCallback(() => {
    if (!dictInput.trim()) { setDictResults([]); return }
    setDictResults(searchDictionary(dictInput))
  }, [dictInput])

  const handleDictChange = useCallback((val: string) => {
    setDictInput(val)
    setSelectedWord(null)
    if (val.length >= 2) setDictResults(searchDictionary(val))
    else setDictResults([])
  }, [])

  const selectWord = useCallback((entry: DictionaryEntry) => {
    setSelectedWord(entry)
    setDictInput(entry.word)
    setDictResults([])
  }, [])

  // ── Workshop ────────────────────────────────────────────────────────────────
  const analyzePoem = useCallback(() => {
    if (!poemInput.trim()) return
    const lines = poemInput.split(/\n/).filter(l => l.trim())
    switch (workshopMode) {
      case 'meter': {
        let result = '**Meter Analysis**\n\n'
        lines.forEach((line, i) => {
          const words = line.trim().split(/\s+/)
          let pattern = ''
          words.forEach(word => {
            const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
            if (clean) {
              const count = syllable(clean)
              if (count === 1) pattern += '∪ '
              else if (count === 2) pattern += '∪ / '
              else pattern += '∪ / / '.repeat(Math.ceil(count / 2)).slice(0, count * 2 - 1)
            }
          })
          result += `Line ${i + 1}: ${pattern.trim()}\n`
        })
        setWorkshopResult(result)
        break
      }
      case 'form': {
        const n = lines.length
        let form = 'Free Verse'
        if (n === 14) form = 'Sonnet (14 lines)'
        else if (n === 3) form = 'Tercet / Potential Haiku'
        else if (n === 4) form = 'Quatrain'
        else if (n === 5) form = 'Cinquain'
        else if (n === 19) form = 'Villanelle'
        setWorkshopResult(`**Form Detection**\n\nLines: ${n}\nDetected Form: ${form}\n\n*Based on line count. Further analysis would examine rhyme scheme and meter.*`)
        break
      }
      case 'stats': {
        const totalWords = poemInput.trim().split(/\s+/).length
        const totalSyllables = poemInput.trim().split(/\s+/).reduce((sum, w) => sum + syllable(w.replace(/[^a-zA-Z]/g, '')), 0)
        let result = `**Line Statistics**\n\nTotal Words: ${totalWords}\nTotal Syllables: ${totalSyllables}\nLines: ${lines.length}\nAvg Words/Line: ${(totalWords / lines.length).toFixed(1)}\n\n`
        lines.forEach((line, i) => {
          const words = line.trim().split(/\s+/)
          const syls = words.reduce((sum, w) => sum + syllable(w.replace(/[^a-zA-Z]/g, '')), 0)
          result += `Line ${i + 1}: ${words.length} words, ${syls} syllables\n`
        })
        setWorkshopResult(result)
        break
      }
      case 'sound': {
        const text = poemInput.toLowerCase()
        const words = text.match(/[a-z]+/g) || []
        const initialSounds: Record<string, string[]> = {}
        words.forEach(word => {
          const init = word.charAt(0)
          if (!initialSounds[init]) initialSounds[init] = []
          initialSounds[init].push(word)
        })
        const alliteration = Object.entries(initialSounds).filter(([, ws]) => ws.length >= 2).map(([s, ws]) => `${s.toUpperCase()}: ${[...new Set(ws)].join(', ')}`)
        const wordCounts: Record<string, number> = {}
        words.forEach(w => { if (w.length > 3) wordCounts[w] = (wordCounts[w] || 0) + 1 })
        const repetitions = Object.entries(wordCounts).filter(([, c]) => c > 1).map(([w, c]) => `"${w}" (${c}x)`)
        let result = '**Sound Devices**\n\n'
        if (alliteration.length > 0) result += '🎵 Alliteration:\n' + alliteration.join('\n') + '\n\n'
        if (repetitions.length > 0) result += '🔄 Repetition:\n' + repetitions.join(', ')
        if (!alliteration.length && !repetitions.length) result += 'No prominent sound devices detected.'
        setWorkshopResult(result)
        break
      }
    }
  }, [poemInput, workshopMode])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 bg-parchment/95 backdrop-blur-md border-b border-gold/20 safe-area-pt">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-ink">Poetry Assistant</h1>
              <p className="font-body text-xs text-ink/60">Offline Tools for Verse</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-ink flex items-center justify-center">
              <PenTool className="w-5 h-5 text-parchment" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 scroll-container">
        {activeTab === 'rhymes' && (
          <RhymeTab
            rhymeInput={rhymeInput} setRhymeInput={setRhymeInput}
            rhymeResults={rhymeResults} isSearchingRhymes={isSearchingRhymes}
            onFind={findRhymes} onCopy={copyToClipboard} inputRef={rhymeInputRef}
          />
        )}
        {activeTab === 'syllables' && (
          <SyllableTab
            syllableInput={syllableInput} setSyllableInput={setSyllableInput}
            syllableCount={syllableCount} syllableBreakdown={syllableBreakdown}
            haikuCheck={haikuCheck} onCount={countSyllables} inputRef={syllableInputRef}
          />
        )}
        {activeTab === 'thesaurus' && (
          <ThesaurusTab
            thesaurusInput={thesaurusInput} setThesaurusInput={setThesaurusInput}
            thesaurusResult={thesaurusResult} suggestions={suggestions}
            onFind={findSynonyms} onCopy={copyToClipboard}
            onSuggestion={handleSuggestion} inputRef={thesaurusInputRef}
          />
        )}
        {activeTab === 'dictionary' && (
          <DictionaryTab
            dictInput={dictInput}
            dictResults={dictResults} selectedWord={selectedWord}
            onSearch={searchDict} onSearchChange={handleDictChange}
            onSelect={selectWord} onCopy={copyToClipboard} inputRef={dictInputRef}
          />
        )}
        {activeTab === 'workshop' && (
          <WorkshopTab
            poemInput={poemInput} setPoemInput={setPoemInput}
            workshopResult={workshopResult} workshopMode={workshopMode}
            setWorkshopMode={setWorkshopMode} onAnalyze={analyzePoem}
            inputRef={workshopInputRef}
          />
        )}
      </main>

      <nav className="tab-nav safe-area-pb">
        {(['rhymes', 'syllables', 'thesaurus', 'dictionary', 'workshop'] as TabType[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
            {tab === 'rhymes' && <Music className="w-5 h-5 tab-icon" />}
            {tab === 'syllables' && <BarChart3 className="w-5 h-5 tab-icon" />}
            {tab === 'thesaurus' && <BookOpen className="w-5 h-5 tab-icon" />}
            {tab === 'dictionary' && <BookMarked className="w-5 h-5 tab-icon" />}
            {tab === 'workshop' && <PenTool className="w-5 h-5 tab-icon" />}
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
          </button>
        ))}
      </nav>

      {toastMsg && (
        <div className="toast flex items-center gap-2">
          <Copy className="w-4 h-4" />
          {toastMsg}
        </div>
      )}
    </div>
  )
}

export default App
