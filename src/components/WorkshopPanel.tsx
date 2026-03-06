import { useState } from "react";
import { toast } from "sonner";
import { analyzeMeter, identifyForm, getLineStats, detectSoundDevices } from "@/lib/poetryAlgorithms";

type ToolType = "meter" | "form" | "lines" | "sounds";

export default function WorkshopPanel() {
  const [poem, setPoem] = useState("");
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [result, setResult] = useState<React.ReactNode>(null);

  const tools: { key: ToolType; icon: string; label: string }[] = [
    { key: "meter", icon: "〜", label: "Meter" },
    { key: "form", icon: "📜", label: "Form" },
    { key: "lines", icon: "📐", label: "Line Stats" },
    { key: "sounds", icon: "🎵", label: "Sound Devices" },
  ];

  const runTool = (tool: ToolType) => {
    if (!poem.trim()) {
      toast("Please enter a poem first");
      return;
    }
    setActiveTool(tool);

    switch (tool) {
      case "meter":
        setResult(renderMeter());
        break;
      case "form":
        setResult(renderForm());
        break;
      case "lines":
        setResult(renderLineStats());
        break;
      case "sounds":
        setResult(renderSoundDevices());
        break;
    }
  };

  const renderMeter = () => {
    const data = analyzeMeter(poem);
    return (
      <div>
        <div className="inline-block px-3 py-1 bg-gold/10 rounded font-display text-base text-rust italic mb-2">
          {data.form.name}
        </div>
        <p className="text-sm text-muted-foreground italic mb-3">{data.form.desc}</p>
        {data.results.map((r, i) => (
          <div key={i} className="meter-line">
            <div>
              {r.markedWords.map((mw, j) => (
                <span key={j} className="mr-1">
                  {"parts" in mw
                    ? (mw.parts ?? []).map((p, k) => (
                      <span key={k} className={p.stressed ? "text-rust font-bold" : "text-muted-foreground"}>
                        {p.text}
                      </span>
                    ))
                    : (
                      <span className={mw.stressed ? "text-rust font-bold" : "text-muted-foreground"}>
                        {mw.text}
                      </span>
                    )}
                </span>
              ))}
            </div>
            <div className="font-mono text-xs text-gold mt-0.5 tracking-wider">{r.pattern} · {r.count} syllables</div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground italic mt-3">
          <span className="text-rust font-bold">stressed</span> · <span className="text-muted-foreground">unstressed</span> (heuristic analysis)
        </p>
      </div>
    );
  };

  const renderForm = () => {
    const data = identifyForm(poem);
    return (
      <div>
        <div className="inline-block px-3 py-1 bg-gold/10 rounded font-display text-base text-rust italic mb-2">
          {data.form}
        </div>
        <p className="text-sm text-muted-foreground italic mb-3">{data.desc}</p>
        <div className="mt-2">
          {data.features.map((f, i) => (
            <p key={i} className="text-sm text-muted-foreground my-1">◦ {f}</p>
          ))}
        </div>
      </div>
    );
  };

  const renderLineStats = () => {
    const data = getLineStats(poem);
    const stats = [
      { label: "Lines", value: data.lineCount },
      { label: "Total words", value: data.totalWords },
      { label: "Total syllables", value: data.totalSyls },
      { label: "Unique words", value: data.uniqueWords },
      { label: "Avg words/line", value: data.avgWordsPerLine },
      { label: "Avg syllables/line", value: data.avgSylsPerLine },
      { label: "Lexical density", value: data.lexicalDensity + "%" },
      { label: "Syllables/word", value: data.sylsPerWord },
    ];
    return (
      <div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-tile">
              <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              <div className="font-display text-xl text-rust">{s.value}</div>
            </div>
          ))}
        </div>
        <div>
          {data.lines.map((l, i) => (
            <div key={i} className="text-sm text-muted-foreground my-0.5 flex gap-2">
              <span className="w-6 text-right text-muted-foreground/60">{i + 1}.</span>
              <span className="flex-1 truncate">{l.text}</span>
              <span className="text-gold whitespace-nowrap">{l.syllables}sy</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSoundDevices = () => {
    const data = detectSoundDevices(poem);
    const sections = [
      { name: "Alliteration", items: data.alliteration, desc: "Consecutive words sharing an initial consonant" },
      { name: "Assonance patterns", items: data.assonance, desc: "Repeated vowel sound clusters" },
      { name: "Consonance patterns", items: data.consonance, desc: "Repeated final consonant clusters" },
      { name: "Repeated words", items: data.repeated, desc: "Words used multiple times (potential anaphora/epistrophe)" },
    ].filter((s) => s.items.length > 0);

    if (sections.length === 0) {
      return <span className="text-muted-foreground italic font-light">No prominent sound devices detected.</span>;
    }

    return (
      <div>
        {sections.map((s) => (
          <div key={s.name} className="mb-4">
            <div className="font-display text-sm italic text-rust mb-0.5">{s.name}</div>
            <div className="text-xs text-muted-foreground mb-1.5">{s.desc}</div>
            <div className="flex flex-wrap gap-1.5">
              {s.items.map((item, i) => (
                <span key={i} className="wtag">{item}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <p className="font-display text-xl italic mb-1">Poem Workshop</p>
      <p className="text-muted-foreground text-sm mb-4 font-light">
        Analyze meter, identify form, and get structural insights.
      </p>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.key}
            className={`px-3 py-1.5 border rounded text-sm font-body transition-all ${activeTool === t.key
                ? "bg-gold text-gold-foreground border-gold"
                : "border-input text-muted-foreground hover:bg-gold/10 hover:text-foreground"
              }`}
            onClick={() => runTool(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <textarea
        className="ink-input w-full min-h-[120px] resize-y leading-relaxed mb-2"
        placeholder={"Paste or write your poem here…\n\ne.g. Shall I compare thee to a summer's day?\nThou art more lovely and more temperate."}
        value={poem}
        onChange={(e) => setPoem(e.target.value)}
      />

      <div className="ornament">— ✦ —</div>

      <div className="result-box">
        {result || <span className="text-muted-foreground italic font-light">Select a tool above, then see your analysis here…</span>}
      </div>
    </div>
  );
}
