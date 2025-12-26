import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Container, Loader2, Filter, TrendingUp } from "lucide-react";
import { useLoadingRecords } from "@/hooks/use-supabase";

const LoadingHistory = () => {
  const navigate = useNavigate();
  const { records, loading } = useLoadingRecords();
  
  // Estados para filtros
  const [dateFilter, setDateFilter] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [plateFilter, setPlateFilter] = useState("");
  
  // Obter lista única de produtos
  const products = useMemo(() => {
    const uniqueProducts = Array.from(new Set(records.map(r => r.product)));
    return uniqueProducts.sort();
  }, [records]);
  
  // Aplicar filtros
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // Filtrar apenas registros com saída (concluídos)
      if (!record.exit_date) return false;
      
      const matchesDate = !dateFilter || record.exit_date === dateFilter;
      const matchesProduct = productFilter === "all" || record.product === productFilter;
      const matchesPlate = !plateFilter || record.plate.toLowerCase().includes(plateFilter.toLowerCase());
      
      return matchesDate && matchesProduct && matchesPlate;
    });
  }, [records, dateFilter, productFilter, plateFilter]);
  
  // Agrupar por data de saída
  const recordsByDate = useMemo(() => {
    const grouped: Record<string, typeof records> = {};
    
    filteredRecords.forEach(record => {
      const exitDate = record.exit_date!;
      if (!grouped[exitDate]) {
        grouped[exitDate] = [];
      }
      grouped[exitDate].push(record);
    });
    
    return grouped;
  }, [filteredRecords]);
  
  // Calcular totalizadores
  const totals = useMemo(() => {
    return {
      totalRecords: filteredRecords.length,
      totalWeight: filteredRecords.reduce((sum, r) => sum + (r.weight || 0), 0),
      totalBales: filteredRecords.reduce((sum, r) => sum + (r.bales || 0), 0),
    };
  }, [filteredRecords]);
  
  // Calcular totalizadores por produto
  const totalsByProduct = useMemo(() => {
    const byProduct: Record<string, { weight: number; bales: number; trucks: number; avgWeight: number }> = {};
    
    filteredRecords.forEach(record => {
      if (!byProduct[record.product]) {
        byProduct[record.product] = { weight: 0, bales: 0, trucks: 0, avgWeight: 0 };
      }
      byProduct[record.product].weight += record.weight || 0;
      byProduct[record.product].bales += record.bales || 0;
      byProduct[record.product].trucks += 1;
    });
    
    // Calcular média de peso por caminhão
    Object.keys(byProduct).forEach(product => {
      if (byProduct[product].trucks > 0) {
        byProduct[product].avgWeight = byProduct[product].weight / byProduct[product].trucks;
      }
    });
    
    return byProduct;
  }, [filteredRecords]);
  
  const calculatePermanenceTime = (entryDate?: string, entryTime?: string, exitDate?: string, exitTime?: string) => {
    if (!entryDate || !entryTime || !exitDate || !exitTime) return "-";
    
    const entry = new Date(`${entryDate}T${entryTime}`);
    const exit = new Date(`${exitDate}T${exitTime}`);
    
    const diffMs = exit.getTime() - entry.getTime();
    if (diffMs < 0) return "-";
    
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando histórico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-background to-blue-50">
      <header className="border-b bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/loading")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Container className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Histórico de Carregamentos</h1>
              <p className="text-sm text-muted-foreground">Todos os carregamentos concluídos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Totalizadores Gerais */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{totals.totalRecords}</p>
                <p className="text-sm text-muted-foreground">Total de Carregamentos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{totals.totalWeight.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Total de Peso (kg)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{totals.totalBales}</p>
                <p className="text-sm text-muted-foreground">Total de Fardos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
            <CardDescription>Filtre os carregamentos por data de saída, produto ou placa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFilter">Data de Saída</Label>
                <Input 
                  id="dateFilter"
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productFilter">Produto</Label>
                <Select value={productFilter} onValueChange={setProductFilter}>
                  <SelectTrigger id="productFilter">
                    <SelectValue placeholder="Todos os produtos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os produtos</SelectItem>
                    {products.map(product => (
                      <SelectItem key={product} value={product}>{product}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateFilter">Placa</Label>
                <Input 
                  id="plateFilter"
                  type="text" 
                  placeholder="Ex: ABC1234"
                  value={plateFilter}
                  onChange={(e) => setPlateFilter(e.target.value)}
                />
              </div>
            </div>
            {(dateFilter || productFilter !== "all" || plateFilter) && (
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setDateFilter("");
                    setProductFilter("all");
                    setPlateFilter("");
                  }}
                >
                  Limpar Filtros
                </Button>
                <p className="text-sm text-muted-foreground flex items-center">
                  {filteredRecords.length} registro(s) encontrado(s)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totalizadores por Produto */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Totais por Produto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Produto</th>
                    <th className="text-right p-3 font-semibold">Caminhões</th>
                    <th className="text-right p-3 font-semibold">Peso Total (kg)</th>
                    <th className="text-right p-3 font-semibold">Fardos</th>
                    <th className="text-right p-3 font-semibold">Média por Caminhão</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(totalsByProduct)
                    .sort(([, a], [, b]) => b.weight - a.weight)
                    .map(([product, data]) => (
                      <tr key={product} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                            product === 'Caroço' ? 'bg-red-100 text-red-800' :
                            product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                            product === 'Briquete' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {product}
                          </span>
                        </td>
                        <td className="text-right p-3 font-medium">{data.trucks}</td>
                        <td className="text-right p-3 font-medium">{data.weight.toFixed(0)}</td>
                        <td className="text-right p-3 font-medium">{data.bales}</td>
                        <td className="text-right p-3 text-muted-foreground">
                          {data.avgWeight > 0 ? `${data.avgWeight.toFixed(0)} kg` : '-'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Registros Agrupados por Data */}
        <div className="space-y-6">
          {Object.keys(recordsByDate)
            .sort((a, b) => b.localeCompare(a))
            .map(date => {
              const dayRecords = recordsByDate[date];
              const dayTotal = dayRecords.reduce((sum, r) => sum + (r.weight || 0), 0);
              const dayBales = dayRecords.reduce((sum, r) => sum + (r.bales || 0), 0);
              
              return (
                <Card key={date}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</span>
                      <div className="flex gap-4 text-sm font-normal text-muted-foreground">
                        <span>{dayRecords.length} carregamento(s)</span>
                        <span>{dayTotal.toFixed(0)} kg</span>
                        <span>{dayBales} fardos</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-sm">
                            <th className="text-left p-2 font-semibold">Produto</th>
                            <th className="text-left p-2 font-semibold">Placa</th>
                            <th className="text-left p-2 font-semibold">Motorista</th>
                            <th className="text-left p-2 font-semibold">Transportadora</th>
                            <th className="text-left p-2 font-semibold">Destino</th>
                            <th className="text-left p-2 font-semibold">Entrada</th>
                            <th className="text-left p-2 font-semibold">Saída</th>
                            <th className="text-left p-2 font-semibold">Permanência</th>
                            <th className="text-right p-2 font-semibold">Peso/Fardos</th>
                            <th className="text-left p-2 font-semibold">NF</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dayRecords
                            .sort((a, b) => (b.exit_time || '').localeCompare(a.exit_time || ''))
                            .map(record => (
                              <tr key={record.id} className="border-b hover:bg-gray-50 text-sm">
                                <td className="p-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    record.product === 'Pluma' ? 'bg-yellow-100 text-yellow-800' :
                                    record.product === 'Caroço' ? 'bg-red-100 text-red-800' :
                                    record.product === 'Fibrilha' ? 'bg-green-100 text-green-800' :
                                    record.product === 'Briquete' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {record.product}
                                  </span>
                                </td>
                                <td className="p-2 font-medium">{record.plate}</td>
                                <td className="p-2">{record.driver}</td>
                                <td className="p-2">{record.carrier}</td>
                                <td className="p-2 text-xs">{record.destination}</td>
                                <td className="p-2 text-xs">
                                  {record.entry_date && record.entry_time 
                                    ? `${new Date(record.entry_date).toLocaleDateString('pt-BR')} ${record.entry_time}`
                                    : '-'
                                  }
                                </td>
                                <td className="p-2 text-xs text-green-600 font-medium">
                                  {record.exit_time || '-'}
                                </td>
                                <td className="p-2 text-xs">
                                  {calculatePermanenceTime(record.entry_date, record.entry_time, record.exit_date, record.exit_time)}
                                </td>
                                <td className="p-2 text-right">
                                  {record.weight ? `${record.weight.toFixed(0)} kg` : record.bales ? `${record.bales} fardos` : '-'}
                                </td>
                                <td className="p-2 text-xs">{record.invoice_number || '-'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          
          {Object.keys(recordsByDate).length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum carregamento concluído encontrado com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default LoadingHistory;
