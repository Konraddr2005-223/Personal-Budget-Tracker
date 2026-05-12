import { useState } from "react";
import { LayoutDashboard, ArrowLeftRight, Settings as SettingsIcon } from "lucide-react";
import type { TabId } from "./types/transaction";
import Dashboard from "./views/Dashboard";
import TransactionList from "./views/TransactionList";
import Settings from "./views/Settings";
import "./index.css";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard",    label: "Podsumowanie",  icon: LayoutDashboard },
  { id: "transactions", label: "Transakcje",    icon: ArrowLeftRight },
  { id: "settings",     label: "Ustawienia",    icon: SettingsIcon },
];

function TabContent({ tab }: { tab: TabId }) {
  switch (tab) {
    case "dashboard":    return <Dashboard />;
    case "transactions": return <TransactionList />;
    case "settings":     return <Settings />;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  return (
    <div className="flex h-screen bg-bg-primary">
      {/* ── Sidebar ── */}
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-bg-secondary">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight">
            Budget<span className="text-accent">Tracker</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 mt-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                id={`tab-${id}`}
                onClick={() => setActiveTab(id)}
                className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-accent/12 text-accent"
                    : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-colors ${
                    isActive ? "text-accent" : "text-text-muted group-hover:text-text-secondary"
                  }`}
                />
                {label}

                {/* Active indicator */}
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent animate-scale-in" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-5 py-4">
          <p className="text-[10px] text-text-muted leading-relaxed">
            Personal Budget Tracker
            <br />
            v0.1.0 · Tauri 2
          </p>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto px-8 py-6">
        <TabContent tab={activeTab} />
      </main>
    </div>
  );
}
