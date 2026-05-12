# 💰 Personal Budget Tracker

Desktopowa aplikacja do śledzenia budżetu osobistego, zbudowana z wykorzystaniem **Tauri 2** (Rust) jako silnika backendowego oraz **React + TypeScript + Tailwind CSS** jako frontendu.

![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 📋 Opis projektu

Personal Budget Tracker to lekka, prywatna aplikacja desktopowa umożliwiająca analizę wydatków i przychodów z wyciągów bankowych (CSV). Wszystkie dane są przetwarzane **lokalnie** — nic nie jest wysyłane do chmury.

### Główne funkcje

| Funkcja | Opis |
|---------|------|
| 📊 **Dashboard** | Podsumowanie finansów: saldo, łączne wydatki/przychody + interaktywny wykres kołowy wydatków wg kategorii |
| 📃 **Transakcje** | Tabela operacji z wyszukiwarką, sortowaniem po kolumnach i paginacją. Wydatki wyświetlane na czerwono, przychody na zielono |
| ⚙️ **Ustawienia** | Import pliku CSV z banku (mBank, PKO BP, ING) |

---

## 🏗️ Architektura

```
┌─────────────────────────────────────────┐
│              Tauri 2 Shell              │
├──────────────┬──────────────────────────┤
│   Backend    │        Frontend          │
│   (Rust)     │   (React + TypeScript)   │
│              │                          │
│  • Parsowanie│  • Dashboard (Recharts)  │
│    CSV       │  • Lista transakcji      │
│  • Logika    │  • Ustawienia            │
│    biznesowa │  • Tailwind CSS v4       │
│              │  • Lucide React (ikony)  │
├──────────────┴──────────────────────────┤
│          Tauri IPC (invoke)             │
│     invoke('get_transactions') → JSON   │
└─────────────────────────────────────────┘
```

---

## 📂 Struktura projektu

```
budget-tracker/
├── src/                          # Frontend (React)
│   ├── index.css                 # Tailwind CSS v4 + design tokens
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Sidebar + nawigacja zakładek
│   ├── types/
│   │   └── transaction.ts        # Interfejsy TypeScript
│   ├── data/
│   │   └── mockTransactions.ts   # Dane testowe (dev mode)
│   ├── hooks/
│   │   └── useTransactions.ts    # Hook: Tauri invoke → fallback mock
│   └── views/
│       ├── Dashboard.tsx         # Statystyki + wykres kołowy
│       ├── TransactionList.tsx   # Tabela transakcji
│       └── Settings.tsx          # Import CSV
│
├── src-tauri/                    # Backend (Rust)
│   ├── src/
│   │   └── lib.rs                # Komendy Tauri
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🔌 Kontrakt danych (Backend → Frontend)

Komenda Tauri: `invoke<Transaction[]>("get_transactions")`

```typescript
interface Transaction {
  id: string;
  date: string;      // "YYYY-MM-DD"
  title: string;
  amount: number;     // ujemne = wydatek, dodatnie = przychód
  category: string;
}
```

Przykładowy JSON:
```json
[
  { "id": "1", "date": "2026-05-10", "title": "Żabka", "amount": -15.50, "category": "Jedzenie" },
  { "id": "2", "date": "2026-05-11", "title": "Wypłata", "amount": 5000.00, "category": "Przychód" }
]
```

---

## 🚀 Uruchomienie

### Wymagania

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) (toolchain stable)
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### Instalacja i uruchomienie

```bash
# Klonowanie repozytorium
git clone https://github.com/Konraddr2005-223/Personal-Budget-Tracker.git
cd Personal-Budget-Tracker/budget-tracker

# Instalacja zależności
npm install

# Uruchomienie w trybie deweloperskim (tylko frontend, dane mockowe)
npm run dev

# Uruchomienie pełnej aplikacji Tauri (frontend + backend Rust)
npm run tauri dev
```

### Budowanie wersji produkcyjnej

```bash
npm run tauri build
```

Wynikowy instalator znajdziesz w `src-tauri/target/release/bundle/`.

---

## 📦 Technologie

| Technologia | Wersja | Rola |
|-------------|--------|------|
| **Tauri** | 2.x | Framework aplikacji desktopowej |
| **Rust** | stable | Backend – parsowanie CSV, logika biznesowa |
| **React** | 19.x | Biblioteka UI |
| **TypeScript** | 5.8 | Typowanie statyczne |
| **Tailwind CSS** | 4.x | Stylowanie (dark mode) |
| **Recharts** | latest | Wykresy (PieChart / donut) |
| **Lucide React** | latest | Ikony SVG |
| **Vite** | 7.x | Bundler / dev server |

---

## 🎨 Design

Aplikacja korzysta z ciemnego motywu (Dark Mode) z autorskim systemem design tokenów:

| Token | Kolor | Zastosowanie |
|-------|-------|--------------|
| `bg-primary` | `#0f0f13` | Główne tło |
| `accent` | `#7c5cfc` | Kolor akcentowy (fiolet) |
| `income` | `#34d399` | Przychody (zielony) |
| `expense` | `#f87171` | Wydatki (czerwony) |

Font: **Inter** (Google Fonts)

---

## 🗺️ Roadmap

- [x] Struktura frontendowa (React + TypeScript)
- [x] Dashboard z wykresem kołowym
- [x] Tabela transakcji z sortowaniem i wyszukiwaniem
- [x] System nawigacji (sidebar + zakładki)
- [ ] Backend Rust – parsowanie CSV (mBank, PKO BP, ING)
- [ ] Import pliku CSV z dialogiem systemowym
- [ ] Filtrowanie transakcji po datach
- [ ] Eksport raportu do PDF
- [ ] Budżety miesięczne i alerty przekroczenia
- [ ] Wykresy trendów (linia czasowa wydatków)

---

## 📝 Licencja

Projekt udostępniony na licencji [MIT](LICENSE).

---

## 👤 Autor

**Konrad** – [@Konraddr2005-223](https://github.com/Konraddr2005-223)
