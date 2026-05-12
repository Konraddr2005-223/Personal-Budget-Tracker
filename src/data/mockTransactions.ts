import type { Transaction } from "../types/transaction";

export const mockTransactions: Transaction[] = [
  { id: "1",  date: "2026-05-01", title: "Wypłata – Firma XYZ",       amount:  5000.00, category: "Przychód" },
  { id: "2",  date: "2026-05-02", title: "Biedronka",                 amount:  -87.32,  category: "Jedzenie" },
  { id: "3",  date: "2026-05-03", title: "Allegro – Słuchawki",       amount: -249.99,  category: "Zakupy" },
  { id: "4",  date: "2026-05-04", title: "Netflix",                   amount:  -49.00,  category: "Rozrywka" },
  { id: "5",  date: "2026-05-05", title: "Żabka",                     amount:  -15.50,  category: "Jedzenie" },
  { id: "6",  date: "2026-05-06", title: "Orlen – Paliwo",            amount: -220.00,  category: "Transport" },
  { id: "7",  date: "2026-05-07", title: "Spotify",                   amount:  -29.99,  category: "Rozrywka" },
  { id: "8",  date: "2026-05-08", title: "Lidl",                      amount: -134.55,  category: "Jedzenie" },
  { id: "9",  date: "2026-05-09", title: "Czynsz – Maj 2026",        amount: -1800.00, category: "Mieszkanie" },
  { id: "10", date: "2026-05-10", title: "Przelew od Jana",           amount:   350.00, category: "Przychód" },
  { id: "11", date: "2026-05-10", title: "Apteka – Leki",             amount:  -67.80,  category: "Zdrowie" },
  { id: "12", date: "2026-05-11", title: "Uber – Przejazd",           amount:  -32.00,  category: "Transport" },
  { id: "13", date: "2026-05-11", title: "Media Expert – Kabel USB",  amount:  -19.99,  category: "Zakupy" },
  { id: "14", date: "2026-05-12", title: "Żabka",                     amount:  -12.40,  category: "Jedzenie" },
  { id: "15", date: "2026-05-12", title: "PZU – Ubezpieczenie",       amount: -180.00,  category: "Rachunki" },
];
