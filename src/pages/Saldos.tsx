import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw, TrendingUp } from "lucide-react";

interface ProductBalance {
  id?: string;
  product: string;
  unit_type: string;
  month: number;
  year: number;
  produzido: number;
  embarcado: number;
}

interface SafraTotals {
  produzido: number;
  embarcado: number;
  saldo: number;
}

const PRODUCTS: { name: string; unit: string }[] = [
  { name: "PLUMA", unit: "fardos" },
  { name: "FIBRILHA", unit: "fardos" },
  { name: "CAROÇO", unit: "KG" },
  { name: "BRIQUETE", unit: "KG" },
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Safras disponíveis (ano/ano+1)
const SAFRAS = ["2023/2024", "2024/2025", "2025/2026", "2026/2027"];

// Converte safra "2025/2026" para lista de {month, year}
function safraToYearMonths(safra: string): { year: number; months: number[] }[] {
  const [y1, y2] = safra.split("/").map(Number);
  // Safra: Julho(7)..Dezembro(12) do ano1 + Janeiro(1)..Junho(6) do ano2
  return [
    { year: y1, months: [7, 8, 9, 10, 11, 12] },
    { year: y2, months: [1, 2, 3, 4, 5, 6] },
  ];
}

export default function Saldos() {
  const { toast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedSafra, setSelectedSafra] = useState("2025/2026");
  const [balances, setBalances] = useState<Record<string, ProductBalance>>({});
  const [safraTotals, setSafraTotals] = useState<Record<string, SafraTotals>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Busca dados do mês selecionado
  const fetchBalances = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_balances")
      .select("*")
      .eq("month", selectedMonth)
      .eq("year", selectedYear);

    if (!error && data) {
      const map: Record<string, ProductBalance> = {};
      data.forEach((row: ProductBalance) => {
        map[row.product] = row;
      });
      PRODUCTS.forEach(({ name, unit }) => {
        if (!map[name]) {
          map[name] = { product: name, unit_type: unit, month: selectedMonth, year: selectedYear, produzido: 0, embarcado: 0 };
        }
      });
      setBalances(map);
    } else {
      const map: Record<string, ProductBalance> = {};
      PRODUCTS.forEach(({ name, unit }) => {
        map[name] = { product: name, unit_type: unit, month: selectedMonth, year: selectedYear, produzido: 0, embarcado: 0 };
      });
      setBalances(map);
    }
    setLoading(false);
  };

  // Busca totais acumulados da safra inteira
  const fetchSafraTotals = async () => {
    const periods = safraToYearMonths(selectedSafra);
    const allData: ProductBalance[] = [];

    for (const { year, months } of periods) {
      const { data } = await supabase
        .from("product_balances")
        .select("*")
        .eq("year", year)
        .in("month", months);
      if (data) allData.push(...(data as ProductBalance[]));
    }

    // Acumular por produto
    const totals: Record<string, SafraTotals> = {};
    PRODUCTS.forEach(({ name }) => {
      totals[name] = { produzido: 0, embarcado: 0, saldo: 0 };
    });
    allData.forEach(row => {
      if (totals[row.product]) {
        totals[row.product].produzido += row.produzido || 0;
        totals[row.product].embarcado += row.embarcado || 0;
      }
    });
    PRODUCTS.forEach(({ name }) => {
      totals[name].saldo = totals[name].produzido - totals[name].embarcado;
    });
    setSafraTotals(totals);
  };

  useEffect(() => {
    fetchBalances();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchSafraTotals();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSafra]);

  const handleChange = (product: string, field: "produzido" | "embarcado", value: string) => {
    const num = parseFloat(value) || 0;
    setBalances(prev => ({
      ...prev,
      [product]: { ...prev[product], [field]: num },
    }));
  };

  const handleSave = async (product: string) => {
    setSaving(product);
    const bal = balances[product];
    const { error } = await supabase
      .from("product_balances")
      .upsert({
        product: bal.product,
        unit_type: bal.unit_type,
        month: bal.month,
        year: bal.year,
        produzido: bal.produzido,
        embarcado: bal.embarcado,
        updated_at: new Date().toISOString(),
        updated_by: localStorage.getItem("username") || "guarita",
      }, { onConflict: "product,month,year" });

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvo!", description: `Saldo de ${product} atualizado.` });
      // Atualiza totais da safra após salvar
      fetchSafraTotals();
    }
    setSaving(null);
  };

  const getSaldo = (product: string) => {
    const bal = balances[product];
    if (!bal) return 0;
    return bal.produzido - bal.embarcado;
  };

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto p-4 md:p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Saldos de Produção</h1>
          <Button variant="outline" size="sm" onClick={() => { fetchBalances(); fetchSafraTotals(); }} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* ===== TOTAIS DA SAFRA ===== */}
        <Card className="mb-6 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Acumulado da Safra
              </CardTitle>
              <select
                value={selectedSafra}
                onChange={e => setSelectedSafra(e.target.value)}
                className="border rounded px-3 py-1.5 bg-background text-sm font-semibold"
              >
                {SAFRAS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-emerald-50 dark:bg-emerald-950/30">
                    <th className="text-left p-3 text-sm font-semibold">Produto</th>
                    <th className="text-center p-3 text-sm font-semibold">Unidade</th>
                    <th className="text-center p-3 text-sm font-semibold text-blue-600">Total Produzido</th>
                    <th className="text-center p-3 text-sm font-semibold text-orange-600">Total Embarcado</th>
                    <th className="text-center p-3 text-sm font-semibold text-emerald-700">Saldo da Safra</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCTS.map(({ name, unit }) => {
                    const t = safraTotals[name] || { produzido: 0, embarcado: 0, saldo: 0 };
                    return (
                      <tr key={name} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{name}</span>
                        </td>
                        <td className="p-3 text-center text-sm text-muted-foreground">{unit}</td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-blue-600">{t.produzido.toLocaleString("pt-BR")}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-orange-600">{t.embarcado.toLocaleString("pt-BR")}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-bold text-lg ${
                            t.saldo < 0 ? "text-red-600" : t.saldo > 0 ? "text-emerald-600" : "text-muted-foreground"
                          }`}>
                            {t.saldo.toLocaleString("pt-BR")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ===== ENTRADA MENSAL ===== */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-lg">
                Entrada Mensal — {MONTHS[selectedMonth - 1]} / {selectedYear}
              </CardTitle>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="border rounded px-3 py-1.5 bg-background text-sm"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="border rounded px-3 py-1.5 bg-background text-sm"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 text-sm font-semibold">Produto</th>
                    <th className="text-center p-3 text-sm font-semibold">Unidade</th>
                    <th className="text-center p-3 text-sm font-semibold">Produzido</th>
                    <th className="text-center p-3 text-sm font-semibold">Embarcado</th>
                    <th className="text-center p-3 text-sm font-semibold">Saldo Mês</th>
                    <th className="text-center p-3 text-sm font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCTS.map(({ name }) => {
                    const bal = balances[name];
                    const saldo = getSaldo(name);
                    return (
                      <tr key={name} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{name}</span>
                        </td>
                        <td className="p-3 text-center text-sm text-muted-foreground">
                          {bal?.unit_type || ""}
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={0}
                            value={bal?.produzido ?? 0}
                            onChange={e => handleChange(name, "produzido", e.target.value)}
                            className="text-center w-28 mx-auto"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            min={0}
                            value={bal?.embarcado ?? 0}
                            onChange={e => handleChange(name, "embarcado", e.target.value)}
                            className="text-center w-28 mx-auto"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-bold text-base ${
                            saldo < 0 ? "text-red-600" : saldo > 0 ? "text-green-600" : "text-muted-foreground"
                          }`}>
                            {saldo.toLocaleString("pt-BR")}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            size="sm"
                            onClick={() => handleSave(name)}
                            disabled={saving === name}
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {saving === name ? "..." : "Salvar"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Acumulado da Safra = soma de todos os meses. Saldo = Produzido − Embarcado.
        </p>
      </div>
    </div>
  );
}
