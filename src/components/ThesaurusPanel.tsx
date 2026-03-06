import { useState, useCallback } from "react";
import { toast } from "sonner";
import { findSynonyms } from "@/lib/poetryAlgorithms";

export default function ThesaurusPanel() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ReturnType<typeof findSynonyms> | null>(null);

  const copyWord = useCallback((word: string) => {
    navigator.clipboard.writeText(word).catch(() => {});
    toast(`Copied: ${word}`, { duration: 1600 });
  }, []);

  const handleSearch = () => {
    if (!input.trim()) return;
    setResult(findSynonyms(input.trim()));
  };

  const labels: Record<string, string> = {
    common: "Common synonyms",
    poetic: "Poetic & elevated",
    vivid: "Vivid & imagistic",
    archaic: "Archaic & classical",
  };

  return (
    <div className="animate-fade-in">
      <p className="font-display text-xl italic mb-1">Poetic Thesaurus</p>
      <p className="text-muted-foreground text-sm mb-4 font-light">
        Find evocative synonyms grouped by register and poetic quality.
      </p>

      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          className="ink-input flex-1 min-w-[160px]"
          placeholder="Enter a word… e.g. sad, night, love"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-display text-sm italic hover:bg-rust transition-colors" onClick={handleSearch}>
          Search
        </button>
      </div>

      <div className="result-box">
        {!result ? (
          <span className="text-muted-foreground italic font-light">Poetic synonyms will appear here…</span>
        ) : result.groups ? (
          <div>
            <p className="font-display text-base mb-3">
              Synonyms for <em className="text-rust">{result.word}</em>
            </p>
            {Object.entries(result.groups).map(([key, words]) => (
              <div key={key} className="mb-3">
                <div className="font-display text-sm text-muted-foreground italic mb-1.5">
                  {labels[key] || key}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(words as string[]).map((w) => (
                    <span key={w} className="wtag" onClick={() => copyWord(w)}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground italic mt-2">Tap any word to copy it.</p>
          </div>
        ) : (
          <div>
            <span className="text-muted-foreground italic font-light">
              No entry for "<em>{result.word}</em>". Try:{" "}
            </span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {result.suggestions?.slice(0, 8).map((k) => (
                <span
                  key={k}
                  className="wtag"
                  onClick={() => {
                    setInput(k);
                    setResult(findSynonyms(k));
                  }}
                >
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
