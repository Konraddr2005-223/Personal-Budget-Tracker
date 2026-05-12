import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Transaction } from "../types/transaction";
import { mockTransactions } from "../data/mockTransactions";

const IS_DEV_BROWSER = !("__TAURI_INTERNALS__" in window);

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTransactions() {
      try {
        setLoading(true);
        setError(null);

        let data: Transaction[];

        if (IS_DEV_BROWSER) {
          // Fallback to mock data when running in plain browser (npm run dev)
          await new Promise((r) => setTimeout(r, 400));
          data = mockTransactions;
        } else {
          data = await invoke<Transaction[]>("get_transactions");
        }

        if (!cancelled) {
          setTransactions(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          // Fallback to mock data on error
          setTransactions(mockTransactions);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTransactions();
    return () => { cancelled = true; };
  }, []);

  return { transactions, loading, error };
}
