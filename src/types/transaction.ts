export interface Transaction {
  id: string;
  date: string;      // "YYYY-MM-DD"
  title: string;
  amount: number;     // negative = expense, positive = income
  category: string;
}

export interface TransactionInput {
  date: string;
  title: string;
  amount: number;
  category: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface Summary {
  total_income: number;
  total_expenses: number;
  balance: number;
  transaction_count: number;
  categories: CategorySummary[];
}

export interface CategorySummary {
  name: string;
  total: number;
  count: number;
}

export type TabId = "dashboard" | "transactions" | "settings";

export const CATEGORIES = [
  "Przychód",
  "Jedzenie",
  "Zakupy",
  "Rozrywka",
  "Transport",
  "Mieszkanie",
  "Zdrowie",
  "Rachunki",
  "Inne",
] as const;
