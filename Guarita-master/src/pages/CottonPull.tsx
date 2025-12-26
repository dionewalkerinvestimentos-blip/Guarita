import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Package, Loader2, Trash2, Edit, PauseCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCottonPull, useProducers, usePuxeViagens } from "@/hooks/use-supabase";
import { supabase, CottonPull as CottonPullRecord } from "@/lib/supabase";
import { getTodayLocalDate, formatDateForDisplay } from "@/lib/date-utils";

const CottonPull = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { records, loading, addRecord, updateRecord, deleteRecord } = useCottonPull();
  const { producers, loading: loadingProducers } = useProducers();
  const { addViagem, updateViagem } = usePuxeViagens();
  const [selectedRecord, setSelectedRecord] = useState<CottonPullRecord | null>(null);
  const [exitModalOpen, setExitModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CottonPullRecord | null>(null);
  const [exitRecordId, setExitRecordId] = useState<string>("");
  const [exitTime, setExitTime] = useState("");
  
  const farms = ["CARAJAS", "VENTANIA", "SIMARELLI", "MAMOSE", "JUCARA", "SANTA LUZIA", "SAO JOSE", "TALHAO"];

  // Sistema de autocomplete
  const [savedPlates, setSavedPlates] = useState<string[]>(() => {
    const saved = localStorage.getItem('guarita_saved_plates');
    return saved ? JSON.parse(saved) : [];
  });
  const [savedDrivers, setSavedDrivers] = useState<string[]>(() => {
    const saved = localStorage.getItem('guarita_saved_drivers');
    return saved ? JSON.parse(saved) : [];
  });

  // Detectar se veio do Dashboard para marcar saída
  useEffect(() => {
    const exitId = searchParams.get('exit');
    if (exitId && records.length > 0) {
      const recordToExit = records.find(record => record.id === exitId);
      if (recordToExit) {
        // Marcar saída automaticamente
        const now = new Date();
        const exitTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        
        updateRecord(exitId, { exit_time: exitTime });
        toast({
          title: "Saída registrada!",
          description: `Placa ${recordToExit.plate} - ${recordToExit.producer} marcada como saída às ${exitTime}`,
        });
        
        // Limpar parâmetro da URL
        setSearchParams({});
      }
    }
  }, [searchParams, records, setSearchParams, updateRecord, toast]);

  const handleEditRecord = (record: CottonPullRecord) => {
    setEditingRecord(record);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    const formData = new FormData(e.currentTarget);
    const updates = {
      producer: "Bom Futuro", // Produtor sempre será Bom Futuro
      farm: formData.get("farm") as string,
      talhao: formData.get("talhao") as string || "",
      entry_time: formData.get("entry_time") as string || null,
      exit_time: formData.get("exit_time") as string || null,
      plate: formData.get("plate") as string,
      driver: formData.get("driver") as string,
      rolls: parseInt(formData.get("rolls") as string),
      observations: formData.get("observations") as string,
    };

    console.log('=== DEBUG EDIT ===');
    console.log('Dados do form:', Object.fromEntries(formData.entries()));
    console.log('Updates que serão enviados:', updates);

    try {
      await updateRecord(editingRecord.id, updates);
      setEditModalOpen(false);
      setEditingRecord(null);
      toast({
        title: "Registro atualizado!",
        description: "Alterações salvas com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao editar registro:', error);
    }
  };

  const handleDeleteRecord = async (id: string, plate: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro da placa ${plate}?`)) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Erro ao excluir registro:', error);
      }
    }
  };
  
  // Data de hoje no formato YYYY-MM-DD usando função local
  const today = getTodayLocalDate();
  
  console.log('=== DEBUG COTTON PULL TODAY ===');
  console.log('Today calculado:', today);
  console.log('Registros totais:', records.length);
  console.log('Registros de hoje:', records.filter(r => r.date === today).length);
  
  // Separar registros por status de exit_time
  const pendingExits = records.filter(record => !record.exit_time);
  const completed = records.filter(record => record.exit_time);
  
  // Registros a serem exibidos: todos os pendentes + finalizados de hoje
  const recordsToShow = records.filter(record => 
    !record.exit_time || record.date === today
  );
  
  // Totalizadores baseados nos registros visíveis
  const totalRollsToday = recordsToShow.reduce((sum, record) => sum + record.rolls, 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Validar campos obrigatórios
    const date = formData.get("date") as string;
    const entryTime = formData.get("entryTime") as string;
    const farm = formData.get("farm") as string;
    const plate = formData.get("plate") as string;
    const driver = formData.get("driver") as string;
    const rollsValue = formData.get("rolls") as string;

    if (!date || !entryTime || !farm || !plate || !driver || !rollsValue) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const rolls = parseInt(rollsValue);
    if (isNaN(rolls) || rolls <= 0) {
      toast({
        title: "Valor inválido",
        description: "Número de rolos deve ser um número positivo.",
        variant: "destructive"
      });
      return;
    }
    
    const recordData = {
      date,
      entry_time: entryTime,
      producer: "Bom Futuro", // Produtor sempre será Bom Futuro
      farm,
      talhao: (formData.get("talhao") as string) || "",
      plate: plate.toUpperCase(),
      driver,
      rolls,
      observations: (formData.get("observations") as string) || "",
    };
    
    console.log('=== DEBUG COTTON PULL ===');
    console.log('FormData completo:', Object.fromEntries(formData.entries()));
    console.log('Dados que serão enviados:', recordData);
    console.log('Tipos dos dados:', {
      date: typeof recordData.date,
      entry_time: typeof recordData.entry_time,
      producer: typeof recordData.producer,
      farm: typeof recordData.farm,
      plate: typeof recordData.plate,
      driver: typeof recordData.driver,
      rolls: typeof recordData.rolls,
      observations: typeof recordData.observations
    });
    
    // Salvar dados para autocomplete
    if (plate && !savedPlates.includes(plate.toUpperCase())) {
      const newPlates = [...savedPlates, plate.toUpperCase()];
      setSavedPlates(newPlates);
      localStorage.setItem('guarita_saved_plates', JSON.stringify(newPlates));
    }
    if (driver && !savedDrivers.includes(driver)) {
      const newDrivers = [...savedDrivers, driver];
      setSavedDrivers(newDrivers);
      localStorage.setItem('guarita_saved_drivers', JSON.stringify(newDrivers));
    }

    try {
      const newRecord = await addRecord(recordData);
      
      // Registrar também na tabela de viagens para gestão de tempos
      if (newRecord && newRecord.id) {
        const horaChegada = new Date(`${date}T${entryTime}:00`);
        await addViagem({
          placa: plate.toUpperCase(),
          motorista: driver,
          fazenda_origem: farm,
          data: date,
          hora_chegada: horaChegada.toISOString(),
        });
      }
      
      // Reset do formulário de forma segura
      const form = e.currentTarget;
      if (form) {
        form.reset();
      }
      toast({
        title: "Sucesso!",
        description: "Registro de algodão adicionado com sucesso.",
      });
    } catch (error) {
      console.error('=== ERRO DETALHADO ===');
      console.error('Erro completo:', error);
      console.error('Erro JSON:', JSON.stringify(error, null, 2));
      if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
      }
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o registro. Verifique o console para detalhes.",
        variant: "destructive"
      });
    }
  };

  const handleExit = async (recordId: string) => {
    setExitRecordId(recordId);
    const currentTime = new Date().toTimeString().slice(0, 5);
    setExitTime(currentTime);
    setExitModalOpen(true);
  };

  const handleParadaPuxe = async (recordId: string) => {
    try {
      const currentTime = new Date().toTimeString().slice(0, 8); // HH:MM:SS
      
      // Atualizar o registro com parada_puxe
      await updateRecord(recordId, { 
        parada_puxe: true,
        hora_parada_puxe: currentTime
      });

      const record = records.find(r => r.id === recordId);
      
      toast({
        title: "Parada Puxe registrada! ⏸️",
        description: `${record?.plate} - Tempo pausado às ${currentTime.slice(0, 5)}`,
      });
    } catch (error) {
      console.error('Erro ao registrar parada de puxe:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a parada de puxe.",
        variant: "destructive",
      });
    }
  };

  const confirmExit = async () => {
    if (!exitTime) {
      toast({
        title: "Erro",
        description: "Por favor, informe o horário de saída.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Encontrar o registro que está saindo
      const record = records.find(r => r.id === exitRecordId);
      
      // Atualizar cotton_pull
      await updateRecord(exitRecordId, { exit_time: exitTime });

      // Atualizar também a tabela de viagens com hora de saída
      if (record) {
        const horaSaida = new Date(`${record.date}T${exitTime}:00`);
        
        // Buscar a viagem correspondente na tabela puxe_viagens
        const { data: viagens } = await supabase
          .from('puxe_viagens')
          .select('*')
          .eq('placa', record.plate)
          .eq('data', record.date)
          .is('hora_saida', null)
          .order('hora_chegada', { ascending: false })
          .limit(1);
        
        if (viagens && viagens.length > 0) {
          await updateViagem(viagens[0].id, {
            hora_saida: horaSaida.toISOString()
          });
        }
      }

      toast({
        title: "Saída registrada",
        description: "Veículo registrado como saído com sucesso.",
      });
      
      setExitModalOpen(false);
      setExitRecordId("");
      setExitTime("");
      
    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      toast({
        title: "Erro ao registrar saída",
        description: "Não foi possível registrar a saída do veículo.",
        variant: "destructive",
      });
    }
  };

  if (loading || loadingProducers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando registros de algodão...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-accent/5">
      <header className="border-b bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Package className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Puxe de Algodão da Lavoura</h1>
              <p className="text-sm text-muted-foreground">Registro de rolos</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{totalRollsToday}</p>
                <p className="text-sm text-muted-foreground">Total de Rolos Hoje</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{recordsToShow.length}</p>
                <p className="text-sm text-muted-foreground">Carregamentos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">
                  {new Set(recordsToShow.map(r => r.producer)).size}
                </p>
                <p className="text-sm text-muted-foreground">Produtoras</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Registrar Puxe</span>
            </CardTitle>
            <CardDescription>Preencha os dados do puxe de algodão</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input type="date" name="date" required defaultValue={getTodayLocalDate()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entryTime">Hora da Entrada</Label>
                <Input type="time" name="entryTime" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farm">Fazenda</Label>
                <Select name="farm" required>
                  <SelectTrigger><SelectValue placeholder="Selecione a fazenda" /></SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm} value={farm}>{farm}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="talhao">Talhão</Label>
                <Input name="talhao" placeholder="Digite o talhão" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plate">Placa do Caminhão</Label>
                <Input 
                  name="plate" 
                  placeholder="ABC-1234" 
                  required 
                  list="plates-list"
                  style={{ textTransform: 'uppercase' }}
                />
                <datalist id="plates-list">
                  {savedPlates.map((plate) => <option key={plate} value={plate} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="driver">Nome do Motorista</Label>
                <Input 
                  name="driver" 
                  placeholder="Nome completo" 
                  required 
                  list="drivers-list"
                />
                <datalist id="drivers-list">
                  {savedDrivers.map((driver) => <option key={driver} value={driver} />)}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rolls">Quantidade de Rolos</Label>
                <Input type="number" name="rolls" placeholder="0" required min="1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea name="observations" placeholder="Informações adicionais (opcional)" />
              </div>
              <div className="md:col-span-2 lg:col-span-4">
                <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Puxe
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-1 gap-6">
          {/* Pending Exits */}
          {pendingExits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Aguardando Saída ({pendingExits.length})</CardTitle>
                <CardDescription>Veículos que entraram mas ainda não saíram</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingExits.map((record) => {
                    // Calcular tempo de permanência
                    const entryTime = new Date(`1970-01-01T${record.entry_time}`);
                    const now = new Date();
                    
                    // Se tem parada_puxe, usar hora_parada_puxe para calcular tempo
                    const endTime = record.parada_puxe && record.hora_parada_puxe
                      ? new Date(`1970-01-01T${record.hora_parada_puxe}`)
                      : new Date(`1970-01-01T${now.toTimeString().slice(0, 8)}`);
                    
                    const diffMs = endTime.getTime() - entryTime.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                    
                    return (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                        <div className="flex-1">
                          <p className="font-medium">{record.plate} - {record.driver}</p>
                          <p className="text-sm text-muted-foreground">{record.farm} | {record.rolls} rolos</p>
                          {record.parada_puxe ? (
                            <div className="space-y-1">
                              <p className="text-sm text-yellow-700 font-medium flex items-center gap-1">
                                <PauseCircle className="h-3 w-3" />
                                Parada Puxe ⏸️ (aguardando retomada)
                              </p>
                              <p className="text-sm text-muted-foreground italic">
                                Entrada: {record.entry_time} | Parada: {record.hora_parada_puxe?.slice(0, 5)} | Permanência: {diffHours}h {diffMins}min
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-orange-600">
                              Entrada: {record.entry_time} | Permanência: {diffHours}h {diffMins}min
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRecord(record.id, record.plate)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {!record.parada_puxe && (
                            <Button 
                              onClick={() => handleParadaPuxe(record.id)}
                              size="sm"
                              variant="outline"
                              className="bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-700 border-yellow-400"
                            >
                              <PauseCircle className="h-4 w-4 mr-1" />
                              Parada Puxe
                            </Button>
                          )}
                          <Button 
                            onClick={() => handleExit(record.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Registrar Saída
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Registros de Hoje</CardTitle>
                    <CardDescription>{recordsToShow.length} puxes realizados - Total: {totalRollsToday} rolos</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/cotton-pull/history")}
                    className="flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Histórico de Carregamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recordsToShow.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="w-12 h-12 mx-auto mb-4" />
                    <p>Nenhum registro de algodão encontrado</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Data</th>
                          <th className="text-left p-3 font-semibold">Entrada</th>
                          <th className="text-left p-3 font-semibold">Saída</th>
                          <th className="text-left p-3 font-semibold">Permanência</th>
                          <th className="text-left p-3 font-semibold">Placa</th>
                          <th className="text-left p-3 font-semibold">Motorista</th>
                          <th className="text-left p-3 font-semibold">Produtor/Fazenda</th>
                          <th className="text-center p-3 font-semibold">Rolos</th>
                          <th className="text-center p-3 font-semibold">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recordsToShow.map((record) => {
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
                              <td className="p-3 font-medium">
                                {formatDateForDisplay(record.date)}
                              </td>
                              <td className="p-3">{record.entry_time}</td>
                              <td className="p-3">
                                {record.exit_time ? (
                                  <span className="text-green-600 font-medium">{record.exit_time}</span>
                                ) : (
                                  <span className="text-orange-600">Em andamento</span>
                                )}
                              </td>
                              <td className="p-3 text-green-600 font-medium">{permanencia}</td>
                              <td className="p-3 font-medium">{record.plate}</td>
                              <td className="p-3">{record.driver}</td>
                              <td className="p-3">
                                <div>
                                  <span className="font-medium">{record.producer}</span>
                                  <br />
                                  <span className="text-muted-foreground text-xs">{record.farm}</span>
                                  {record.talhao && <span className="text-muted-foreground text-xs"> - {record.talhao}</span>}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                  {record.rolls}
                                </span>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditRecord(record)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteRecord(record.id, record.plate)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      {/* Modal de confirmação de saída */}
      <Dialog open={exitModalOpen} onOpenChange={setExitModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Horário de Saída</DialogTitle>
            <DialogDescription>
              Informe o horário de saída do veículo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="exit-time">Horário de Saída</Label>
              <Input
                id="exit-time"
                type="time"
                value={exitTime}
                onChange={(e) => setExitTime(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExitModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmExit} className="bg-green-600 hover:bg-green-700">
              Confirmar Saída
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Registro de Algodão</DialogTitle>
            <DialogDescription>
              Edite as informações do registro de puxe de algodão.
            </DialogDescription>
          </DialogHeader>
          
          {editingRecord && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-farm">Fazenda/Produtor</Label>
                <Select name="farm" defaultValue={editingRecord.farm}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map(farm => (
                      <SelectItem key={farm} value={farm}>{farm}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-talhao">Talhão (opcional)</Label>
                <Input
                  id="edit-talhao"
                  name="talhao"
                  defaultValue={editingRecord.talhao || ""}
                  placeholder="Ex: T001, T002..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-entry-time">Hora Entrada</Label>
                  <Input
                    id="edit-entry-time"
                    name="entry_time"
                    type="time"
                    defaultValue={editingRecord.entry_time || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-exit-time">Hora Saída</Label>
                  <Input
                    id="edit-exit-time"
                    name="exit_time"
                    type="time"
                    defaultValue={editingRecord.exit_time || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-plate">Placa</Label>
                <Input
                  id="edit-plate"
                  name="plate"
                  defaultValue={editingRecord.plate}
                  placeholder="XXX-0000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-driver">Motorista</Label>
                <Input
                  id="edit-driver"
                  name="driver"
                  defaultValue={editingRecord.driver}
                  placeholder="Nome do motorista"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-rolls">Quantidade de Rolos</Label>
                <Input
                  id="edit-rolls"
                  name="rolls"
                  type="number"
                  defaultValue={editingRecord.rolls}
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-observations">Observações</Label>
                <Textarea
                  id="edit-observations"
                  name="observations"
                  defaultValue={editingRecord.observations || ""}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CottonPull;
