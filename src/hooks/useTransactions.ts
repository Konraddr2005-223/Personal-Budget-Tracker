import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Transaction, TransactionInput, ImportResult } from "../types/transaction";
import { mockTransactions } from "../data/mockTransactions";

const IS_TAURI = "__TAURI_INTERNALS__" in window;

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let data: Transaction[];

      if (!IS_TAURI) {
        // Fallback to mock data when running in plain browser (npm run dev)
        await new Promise((r) => setTimeout(r, 400));
        data = mockTransactions;
      } else {
        data = await invoke<Transaction[]>("get_transactions");
      }

      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      // Fallback to mock data on error
      setTransactions(mockTransactions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(
    async (input: TransactionInput): Promise<Transaction | null> => {
      if (!IS_TAURI) {
        // Mock: add locally
        const tx: Transaction = {
          id: String(Date.now()),
          ...input,
        };
        setTransactions((prev) => [tx, ...prev]);
        return tx;
      }

      try {
        const tx = await invoke<Transaction>("add_transaction", { input });
        await fetchTransactions();
        return tx;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    [fetchTransactions]
  );

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput): Promise<Transaction | null> => {
      if (!IS_TAURI) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...input } : t))
        );
        return { id, ...input };
      }

      try {
        const tx = await invoke<Transaction>("update_transaction", {
          id,
          input,
        });
        await fetchTransactions();
        return tx;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    [fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      if (!IS_TAURI) {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        return true;
      }

      try {
        await invoke("delete_transaction", { id });
        await fetchTransactions();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return false;
      }
    },
    [fetchTransactions]
  );

  const deleteAll = useCallback(async (): Promise<boolean> => {
    if (!IS_TAURI) {
      setTransactions([]);
      return true;
    }

    try {
      await invoke("delete_all_transactions");
      await fetchTransactions();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  }, [fetchTransactions]);

  const importCsv = useCallback(
    async (path: string): Promise<ImportResult | null> => {
      if (!IS_TAURI) {
        return { imported: 0, skipped: 0, errors: ["Not available in browser mode"] };
      }

      try {
        const result = await invoke<ImportResult>("import_csv", { path });
        await fetchTransactions();
        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return null;
      }
    },
    [fetchTransactions]
  );

  const exportCsv = useCallback(async (): Promise<string | null> => {
    if (!IS_TAURI) {
      return null;
    }

    try {
      return await invoke<string>("get_export_data");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, []);

  return {
    transactions,
    loading,
    error,
    refresh: fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    deleteAll,
    importCsv,
    exportCsv,
  };
}
