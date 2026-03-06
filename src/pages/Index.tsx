import { useState, useCallback } from "react";
import WordsPanel from "@/components/WordsPanel";
import ThesaurusPanel from "@/components/ThesaurusPanel";
import WorkshopPanel from "@/components/WorkshopPanel";
import DictionaryPanel from "@/components/DictionaryPanel";
import SplashScreen from "@/components/SplashScreen";

type Tab = "words" | "thesaurus" | "dictionary" | "workshop";

const tabs: { key: Tab; icon: string; label: string }[] = [
  { key: "words", icon: "🎵", label: "Words" },
  { key: "thesaurus", icon: "📖", label: "Thesaurus" },
  { key: "dictionary", icon: "📝", label: "Dictionary" },
  { key: "workshop", icon: "✍️", label: "Workshop" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState<Tab>("words");
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashFinished = useCallback(() => setShowSplash(false), []);

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      {showSplash && <SplashScreen onFinished={handleSplashFinished} />}
      {/* Header */}
      <header className="text-center py-4 px-4 border-b border-input flex-shrink-0">
        <div className="text-xs text-gold tracking-[0.6rem] mb-1">✦  ◈  ✦</div>
        <h1 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-bold tracking-tight">
          Poetry <em className="italic text-rust">Assistant</em>
        </h1>
        <p className="text-sm italic text-muted-foreground font-light mt-0.5">
          Offline tools for the craft of verse
        </p>
      </header>

      {/* Main scrollable area */}
      <main className="flex-1 overflow-y-auto px-4 py-5 max-w-[780px] w-full mx-auto">
        {activeTab === "words" && <WordsPanel />}
        {activeTab === "thesaurus" && <ThesaurusPanel />}
        {activeTab === "dictionary" && <DictionaryPanel />}
        {activeTab === "workshop" && <WorkshopPanel />}
      </main>

      {/* Bottom navigation */}
      <nav className="flex border-t border-input bg-card flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-2 font-body text-xs transition-all border-r border-input last:border-r-0 ${
              activeTab === tab.key
                ? "bg-background text-rust italic border-t-2 border-t-rust -mt-px"
                : "text-muted-foreground hover:bg-gold/5 hover:text-foreground"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Index;
