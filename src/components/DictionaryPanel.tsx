import { useState, useCallback } from "react";
import { toast } from "sonner";
import { definitionsDB } from "@/data/definitionsDB";
import type { WordDefinition } from "@/data/definitionsDB";

export default function DictionaryPanel() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ word: string; defs: WordDefinition[] | null; suggestions?: string[] } | null>(null);

  const handleSearch = () => {
    const raw = input.trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (!raw) return;

    if (definitionsDB[raw]) {
      setResult({ word: raw, defs: definitionsDB[raw] });
      return;
    }

    // Try without underscores
    const plain = raw.replace(/_/g, "");
    const match = Object.keys(definitionsDB).find(
      (k) => k === plain || k.replace(/[_-]/g, "") === plain || k.startsWith(raw.slice(0, 4))
    );
    if (match) {
      setResult({ word: match, defs: definitionsDB[match] });
      return;
    }

    // Fuzzy: show suggestions
    const suggestions = Object.keys(definitionsDB)
      .filter((k) => k.includes(raw.slice(0, 3)) || raw.includes(k.slice(0, 3)))
      .slice(0, 12);
    setResult({ word: raw, defs: null, suggestions });
  };

  const copyWord = useCallback((word: string) => {
    navigator.clipboard.writeText(word).catch(() => { });
    toast(`Copied: ${word}`, { duration: 1600 });
  }, []);

  return (
    <div className="animate-fade-in">
      <p className="font-display text-xl italic mb-1">Poet's Dictionary</p>
      <p className="text-muted-foreground text-sm mb-4 font-light">
        Definitions, etymology & usage for rare and poetic words.
      </p>

      <div className="flex gap-2 mb-3 flex-wrap">
        <input
          type="text"
          className="ink-input flex-1 min-w-[160px]"
          placeholder="e.g. petrichor, ephemeral, sonnet…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-display text-sm italic hover:bg-rust transition-colors"
          onClick={handleSearch}
        >
          Look Up
        </button>
      </div>

      <div className="result-box">
        {!result ? (
          <span className="text-muted-foreground italic font-light">
            Explore rare, evocative, and poetic words…
          </span>
        ) : result.defs ? (
          <div>
            {result.defs.map((def, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-display text-lg text-rust">{def.word.replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground italic">{def.partOfSpeech}</span>
                </div>
                <p className="text-sm mb-2">{def.definition}</p>
                {def.etymology && (
                  <p className="text-xs text-muted-foreground mb-1.5">
                    <span className="text-gold font-display italic">Origin:</span> {def.etymology}
                  </p>
                )}
                {def.usage && (
                  <p className="text-xs text-muted-foreground italic mb-2 border-l-2 border-gold/30 pl-2">
                    "{def.usage}"
                  </p>
                )}
                {def.related && def.related.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {def.related.map((w) => (
                      <span key={w} className="wtag" onClick={() => copyWord(w)}>
                        {w}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>
            <span className="text-muted-foreground italic font-light">
              No entry for "{result.word.replace(/_/g, " ")}".
            </span>
            {result.suggestions && result.suggestions.length > 0 && (
              <>
                <span className="text-muted-foreground text-sm"> Try:</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.suggestions.map((k) => (
                    <span
                      key={k}
                      className="wtag"
                      onClick={() => {
                        setInput(k.replace(/_/g, " "));
                        setResult({ word: k, defs: definitionsDB[k] });
                      }}
                    >
                      {k.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Browse all words */}
      <div className="mt-4">
        <p className="font-display text-sm italic text-muted-foreground mb-2">Browse all words:</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(definitionsDB).slice(0, 30).map((k) => (
            <span
              key={k}
              className="wtag text-xs"
              onClick={() => {
                setInput(k.replace(/_/g, " "));
                setResult({ word: k, defs: definitionsDB[k] });
              }}
            >
              {k.replace(/_/g, " ")}
            </span>
          ))}
          {Object.keys(definitionsDB).length > 30 && (
            <span className="text-xs text-muted-foreground italic">
              +{Object.keys(definitionsDB).length - 30} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
