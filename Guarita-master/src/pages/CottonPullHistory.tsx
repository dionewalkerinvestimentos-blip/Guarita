import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, Loader2, Filter } from "lucide-react";
import { useCottonPull } from "@/hooks/use-supabase";
import { formatDateForDisplay } from "@/lib/date-utils";

// Função para formatar data com dia da semana SEM conversão UTC
const formatDateLong = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  // Criar data no meio-dia para evitar problemas de timezone
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return date.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};


const CottonPullHistory = () => {
  const navigate = useNavigate();
  const { records, loading } = useCottonPull();
  
  // Debug: ver datas dos registros
  console.log('📊 Cotton Pull Records:', records.slice(0, 5).map(r => ({
    date: r.date,
    plate: r.plate,
    entry_time: r.entry_time,
    exit_time: r.exit_time
  })));
  
  // Estados para filtros
  const [dateFilter, setDateFilter] = useState("");
  const [producerFilter, setProducerFilter] = useState("all");
  const [plateFilter, setPlateFilter] = useState("");
  
  // Obter lista única de produtores
  const producers = useMemo(() => {
    const uniqueProducers = Array.from(new Set(records.map(r => r.producer)));
    return uniqueProducers.sort();
  }, [records]);
  
  // Aplicar filtros
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesDate = !dateFilter || record.date === dateFilter;
      const matchesProducer = producerFilter === "all" || record.producer === producerFilter;
      const matchesPlate = !plateFilter || record.plate.toLowerCase().includes(plateFilter.toLowerCase());
      
      return matchesDate && matchesProducer && matchesPlate;
    });
  }, [records, dateFilter, producerFilter, plateFilter]);
  
  // Agrupar por data
  const recordsByDate = useMemo(() => {
    const grouped: Record<string, typeof records> = {};
    
    filteredRecords.forEach(record => {
      if (!grouped[record.date]) {
        grouped[record.date] = [];
      }
      grouped[record.date].push(record);
    });
    
    return grouped;
  }, [filteredRecords]);
  
  // Calcular totalizadores
  const totals = useMemo(() => {
    return {
      totalRecords: filteredRecords.length,
      totalRolls: filteredRecords.reduce((sum, r) => sum + r.rolls, 0),
      totalProducers: new Set(filteredRecords.map(r => r.producer)).size,
    };
  }, [filteredRecords]);
  
  // Calcular totalizadores por produtor
  const totalsByProducer = useMemo(() => {
    const byProducer: Record<string, { rolls: number; trucks: number }> = {};
    
    filteredRecords.forEach(record => {
      if (!byProducer[record.producer]) {
        byProducer[record.producer] = { rolls: 0, trucks: 0 };
      }
      byProducer[record.producer].rolls += record.rolls;
      byProducer[record.producer].trucks += 1;
    });
    
    return byProducer;
  }, [filteredRecords]);
  
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
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5">
      <header className="border-b bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/cotton-pull")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Package className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Histórico de Carregamento</h1>
              <p className="text-sm text-muted-foreground">Todos os registros de algodão</p>
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
                <p className="text-3xl font-bold text-secondary">{totals.totalRolls}</p>
                <p className="text-sm text-muted-foreground">Total de Rolos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{totals.totalRecords}</p>
                <p className="text-sm text-muted-foreground">Total de Caminhões</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{totals.totalProducers}</p>
                <p className="text-sm text-muted-foreground">Produtoras</p>
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
            <CardDescription>Filtre os registros por data, produtor ou placa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFilter">Data</Label>
                <Input 
                  id="dateFilter"
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  placeholder="Filtrar por data"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="producerFilter">Produtor/Fazenda</Label>
                <Select value={producerFilter} onValueChange={setProducerFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produtor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {producers.map((producer) => (
                      <SelectItem key={producer} value={producer}>{producer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateFilter">Placa</Label>
                <Input 
                  id="plateFilter"
                  type="text" 
                  value={plateFilter}
                  onChange={(e) => setPlateFilter(e.target.value)}
                  placeholder="Digite a placa"
                />
              </div>
            </div>
            {(dateFilter || producerFilter !== "all" || plateFilter) && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDateFilter("");
                    setProducerFilter("all");
                    setPlateFilter("");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Totalizadores por Produtor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Totalizadores por Produtor/Fazenda</CardTitle>
            <CardDescription>Resumo dos carregamentos por origem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Produtor/Fazenda</th>
                    <th className="text-center p-3 font-semibold">Nº Caminhões</th>
                    <th className="text-center p-3 font-semibold">Total Rolos</th>
                    <th className="text-center p-3 font-semibold">Média Rolos/Caminhão</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(totalsByProducer).sort((a, b) => b[1].rolls - a[1].rolls).map(([producer, data]) => (
                    <tr key={producer} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{producer}</td>
                      <td className="p-3 text-center">{data.trucks}</td>
                      <td className="p-3 text-center font-bold text-secondary">{data.rolls}</td>
                      <td className="p-3 text-center">{(data.rolls / data.trucks).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Registros Agrupados por Data */}
        <div className="space-y-6">
          {(() => {
            const sortedDates = Object.entries(recordsByDate).sort((a, b) => b[0].localeCompare(a[0]));
            console.log('🗓️ Datas no histórico:', sortedDates.map(([date, recs]) => ({
              data: date,
              dataFormatada: formatDateLong(date),
              quantidade: recs.length
            })));
            return sortedDates;
          })().map(([date, dateRecords]) => {
            const dateTotal = dateRecords.reduce((sum, r) => sum + r.rolls, 0);
            
            return (
              <Card key={date}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{formatDateLong(date)}</CardTitle>
                      <CardDescription>
                        {dateRecords.length} caminhões - {dateTotal} rolos
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Entrada</th>
                          <th className="text-left p-3 font-semibold">Saída</th>
                          <th className="text-left p-3 font-semibold">Permanência</th>
                          <th className="text-left p-3 font-semibold">Placa</th>
                          <th className="text-left p-3 font-semibold">Motorista</th>
                          <th className="text-left p-3 font-semibold">Produtor/Fazenda</th>
                          <th className="text-center p-3 font-semibold">Rolos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dateRecords.map((record) => {
                          const permanencia = record.exit_time ? (() => {
                            try {
                              const entryTime = new Date(`1970-01-01T${record.entry_time}`);
                              const exitTime = new Date(`1970-01-01T${record.exit_time}`);
                              let diffMs = exitTime.getTime() - entryTime.getTime();
                              
                              if (diffMs < 0) {
                                diffMs += 24 * 60 * 60 * 1000;
                              }
                              
                              const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                              return `${diffHours}h ${diffMins}min`;
                            } catch (error) {
                              return "Erro";
                            }
                          })() : '-';

                          return (
                            <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="p-3">{record.entry_time}</td>
                              <td className="p-3">
                                {record.exit_time ? (
                                  <span className="text-green-600 font-medium">{record.exit_time}</span>
                                ) : (
                                  <span className="text-orange-600">Em andamento</span>
                                )}
                              </td>
                              <td className="p-3">{permanencia}</td>
                              <td className="p-3 font-medium">{record.plate}</td>
                              <td className="p-3">{record.driver}</td>
                              <td className="p-3">{record.producer}</td>
                              <td className="p-3 text-center font-bold text-secondary">{record.rolls}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredRecords.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4" />
                <p>Nenhum registro encontrado com os filtros aplicados</p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CottonPullHistory;
