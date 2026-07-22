import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { TopNav } from "@/components/TopNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, RefreshCw } from "lucide-react";

interface ProductBalance {
  id?: string;
  product: string;
  unit_type: string;
  month: number;
  year: number;
  produzido: number;
  embarcado: number;
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

export default function Saldos() {
  const { toast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [balances, setBalances] = useState<Record<string, ProductBalance>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

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
      // Garantir todos os produtos existem no estado
      PRODUCTS.forEach(({ name, unit }) => {
        if (!map[name]) {
          map[name] = { product: name, unit_type: unit, month: selectedMonth, year: selectedYear, produzido: 0, embarcado: 0 };
        }
      });
      setBalances(map);
    } else {
      // Inicializar com zeros se não houver dados
      const map: Record<string, ProductBalance> = {};
      PRODUCTS.forEach(({ name, unit }) => {
        map[name] = { product: name, unit_type: unit, month: selectedMonth, year: selectedYear, produzido: 0, embarcado: 0 };
      });
      setBalances(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalances();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

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
      <div className="container mx-auto p-4 md:p-6 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Saldos de Produção</h1>
          <Button variant="outline" size="sm" onClick={fetchBalances} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Seletor de mês/ano */}
        <div className="flex gap-3 mb-6">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="border rounded px-3 py-2 bg-background text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border rounded px-3 py-2 bg-background text-sm"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Tabela */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {MONTHS[selectedMonth - 1]} / {selectedYear}
            </CardTitle>
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
                    <th className="text-center p-3 text-sm font-semibold">Saldo</th>
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
          Saldo = Produzido − Embarcado. Os valores aparecem automaticamente no Painel TV.
        </p>
      </div>
    </div>
  );
}
