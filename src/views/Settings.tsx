import { useState } from "react";
import { Upload, FolderOpen, Info, Download, Trash2, CheckCircle, AlertCircle } from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import type { ImportResult } from "../types/transaction";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

export default function Settings() {
  const { importCsv, exportCsv, deleteAll, transactions } = useTransactions();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function showNotification(type: "success" | "error" | "info", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function handleImportCSV() {
    if (!IS_TAURI) {
      showNotification("info", "Import CSV jest dostępny tylko w aplikacji Tauri (npm run tauri dev)");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      // Dynamic import for Tauri dialog
      const { open } = await import("@tauri-apps/plugin-dialog");

      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "CSV",
            extensions: ["csv"],
          },
        ],
      });

      if (!selected) {
        setImporting(false);
        return;
      }

      const path = typeof selected === "string" ? selected : selected;
      const result = await importCsv(path as string);

      if (result) {
        setImportResult(result);
        if (result.imported > 0) {
          showNotification(
            "success",
            `Zaimportowano ${result.imported} transakcji${result.skipped > 0 ? `, pominięto ${result.skipped} duplikatów` : ""}`
          );
        } else if (result.skipped > 0) {
          showNotification("info", `Wszystkie transakcje (${result.skipped}) już istnieją w bazie`);
        } else {
          showNotification("error", "Nie udało się zaimportować żadnych transakcji. Sprawdź format pliku.");
        }
      }
    } catch (err) {
      showNotification("error", `Błąd importu: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImporting(false);
    }
  }

  async function handleExportCSV() {
    if (!IS_TAURI) {
      showNotification("info", "Eksport CSV jest dostępny tylko w aplikacji Tauri");
      return;
    }

    setExporting(true);

    try {
      const { save } = await import("@tauri-apps/plugin-dialog");

      const filePath = await save({
        filters: [{ name: "CSV", extensions: ["csv"] }],
        defaultPath: `budget-export-${new Date().toISOString().slice(0, 10)}.csv`,
      });

      if (!filePath) {
        setExporting(false);
        return;
      }

      const csvData = await exportCsv();
      if (csvData) {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("write_export_file", { path: filePath, content: csvData });

        showNotification("success", "Dane wyeksportowane pomyślnie");
      }
    } catch (err) {
      showNotification("error", `Błąd eksportu: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAll() {
    const success = await deleteAll();
    setShowDeleteConfirm(false);
    if (success) {
      showNotification("success", "Wszystkie transakcje zostały usunięte");
    } else {
      showNotification("error", "Nie udało się usunąć transakcji");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ustawienia</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Konfiguracja aplikacji i zarządzanie danymi
        </p>
      </div>

      {/* Notification toast */}
      {notification && (
        <div
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm animate-slide-up ${
            notification.type === "success"
              ? "bg-income-bg border border-income/20 text-income"
              : notification.type === "error"
                ? "bg-expense-bg border border-expense/20 text-expense"
                : "bg-accent/10 border border-accent/20 text-accent"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {notification.message}
        </div>
      )}

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
            {IS_TAURI
              ? "Kliknij przycisk poniżej, aby wybrać plik CSV"
              : "Import CSV jest dostępny po uruchomieniu: npm run tauri dev"}
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

        {/* Import result */}
        {importResult && (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-bg-elevated p-3">
              <p className="text-xl font-bold text-income">{importResult.imported}</p>
              <p className="text-xs text-text-muted mt-0.5">Zaimportowano</p>
            </div>
            <div className="rounded-xl bg-bg-elevated p-3">
              <p className="text-xl font-bold text-text-secondary">{importResult.skipped}</p>
              <p className="text-xs text-text-muted mt-0.5">Pominięto</p>
            </div>
            <div className="rounded-xl bg-bg-elevated p-3">
              <p className="text-xl font-bold text-expense">{importResult.errors.length}</p>
              <p className="text-xs text-text-muted mt-0.5">Błędy</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-xl bg-bg-elevated px-4 py-3 text-xs text-text-secondary">
          <Info size={14} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Obsługiwane formaty: mBank CSV, PKO BP CSV, ING CSV, ogólny CSV.
            <br />
            Dane są przetwarzane lokalnie – nic nie jest wysyłane do chmury.
            <br />
            Duplikaty (ta sama data, tytuł i kwota) są automatycznie pomijane.
          </p>
        </div>
      </div>

      {/* Export & Data management */}
      <div className="rounded-2xl bg-bg-card border border-border p-6 animate-slide-up space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-income/10">
            <Download size={20} className="text-income" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Eksport i zarządzanie</h2>
            <p className="text-xs text-text-secondary">
              Eksportuj dane lub zarządzaj bazą transakcji ({transactions.length} rekordów)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            id="export-csv-button"
            onClick={handleExportCSV}
            disabled={exporting || transactions.length === 0}
            className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-all hover:border-income/30 hover:bg-income/5 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            {exporting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-income/30 border-t-income animate-spin" />
                Eksportuję…
              </>
            ) : (
              <>
                <Download size={16} className="text-income" />
                Eksportuj do CSV
              </>
            )}
          </button>

          <button
            id="delete-all-button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={transactions.length === 0}
            className="flex items-center gap-2 rounded-xl bg-bg-elevated border border-border px-4 py-2.5 text-sm font-medium text-text-primary transition-all hover:border-expense/30 hover:bg-expense/5 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none"
          >
            <Trash2 size={16} className="text-expense" />
            Usuń wszystkie dane
          </button>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="rounded-xl bg-expense/5 border border-expense/20 p-4 space-y-3 animate-scale-in">
            <p className="text-sm text-expense font-medium">
              ⚠️ Czy na pewno chcesz usunąć wszystkie transakcje?
            </p>
            <p className="text-xs text-text-secondary">
              Ta operacja jest nieodwracalna. Wszystkie {transactions.length} rekordów zostanie trwale usunięte.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAll}
                className="rounded-lg bg-expense px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-expense/90 active:scale-[0.97]"
              >
                Tak, usuń wszystko
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg bg-bg-elevated border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:text-text-primary"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}
      </div>

      {/* App info */}
      <div className="rounded-2xl bg-bg-card border border-border p-6 animate-slide-up">
        <h2 className="text-base font-semibold mb-3">O aplikacji</h2>
        <div className="space-y-2 text-sm text-text-secondary">
          <p>
            <span className="text-text-muted">Wersja:</span>{" "}
            <span className="font-mono">0.1.0</span>
          </p>
          <p>
            <span className="text-text-muted">Silnik:</span> Tauri 2 + React + TypeScript
          </p>
          <p>
            <span className="text-text-muted">Dane:</span>{" "}
            {IS_TAURI
              ? "Zapisywane lokalnie w katalogu aplikacji"
              : "Tryb demonstracyjny (dane mockowe)"}
          </p>
          <p>
            <span className="text-text-muted">Licencja:</span> MIT
          </p>
        </div>
      </div>
    </div>
  );
}
