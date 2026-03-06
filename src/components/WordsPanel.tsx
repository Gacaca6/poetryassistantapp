import { useState, useCallback } from "react";
import { toast } from "sonner";
import { findRhymesForWord, countSyllablesInWord } from "@/lib/poetryAlgorithms";

export default function WordsPanel() {
  const [rhymeInput, setRhymeInput] = useState("");
  const [syllableInput, setSyllableInput] = useState("");
  const [rhymeResult, setRhymeResult] = useState<ReturnType<typeof findRhymesForWord>>(null);
  const [syllableResult, setSyllableResult] = useState<{
    total: number;
    words: { word: string; count: number; breakdown: string[] }[];
    haikuCheck?: string;
  } | null>(null);

  const copyWord = useCallback((word: string) => {
    navigator.clipboard.writeText(word).catch(() => {});
    toast(`Copied: ${word}`, { duration: 1600 });
  }, []);

  const handleFindRhymes = () => {
    if (!rhymeInput.trim()) return;
    setRhymeResult(findRhymesForWord(rhymeInput.trim()));
  };

  const handleCountSyllables = () => {
    const text = syllableInput.trim();
    if (!text) return;
    const words: string[] = text.match(/[a-zA-Z']+/g) ?? [];
    if (words.length === 0) return;

    let totalCount = 0;
    const wordResults = words.map((w) => {
      const res = countSyllablesInWord(w);
      totalCount += res.count;
      return { word: w, ...res };
    });

    let haikuCheck: string | undefined;
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length === 3) {
      const lineCounts = lines.map((l) => {
        const ws: string[] = l.match(/[a-zA-Z']+/g) ?? [];
        return ws.reduce((s, w) => s + countSyllablesInWord(w).count, 0);
      });
      const isHaiku = lineCounts[0] === 5 && lineCounts[1] === 7 && lineCounts[2] === 5;
      haikuCheck = `Haiku check (5·7·5): ${lineCounts.join(" · ")} — ${isHaiku ? "✓ Perfect haiku!" : "not a haiku"}`;
    } else if (totalCount === 17) {
      haikuCheck = "17 syllables — could be a haiku! (try 3 lines: 5·7·5)";
    } else if (totalCount === 14) {
      haikuCheck = "14 syllables — consider a couplet or partial sonnet line";
    } else if (totalCount === 10) {
      haikuCheck = "10 syllables — fits iambic pentameter";
    }

    setSyllableResult({ total: totalCount, words: wordResults, haikuCheck });
  };

  return (
    <div className="animate-fade-in">
      <p className="font-display text-xl italic mb-1">Words & Sounds</p>
      <p className="text-muted-foreground text-sm mb-4 font-light">Find rhymes and count syllables — no internet needed.</p>

      {/* Rhyme Finder */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Rhyme Finder</p>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input
            type="text"
            className="ink-input flex-1 min-w-[160px]"
            placeholder="Enter a word… e.g. moon"
            value={rhymeInput}
            onChange={(e) => setRhymeInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFindRhymes()}
          />
          <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-display text-sm italic hover:bg-rust transition-colors" onClick={handleFindRhymes}>
            Find
          </button>
        </div>
        <div className="result-box">
          {!rhymeResult ? (
            <span className="text-muted-foreground italic font-light">Rhymes will appear here…</span>
          ) : (
            <div>
              <div className="flex gap-4 mb-3 flex-wrap">
                {rhymeResult.perfect.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-sage inline-block" /> Perfect rhymes
                  </span>
                )}
                {rhymeResult.near.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-gold inline-block" /> Near rhymes
                  </span>
                )}
                {rhymeResult.slant.length > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-rust inline-block" /> Slant rhymes
                  </span>
                )}
              </div>

              {rhymeResult.perfect.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Perfect</div>
                  <div className="flex flex-wrap gap-1.5">
                    {rhymeResult.perfect.map((w) => (
                      <span key={w} className="chip perfect" onClick={() => copyWord(w)}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {rhymeResult.near.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Near</div>
                  <div className="flex flex-wrap gap-1.5">
                    {rhymeResult.near.map((w) => (
                      <span key={w} className="chip near" onClick={() => copyWord(w)}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
              {rhymeResult.slant.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Slant</div>
                  <div className="flex flex-wrap gap-1.5">
                    {rhymeResult.slant.map((w) => (
                      <span key={w} className="chip slant" onClick={() => copyWord(w)}>{w}</span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground italic mt-2">Tap any word to copy it.</p>
            </div>
          )}
        </div>
      </div>

      <div className="ornament">— ✦ —</div>

      {/* Syllable Counter */}
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Syllable Counter</p>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input
            type="text"
            className="ink-input flex-1 min-w-[160px]"
            placeholder="Word or phrase… e.g. beautiful morning"
            value={syllableInput}
            onChange={(e) => setSyllableInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCountSyllables()}
          />
          <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-display text-sm italic hover:bg-rust transition-colors" onClick={handleCountSyllables}>
            Count
          </button>
        </div>
        <div className="result-box">
          {!syllableResult ? (
            <span className="text-muted-foreground italic font-light">Syllable breakdown will appear here…</span>
          ) : (
            <div>
              <div className="text-center text-5xl font-display text-rust font-bold py-2">
                {syllableResult.total} syllable{syllableResult.total !== 1 ? "s" : ""}
              </div>
              {syllableResult.words.map((r, idx) => (
                <div key={idx} className="text-center my-2">
                  {r.breakdown.map((p, i) => (
                    <span key={i}>
                      <span className="inline-block px-1 border-b-2 border-gold text-lg">{p}</span>
                      {i < r.breakdown.length - 1 && <span className="text-gold font-bold mx-0.5">·</span>}
                    </span>
                  ))}
                  <small className="text-muted-foreground text-xs ml-2">({r.count})</small>
                </div>
              ))}
              {syllableResult.haikuCheck && (
                <div className="text-center text-sm text-muted-foreground italic mt-3 pt-3 border-t border-dashed border-input">
                  {syllableResult.haikuCheck}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
