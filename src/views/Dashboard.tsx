import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { useTransactions } from "../hooks/useTransactions";

/* ── Palette for pie-chart categories ── */
const CATEGORY_COLORS: Record<string, string> = {
  Jedzenie:   "#f59e0b",
  Zakupy:     "#8b5cf6",
  Rozrywka:   "#ec4899",
  Transport:  "#3b82f6",
  Mieszkanie: "#06b6d4",
  Zdrowie:    "#10b981",
  Rachunki:   "#f97316",
  Przychód:   "#34d399",
};

const fallbackColor = (idx: number) => {
  const palette = ["#6366f1", "#a855f7", "#f43f5e", "#14b8a6", "#eab308"];
  return palette[idx % palette.length];
};

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0].payload;
  return (
    <div className="glass rounded-lg px-3 py-2 text-sm shadow-xl">
      <span className="font-medium" style={{ color: fill }}>{name}</span>
      <span className="ml-2 text-text-secondary">{value.toFixed(2)} PLN</span>
    </div>
  );
}

/* ── Legend renderer ── */
function renderLegend(props: any) {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs">
      {payload.map((entry: any, idx: number) => (
        <li key={idx} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-text-secondary">{entry.value}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Stat card component ── */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent: string;
  sub?: React.ReactNode;
}) {
  return (
    <div className="group relative rounded-2xl bg-bg-card border border-border p-5 transition-all duration-300 hover:border-border-hover hover:bg-bg-card-hover animate-slide-up overflow-hidden">
      {/* glow */}
      <div
        className="absolute -top-12 -right-12 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{ backgroundColor: accent }}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {sub && <div className="mt-1 text-xs text-text-secondary">{sub}</div>}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}22` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━ Dashboard ━━━━━━━━━━━━━━━━ */
export default function Dashboard() {
  const { transactions, loading } = useTransactions();

  const stats = useMemo(() => {
    const expenses = transactions.filter((t) => t.amount < 0);
    const incomes  = transactions.filter((t) => t.amount >= 0);

    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const totalIncome   = incomes.reduce((s, t) => s + t.amount, 0);
    const balance        = totalIncome + totalExpenses;

    const byCategory: Record<string, number> = {};
    for (const t of expenses) {
      const cat = t.category || "Inne";
      byCategory[cat] = (byCategory[cat] || 0) + Math.abs(t.amount);
    }

    const pieData = Object.entries(byCategory)
      .map(([name, value], idx) => ({
        name,
        value: Math.round(value * 100) / 100,
        fill: CATEGORY_COLORS[name] || fallbackColor(idx),
      }))
      .sort((a, b) => b.value - a.value);

    return { totalExpenses, totalIncome, balance, pieData, txCount: transactions.length };
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center animate-fade-in">
        <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Podsumowanie</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Maj 2026 · {stats.txCount} transakcji
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Saldo"
          value={`${stats.balance >= 0 ? "+" : ""}${stats.balance.toFixed(2)} PLN`}
          icon={Wallet}
          accent={stats.balance >= 0 ? "#34d399" : "#f87171"}
          sub={
            <span className="flex items-center gap-0.5">
              {stats.balance >= 0 ? (
                <ArrowUpRight size={12} className="text-income" />
              ) : (
                <ArrowDownRight size={12} className="text-expense" />
              )}
              bilans tego miesiąca
            </span>
          }
        />
        <StatCard
          label="Wydatki"
          value={`${stats.totalExpenses.toFixed(2)} PLN`}
          icon={TrendingDown}
          accent="#f87171"
        />
        <StatCard
          label="Przychody"
          value={`+${stats.totalIncome.toFixed(2)} PLN`}
          icon={TrendingUp}
          accent="#34d399"
        />
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-bg-card border border-border p-6 animate-slide-up">
        <h2 className="text-base font-semibold mb-4">Wydatki wg kategorii</h2>

        {stats.pieData.length === 0 ? (
          <p className="py-12 text-center text-text-muted text-sm">
            Brak danych do wyświetlenia
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={stats.pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={120}
                paddingAngle={3}
                strokeWidth={0}
                animationBegin={0}
                animationDuration={800}
              >
                {stats.pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
