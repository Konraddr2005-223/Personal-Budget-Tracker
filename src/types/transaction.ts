export interface Transaction {
  id: string;
  date: string;
  title: string;
  amount: number;
  category: string;
}

export type TabId = "dashboard" | "transactions" | "settings";
