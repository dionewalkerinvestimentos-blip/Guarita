import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, CloudRain, Droplets, Calendar, Loader2, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRainRecords } from "@/hooks/use-supabase";
import { RainRecord } from "@/lib/supabase";
import { formatDateForDisplay } from "@/lib/date-utils";

const Rain = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { records, loading, addRecord, updateRecord, deleteRecord } = useRainRecords();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RainRecord | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Calcular início e fim da semana atual (segunda a domingo)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda, etc
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Ajusta para segunda-feira
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6); // Domingo
  
  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];

  // Totalizadores
  const todayTotal = records
    .filter(r => r.date === today && r.millimeters !== null)
    .reduce((sum, r) => sum + (r.millimeters || 0), 0);
  
  const weekTotal = records
    .filter(r => r.date >= mondayStr && r.date <= sundayStr && r.millimeters !== null)
    .reduce((sum, r) => sum + (r.millimeters || 0), 0);

  const monthTotal = records
    .filter(r => new Date(r.date).getMonth() === currentMonth && new Date(r.date).getFullYear() === currentYear && r.millimeters !== null)
    .reduce((sum, r) => sum + (r.millimeters || 0), 0);

  const yearTotal = records
    .filter(r => new Date(r.date).getFullYear() === currentYear && r.millimeters !== null)
    .reduce((sum, r) => sum + (r.millimeters || 0), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const mmValue = formData.get("mm") as string;
    const endTimeValue = formData.get("endTime") as string;
    const startTimeValue = formData.get("startTime") as string;

    const recordData = {
      date: formData.get("date") as string,
      start_time: startTimeValue,
      time: startTimeValue, // Adicionado para preencher a coluna NOT NULL
      end_time: endTimeValue || null,
      millimeters: mmValue ? parseFloat(mmValue) : null,
    };

    // Validação para evitar NaN
    if (mmValue && isNaN(recordData.millimeters)) {
        toast({
            title: "Valor inválido",
            description: "Por favor, insira um número válido para os milímetros.",
            variant: "destructive",
        });
        return;
    }

    try {
      await addRecord(recordData);
      e.currentTarget.reset();
      toast({
        title: "Registro de chuva adicionado!",
        description: "A medição foi salva com sucesso.",
      });
    } catch (error) {
      // O erro já é tratado e exibido pelo hook use-supabase
    }
  };

  const handleEditRecord = (record: RainRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecord) return;

    const formData = new FormData(e.currentTarget);
    const mmValue = formData.get("editMm") as string;
    const endTimeValue = formData.get("editEndTime") as string;
    const startTimeValue = formData.get("editStartTime") as string;

    const updatedData = {
      date: formData.get("editDate") as string,
      start_time: startTimeValue,
      time: startTimeValue, // Adicionado para preencher a coluna NOT NULL
      end_time: endTimeValue || null,
      millimeters: mmValue ? parseFloat(mmValue) : null,
    };
    
    // Validação para evitar NaN
    if (mmValue && isNaN(updatedData.millimeters)) {
        toast({
            title: "Valor inválido",
            description: "O campo milímetros deve ser um número.",
            variant: "destructive",
        });
        return;
    }

    try {
      await updateRecord(editingRecord.id, updatedData);
      setIsEditModalOpen(false);
      setEditingRecord(null);
      toast({
        title: "Registro atualizado!",
        description: "O registro de chuva foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao editar registro:', error);
    }
  };

  const handleDeleteRecord = async (id: string, date: string) => {
    if (confirm(`Tem certeza que deseja excluir o registro de chuva de ${new Date(date).toLocaleDateString('pt-BR')}?`)) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Erro ao excluir registro:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando registros de chuva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-info/5 via-background to-primary/5">
      <header className="border-b bg-blue-800 backdrop-blur-sm sticky top-0 z-10 text-white">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white hover:bg-blue-700">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/50 rounded-lg">
              <CloudRain className="w-6 h-6 text-blue-300 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Controle de Chuva</h1>
              <p className="text-sm text-blue-200">Medições pluviométricas - IBA Santa Luzia</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-info">{todayTotal.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Droplets className="w-3 h-3" />
                    Hoje (mm)
                  </p>
                </div>
                <CloudRain className="w-8 h-8 text-info/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-info">{weekTotal.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    Semana (mm)
                  </p>
                </div>
                <CloudRain className="w-8 h-8 text-info/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-info">{monthTotal.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    Mês (mm)
                  </p>
                </div>
                <CloudRain className="w-8 h-8 text-info/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-info/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-info">{yearTotal.toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    Ano (mm)
                  </p>
                </div>
                <CloudRain className="w-8 h-8 text-info/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nova Medição
              </CardTitle>
              <CardDescription>Registre a quantidade de chuva</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input type="date" name="date" required defaultValue={today} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Hora de Início</Label>
                    <Input type="time" name="startTime" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Hora do Fim</Label>
                    <Input type="time" name="endTime" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mm">Milímetros (mm)</Label>
                  <Input type="number" name="mm" step="0.1" placeholder="Opcional no início" />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Medição
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Medições</CardTitle>
                <CardDescription>{records.length} registros</CardDescription>
              </CardHeader>
            </Card>
            {records.map((record) => (
              <Card key={record.id} className="border-info/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-info/10">
                        <Droplets className="w-5 h-5 text-info" />
                      </div>
                      <div>
                        <p className="font-semibold">
                          {formatDateForDisplay(record.date)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {record.start_time ? `${record.start_time}${record.end_time ? ` - ${record.end_time}` : ''}` : record.time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <p className="text-2xl font-bold text-info">{record.millimeters}</p>
                        <p className="text-xs text-muted-foreground">milímetros</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRecord(record.id, record.date)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Registro de Chuva</DialogTitle>
            <DialogDescription>
              Altere os dados do registro de chuva
            </DialogDescription>
          </DialogHeader>

          {editingRecord && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editDate">Data</Label>
                <Input 
                  id="editDate"
                  name="editDate"
                  type="date" 
                  defaultValue={editingRecord.date}
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editStartTime">Hora Inicial</Label>
                  <Input 
                    id="editStartTime"
                    name="editStartTime"
                    type="time" 
                    defaultValue={editingRecord.start_time || editingRecord.time || ""}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEndTime">Hora Final</Label>
                  <Input 
                    id="editEndTime"
                    name="editEndTime"
                    type="time" 
                    defaultValue={editingRecord.end_time || ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editMm">Milímetros</Label>
                <Input 
                  id="editMm"
                  name="editMm"
                  type="number" 
                  step="0.1" 
                  min="0" 
                  defaultValue={editingRecord.millimeters ?? ""}
                  required 
                  placeholder="0.0"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Salvar Alterações
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingRecord(null);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Rain;
