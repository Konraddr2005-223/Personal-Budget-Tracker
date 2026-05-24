import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";
import { CATEGORIES } from "../types/transaction";
import type { TransactionInput } from "../types/transaction";

const PAGE_SIZE = 10;

type SortField = "date" | "title" | "category" | "amount";
type SortDir = "asc" | "desc";

/* ── Add Transaction Form ── */
function AddTransactionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (input: TransactionInput) => void;
  onCancel: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [category, setCategory] = useState("Inne");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    onSubmit({
      date,
      title: title.trim(),
      amount: isExpense ? -numAmount : numAmount,
      category,
    });
  }

  const inputClass =
    "w-full rounded-xl bg-bg-elevated border border-border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/30";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-bg-card border border-accent/20 p-5 space-y-4 animate-scale-in"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Nowa transakcja</h3>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs text-text-muted mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Tytuł</label>
          <input
            type="text"
            placeholder="np. Biedronka"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Kwota (PLN)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`${inputClass} flex-1`}
              required
            />
            <button
              type="button"
              onClick={() => setIsExpense(!isExpense)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                isExpense
                  ? "bg-expense/10 text-expense border border-expense/20"
                  : "bg-income/10 text-income border border-income/20"
              }`}
            >
              {isExpense ? "Wydatek" : "Przychód"}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Kategoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-bg-elevated border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-all hover:text-text-primary"
        >
          Anuluj
        </button>
        <button
          type="submit"
          className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-accent-hover active:scale-[0.97]"
        >
          Dodaj
        </button>
      </div>
    </form>
  );
}

/* ━━━━━━━━━━━━━━━━ TransactionList ━━━━━━━━━━━━━━━━ */
export default function TransactionList() {
  const { transactions, loading, error, addTransaction, deleteTransaction } =
    useTransactions();

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ── Derived data ── */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.date.includes(q)
    );
  }, [transactions, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":     cmp = a.date.localeCompare(b.date); break;
        case "title":    cmp = a.title.localeCompare(b.title); break;
        case "category": cmp = a.category.localeCompare(b.category); break;
        case "amount":   cmp = a.amount - b.amount; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  /* ── Handlers ── */
  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(0);
  }

  async function handleAdd(input: TransactionInput) {
    await addTransaction(input);
    setShowAddForm(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteTransaction(id);
    setDeletingId(null);
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={13} className="text-text-muted" />;
    return sortDir === "asc" ? (
      <ArrowUp size={13} className="text-accent" />
    ) : (
      <ArrowDown size={13} className="text-accent" />
    );
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center animate-fade-in">
        <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transakcje</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {filtered.length} pozycji
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              id="transaction-search"
              type="text"
              placeholder="Szukaj…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-xl bg-bg-card border border-border pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent/30"
            />
          </div>

          {/* Add button */}
          <button
            id="add-transaction-button"
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${
              showAddForm
                ? "bg-bg-elevated border border-border text-text-secondary"
                : "bg-accent text-white hover:bg-accent-hover"
            }`}
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            <span className="hidden sm:inline">{showAddForm ? "Zamknij" : "Dodaj"}</span>
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <AddTransactionForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {error && (
        <div className="rounded-xl bg-expense-bg border border-expense/20 px-4 py-3 text-sm text-expense">
          ⚠ Nie udało się pobrać danych z backendu. Wyświetlam dane testowe.
        </div>
      )}

      {/* Table container */}
      <div className="rounded-2xl bg-bg-card border border-border overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
                {(
                  [
                    ["date", "Data"],
                    ["title", "Tytuł"],
                    ["category", "Kategoria"],
                    ["amount", "Kwota"],
                  ] as [SortField, string][]
                ).map(([field, label]) => (
                  <th key={field} className="px-5 py-3.5">
                    <button
                      className="flex items-center gap-1.5 hover:text-text-primary transition-colors"
                      onClick={() => handleSort(field)}
                    >
                      {label}
                      <SortIcon field={field} />
                    </button>
                  </th>
                ))}
                <th className="px-3 py-3.5 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-text-muted"
                  >
                    {search ? "Brak wyników wyszukiwania" : "Brak transakcji – dodaj pierwszą lub zaimportuj CSV"}
                  </td>
                </tr>
              ) : (
                pageItems.map((tx, idx) => {
                  const isExpense = tx.amount < 0;
                  const isDeleting = deletingId === tx.id;
                  return (
                    <tr
                      key={tx.id}
                      className={`border-b border-border/50 last:border-0 transition-all hover:bg-bg-card-hover ${
                        isDeleting ? "opacity-40" : ""
                      }`}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-text-secondary">
                        {tx.date}
                      </td>
                      <td className="px-5 py-3.5 font-medium">
                        {tx.title}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-block rounded-full bg-bg-elevated px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                          {tx.category}
                        </span>
                      </td>
                      <td
                        className={`px-5 py-3.5 text-right font-semibold tabular-nums whitespace-nowrap ${
                          isExpense ? "text-expense" : "text-income"
                        }`}
                      >
                        {isExpense ? "" : "+"}
                        {tx.amount.toFixed(2)} PLN
                      </td>
                      <td className="px-3 py-3.5">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={isDeleting}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-expense/10 hover:text-expense"
                          style={{ opacity: undefined }}
                          title="Usuń transakcję"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = "1")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = "0")
                          }
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-text-muted">
            <span>
              Strona {page + 1} z {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border transition-colors hover:bg-bg-elevated disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border transition-colors hover:bg-bg-elevated disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
