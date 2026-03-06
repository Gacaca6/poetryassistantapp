import { DB } from "@/data/poetryDB";

// ── RHYME FINDING ──

export function findRhymesForWord(word: string) {
  word = word.toLowerCase().replace(/[^a-z']/g, "");
  if (!word) return null;

  let sourceGroup: string | null = null;
  for (const [key, words] of Object.entries(DB.rhymes)) {
    if ((words as string[]).includes(word)) {
      sourceGroup = key;
      break;
    }
  }

  if (sourceGroup) {
    const perfects = (DB.rhymes[sourceGroup as keyof typeof DB.rhymes] as string[]).filter((w) => w !== word);
    const nearby = findNearRhymes(word, sourceGroup, [...perfects]);
    return { word, perfect: [...perfects], near: nearby.near, slant: nearby.slant };
  }

  const heuristic = heuristicRhymes(word);
  if (heuristic.perfect.length + heuristic.near.length + heuristic.slant.length === 0) {
    return null;
  }
  return { word, ...heuristic };
}

function findNearRhymes(word: string, sourceKey: string, perfects: string[]) {
  const ending2 = word.slice(-2);
  const ending3 = word.slice(-3);
  const near: string[] = [];
  const slant: string[] = [];
  const perfectSet = new Set(perfects);
  perfectSet.add(word);

  for (const [key, words] of Object.entries(DB.rhymes)) {
    if (key === sourceKey) continue;
    for (const w of words) {
      if (perfectSet.has(w)) continue;
      if (w.slice(-3) === ending3) near.push(w);
      else if (w.slice(-2) === ending2) slant.push(w);
    }
  }
  return { near: [...new Set(near)].slice(0, 12), slant: [...new Set(slant)].slice(0, 10) };
}

function heuristicRhymes(word: string) {
  const ends = [word.slice(-4), word.slice(-3), word.slice(-2)];
  const perfect: string[] = [];
  const near: string[] = [];
  const slant: string[] = [];

  for (const words of Object.values(DB.rhymes)) {
    for (const w of words) {
      if (w === word) continue;
      if (w.endsWith(ends[0])) perfect.push(w);
      else if (w.endsWith(ends[1])) near.push(w);
      else if (w.endsWith(ends[2])) slant.push(w);
    }
  }
  return {
    perfect: [...new Set(perfect)].slice(0, 10),
    near: [...new Set(near)].slice(0, 10),
    slant: [...new Set(slant)].slice(0, 8),
  };
}

// ── SYLLABLE COUNTING ──

export function countSyllablesInWord(word: string): { count: number; breakdown: string[] } {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return { count: 0, breakdown: [] };

  const hasTrailingE = word.endsWith("e") && word.length > 2;
  const vowels = "aeiouy";
  const pairs = DB.syllableRules.vowel_pairs;

  let syllableCount = 0;
  let i = 0;

  while (i < word.length) {
    const pair = word.slice(i, i + 2);
    if ((pairs as string[]).includes(pair)) {
      syllableCount++;
      i += 2;
    } else if (vowels.includes(word[i])) {
      syllableCount++;
      i++;
    } else {
      i++;
    }
  }

  if (hasTrailingE && syllableCount > 1) syllableCount--;
  if (syllableCount === 0) syllableCount = 1;

  const breakdown = buildBreakdown(word);
  return { count: syllableCount, breakdown };
}

function buildBreakdown(word: string): string[] {
  const vowels = "aeiouy";
  const pairs = DB.syllableRules.vowel_pairs;
  const parts: string[] = [];
  let buf = "";
  let i = 0;

  while (i < word.length) {
    const pair = word.slice(i, i + 2);
    if ((pairs as string[]).includes(pair)) {
      buf += pair;
      i += 2;
    } else {
      buf += word[i];
      i++;
    }

    if (buf.length >= 2) {
      const last = buf.slice(-1);
      const penult = buf.slice(-2, -1);
      if (vowels.includes(penult) && !vowels.includes(last) && i < word.length && vowels.includes(word[i])) {
        parts.push(buf);
        buf = "";
      }
    }
  }
  if (buf) parts.push(buf);
  if (parts.length > 1 && parts[parts.length - 1] === "e") {
    parts[parts.length - 2] += "e";
    parts.pop();
  }
  return parts.length > 0 ? parts : [word];
}

// ── THESAURUS ──

export function findSynonyms(raw: string) {
  raw = raw.toLowerCase().trim();
  const thesaurus = DB.thesaurus as Record<string, { common: string[]; poetic: string[]; vivid: string[]; archaic: string[] }>;

  if (thesaurus[raw]) return { word: raw, groups: thesaurus[raw] };

  const keys = Object.keys(thesaurus);
  const match = keys.find((k) => k.startsWith(raw) || raw.startsWith(k) || levenshtein(k, raw) <= 2);
  if (match) return { word: match, groups: thesaurus[match] };

  return { word: raw, groups: null, suggestions: keys };
}

function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

// ── WORKSHOP: METER ──

export function analyzeMeter(poem: string) {
  const lines = poem.split("\n").filter((l) => l.trim());
  const results = lines.map((line) => {
    const words = line.match(/[a-zA-Z']+/g) || [];
    let count = 0;
    const markedWords = words.map((w) => {
      const res = countSyllablesInWord(w);
      count += res.count;
      if (res.count === 1) {
        const isContent = w.length >= 4 || /^(I|'ve|'d|'ll)$/i.test(w);
        return { text: w, stressed: isContent };
      }
      return {
        parts: res.breakdown.map((p, i) => ({ text: p, stressed: i % 2 === 0 })),
      };
    });
    return { line, count, markedWords, pattern: guessPattern(count) };
  });

  const lineSyls = results.map((r) => r.count);
  const avgSyl = lineSyls.reduce((a, b) => a + b, 0) / lineSyls.length;
  const form = guessMeterForm(lineSyls, avgSyl);

  return { results, form };
}

function guessPattern(syllables: number): string {
  const map: Record<number, string> = {
    2: "u/", 4: "u/u/", 6: "u/u/u/", 8: "u/u/u/u/",
    10: "u/u/u/u/u/", 12: "u/u/u/u/u/u/", 5: "/uu/u", 7: "/uu/uu/", 9: "u/u/u/uu/",
  };
  return map[syllables] || (syllables <= 3 ? "u/u".slice(0, syllables) : "u/".repeat(Math.ceil(syllables / 2)).slice(0, syllables));
}

function guessMeterForm(lineSyls: number[], avg: number) {
  if (lineSyls.every((s) => s === 10)) return { name: "Iambic Pentameter", desc: "Ten syllables per line — the heartbeat of English verse (Shakespeare, Milton)" };
  if (lineSyls.every((s) => s === 8)) return { name: "Iambic Tetrameter", desc: "Eight syllables per line — swift and musical (Marvell, Blake)" };
  if (lineSyls.every((s) => s === 12)) return { name: "Alexandrine / Hexameter", desc: "Twelve syllables per line — stately and expansive (French classical verse)" };
  if (lineSyls.length === 3 && lineSyls[0] <= 6 && lineSyls[1] <= 8 && lineSyls[2] <= 6) return { name: "Haiku / Short Form", desc: "Three-line compressed verse" };
  if (avg >= 9 && avg <= 11) return { name: "Near Iambic Pentameter", desc: "Approaching ten syllables per line — close to classical form" };
  if (avg >= 7 && avg <= 8.5) return { name: "Iambic Tetrameter (approx)", desc: "Eight-syllable lines — strong rhythmic movement" };
  return { name: "Free Verse", desc: "Irregular line lengths — liberated from strict metrical constraint" };
}

// ── WORKSHOP: FORM ──

export function identifyForm(poem: string) {
  const lines = poem.split("\n").filter((l) => l.trim());
  const n = lines.length;
  const rhymeScheme = detectRhymeScheme(lines);
  const features = [`Lines: ${n}`, `Rhyme scheme: ${rhymeScheme || "none detected"}`];

  let form: string, desc: string;

  if (n === 14) {
    form = "Sonnet (14 lines)";
    desc = rhymeScheme.includes("ABAB") ? "Shakespearean sonnet structure detected (ABAB CDCD EFEF GG)" : "Petrarchan or other sonnet form";
  } else if (n === 3) {
    const syls = lines.map((l) => {
      const ws: string[] = l.match(/[a-zA-Z']+/g) ?? [];
      return ws.reduce((s, w) => s + countSyllablesInWord(w).count, 0);
    });
    if (syls[0] === 5 && syls[1] === 7 && syls[2] === 5) {
      form = "Haiku"; desc = "Perfect 5-7-5 syllable structure.";
    } else {
      form = "Tercet"; desc = "Three-line stanza form.";
    }
  } else if (n === 4) {
    form = "Quatrain"; desc = "Four-line stanza — most common unit in English poetry.";
  } else if (n === 8) {
    form = "Octave"; desc = "Eight lines — could be ottava rima or two quatrains.";
  } else if (n === 19) {
    form = "Villanelle"; desc = "19 lines with two refrains — complex repeating form (e.g. Do Not Go Gentle).";
  } else if (n <= 6) {
    form = "Short lyric"; desc = "Compact lyric form.";
  } else if (n % 4 === 0) {
    form = "Ballad / Quatrain stanzas"; desc = "Even quatrain structure — common in ballad and hymn forms.";
  } else {
    form = "Free verse"; desc = "No strict recurring stanza form detected.";
  }

  return { form, desc, features, rhymeScheme };
}

function detectRhymeScheme(lines: string[]): string {
  const endings = lines.map((l) => {
    const m = l.match(/[a-zA-Z]+[^a-zA-Z]*$/);
    return m ? m[0].replace(/[^a-zA-Z]/g, "").toLowerCase() : "";
  });
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const map: Record<string, string> = {};
  let idx = 0;
  const scheme = endings.map((e) => {
    if (!e) return "?";
    for (const [letter, rep] of Object.entries(map)) {
      if (e === rep || rhymeScore(e, rep) > 0.6) return letter;
    }
    const letter = letters[idx++ % 26];
    map[letter] = e;
    return letter;
  });
  return scheme.join("").toUpperCase();
}

function rhymeScore(a: string, b: string): number {
  if (a === b) return 1;
  const minLen = Math.min(a.length, b.length);
  let shared = 0;
  for (let i = 1; i <= minLen; i++) {
    if (a.slice(-i) === b.slice(-i)) shared = i;
    else break;
  }
  return shared / Math.max(a.length, b.length);
}

// ── WORKSHOP: LINE STATS ──

export function getLineStats(poem: string) {
  const lines = poem.split("\n").filter((l) => l.trim());
  const allWords: string[] = poem.match(/[a-zA-Z']+/g) ?? [];
  const wordCounts = lines.map((l) => (l.match(/[a-zA-Z']+/g) ?? []).length);
  const sylCounts = lines.map((l) => {
    const ws: string[] = l.match(/[a-zA-Z']+/g) ?? [];
    return ws.reduce((s, w) => s + countSyllablesInWord(w).count, 0);
  });

  const totalSyls = sylCounts.reduce((a, b) => a + b, 0);
  const unique = new Set(allWords.map((w) => w.toLowerCase()));

  return {
    lineCount: lines.length,
    totalWords: allWords.length,
    totalSyls,
    uniqueWords: unique.size,
    avgWordsPerLine: (wordCounts.reduce((a: number, b: number) => a + b, 0) / lines.length).toFixed(1),
    avgSylsPerLine: (Number(totalSyls) / lines.length).toFixed(1),
    lexicalDensity: ((unique.size / allWords.length) * 100).toFixed(0),
    sylsPerWord: (Number(totalSyls) / allWords.length).toFixed(1),
    lines: lines.map((l, i) => ({ text: l, syllables: sylCounts[i] })),
  };
}

// ── WORKSHOP: SOUND DEVICES ──

export function detectSoundDevices(poem: string) {
  const text = poem.toLowerCase();
  const words = text.match(/[a-z']+/g) || [];

  // Alliteration
  const allit: string[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i][0] === words[i + 1][0] && /[a-z]/.test(words[i][0])) {
      allit.push(words[i] + " " + words[i + 1]);
    }
  }

  // Assonance
  const vowelGroups: Record<string, number> = {};
  words.forEach((w) => {
    const v = w.replace(/[^aeiou]/g, "");
    if (v.length >= 2) vowelGroups[v] = (vowelGroups[v] || 0) + 1;
  });
  const assonance = Object.entries(vowelGroups)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v, c]) => `"${v}" ×${c}`);

  // Consonance
  const consGroups: Record<string, number> = {};
  words.forEach((w) => {
    const last = w.slice(-2);
    if (/[^aeiou][^aeiou]/.test(last)) consGroups[last] = (consGroups[last] || 0) + 1;
  });
  const consonance = Object.entries(consGroups)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([v, c]) => `"${v}" ×${c}`);

  // Repetition
  const stopWords = new Set(["the","a","an","and","or","but","of","in","to","for","is","was","are","be","it","i","my","me","you","he","she","we","they","that","this","with","on","at","by","as","his","her","its","your","our"]);
  const wordFreq: Record<string, number> = {};
  words.forEach((w) => { if (!stopWords.has(w) && w.length > 2) wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const repeated = Object.entries(wordFreq)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w, c]) => `"${w}" ×${c}`);

  return {
    alliteration: [...new Set(allit)].slice(0, 6),
    assonance,
    consonance,
    repeated,
  };
}
