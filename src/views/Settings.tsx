import { useState } from "react";
import { Upload, FolderOpen, Info } from "lucide-react";

export default function Settings() {
  const [importing, setImporting] = useState(false);

  async function handleImportCSV() {
    setImporting(true);

    // TODO: Invoke Tauri file dialog + backend parsing
    // const selected = await open({ filters: [{ name: "CSV", extensions: ["csv"] }] });
    // if (selected) await invoke("import_csv", { path: selected });

    // Simulate delay for UI feedback
    await new Promise((r) => setTimeout(r, 1200));
    setImporting(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Konfiguracja aplikacji
        </p>
      </div>

      {/* Import section */}
      <div className="rounded-2xl bg-bg-card border border-border p-6 animate-slide-up space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
            <FolderOpen size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Import danych</h2>
            <p className="text-xs text-text-secondary">
              Wczytaj wyciąg bankowy w formacie CSV
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-border py-10 transition-colors hover:border-accent/40">
          <Upload size={32} className="text-text-muted mb-3" />
          <p className="text-sm text-text-secondary mb-4">
            Przeciągnij plik CSV tutaj lub kliknij przycisk poniżej
          </p>

          <button
            id="import-csv-button"
            onClick={handleImportCSV}
            disabled={importing}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-hover active:scale-[0.97] disabled:opacity-60 disabled:pointer-events-none"
          >
            {importing ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Importuję…
              </>
            ) : (
              <>
                <Upload size={16} />
                Wczytaj plik CSV
              </>
            )}
          </button>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-bg-elevated px-4 py-3 text-xs text-text-secondary">
          <Info size={14} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Obsługiwane formaty: mBank CSV, PKO BP CSV, ING CSV.
            <br />
            Dane są przetwarzane lokalnie – nic nie jest wysyłane do chmury.
          </p>
        </div>
      </div>

      {/* App info */}
      <div className="rounded-2xl bg-bg-card border border-border p-6 animate-slide-up">
        <h2 className="text-base font-semibold mb-3">O aplikacji</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>
            <span className="text-text-muted">Wersja:</span>{" "}
            <span className="font-mono">0.1.0-alpha</span>
          </p>
          <p>
            <span className="text-text-muted">Silnik:</span> Tauri 2 + React + TypeScript
          </p>
          <p>
            <span className="text-text-muted">Licencja:</span> MIT
          </p>
        </div>
      </div>
    </div>
  );
}
