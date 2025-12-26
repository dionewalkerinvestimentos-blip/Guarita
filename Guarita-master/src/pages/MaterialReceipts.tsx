import { useState } from "react";
import { ArrowLeft, Plus, Package, Clock, Edit2, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MaterialReceipt } from "@/lib/supabase";
import { useMaterialReceipts } from "@/hooks/use-material-receipts";
import { getTodayLocalDate, normalizeLocalDate, formatDateForDisplay } from "@/lib/date-utils";

const MaterialReceipts = () => {
  const { records, loading, addRecord, updateRecord, deleteRecord } = useMaterialReceipts();
  const [selectedRecord, setSelectedRecord] = useState<MaterialReceipt | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const materialTypes = [
    "Areia",
    "Cascalho", 
    "Cavaco",
    "Pedra Brita",
    "Pó de Pedra",
    "Álcool"
  ];

  const unitTypes = [
    { value: "KG", label: "Peso (KG)" },
    { value: "M3", label: "Volume (M³)" },
    { value: "M2", label: "Área (M²)" },
    { value: "LITROS", label: "Volume (Litros)" }
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const quantity = parseFloat(formData.get("quantity") as string);
    const unitType = formData.get("unit_type") as MaterialReceipt['unit_type'];
    
    const recordData: Omit<MaterialReceipt, 'id' | 'created_at' | 'updated_at'> = {
      date: normalizeLocalDate(formData.get("date") as string),
      entry_time: formData.get("time") as string,
      material_type: formData.get("material_type") as string,
      plate: formData.get("plate") as string,
      driver: formData.get("driver") as string,
      supplier: (formData.get("supplier") as string) || undefined,
      unit_type: unitType,
      observations: (formData.get("observations") as string) || "",
      net_weight: quantity, // Sempre obrigatório
    };

    // Adicionar quantidade baseada no tipo de unidade
    if (unitType === "M3") {
      recordData.volume_m3 = quantity;
    } else if (unitType === "M2") {
      recordData.volume_m2 = quantity;
    } else if (unitType === "LITROS") {
      recordData.volume_liters = quantity;
    }

    try {
      if (selectedRecord) {
        await updateRecord(selectedRecord.id, recordData);
        setIsEditModalOpen(false);
      } else {
        await addRecord(recordData);
        setIsCreateModalOpen(false);
      }
      setSelectedRecord(null);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este registro?")) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Erro ao deletar:', error);
      }
    }
  };

  const handleMarkExit = async (id: string) => {
    const now = new Date();
    const exitTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    try {
      await updateRecord(id, { exit_time: exitTime });
    } catch (error) {
      console.error('Erro ao marcar saída:', error);
    }
  };

  const getQuantityValue = (record: MaterialReceipt) => {
    switch (record.unit_type) {
      case "KG": return record.net_weight || 0;
      case "M3": return record.volume_m3 || 0;
      case "M2": return record.volume_m2 || 0;
      case "LITROS": return record.volume_liters || 0;
      default: return 0;
    }
  };

  const formatQuantity = (record: MaterialReceipt) => {
    const value = getQuantityValue(record);
    return `${value.toLocaleString('pt-BR')} ${record.unit_type}`;
  };

  // Estatísticas do dia
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === today);
  const totalMaterials = materialTypes.map(type => ({
    type,
    count: todayRecords.filter(r => r.material_type === type).length,
    records: todayRecords.filter(r => r.material_type === type)
  })).filter(item => item.count > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p>Carregando materiais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline" 
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="w-8 h-8 text-orange-600" />
              Recebimento de Materiais
            </h1>
            <p className="text-muted-foreground">Controle de entrada de materiais e insumos</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Recebimento
        </Button>
      </div>

      {/* Estatísticas do Dia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Hoje</CardTitle>
            <CardDescription>Total de recebimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayRecords.length}</div>
          </CardContent>
        </Card>
        
        {totalMaterials.slice(0, 3).map(({ type, count }) => (
          <Card key={type}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{type}</CardTitle>
              <CardDescription>Recebimentos hoje</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Materiais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Materiais Recebidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum material registrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records
                .sort((a, b) => {
                  // Pendentes primeiro, depois por data/hora mais recente
                  if (!a.exit_time && b.exit_time) return -1;
                  if (a.exit_time && !b.exit_time) return 1;
                  return new Date(`${b.date} ${b.entry_time}`).getTime() - new Date(`${a.date} ${a.entry_time}`).getTime();
                })
                .map((record) => (
                <div key={record.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-orange-50 border-orange-200">
                          {record.material_type}
                        </Badge>
                        <Badge variant="secondary">{formatQuantity(record)}</Badge>
                        <Badge variant={record.exit_time ? "default" : "destructive"}>
                          {record.exit_time ? "Concluído" : "Pendente"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDateForDisplay(record.date)} às {record.entry_time}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">Placa:</span> {record.plate}</div>
                        <div><span className="font-medium">Motorista:</span> {record.driver}</div>
                      </div>
                      {record.exit_time && (
                        <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                          <span className="font-medium">Saída:</span> {record.exit_time}
                        </div>
                      )}
                      {record.observations && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Obs:</span> {record.observations}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {!record.exit_time && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkExit(record.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Marcar Saída
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(record.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar/Editar */}
      <Dialog 
        key={selectedRecord?.id || 'new'} 
        open={isCreateModalOpen || isEditModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
            setSelectedRecord(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord ? "Editar Material" : "Novo Recebimento"}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord ? "Altere as informações do material" : "Registre o recebimento de material"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Data</Label>
                <Input 
                  name="date" 
                  type="date" 
                  defaultValue={selectedRecord?.date || getTodayLocalDate()}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="time">Hora</Label>
                <Input 
                  name="time" 
                  type="time" 
                  defaultValue={selectedRecord?.entry_time || new Date().toTimeString().slice(0,5)}
                  required 
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="material_type">Tipo de Material</Label>
              <Select name="material_type" defaultValue={selectedRecord?.material_type} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o material" />
                </SelectTrigger>
                <SelectContent>
                  {materialTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="plate">Placa</Label>
                <Input 
                  name="plate" 
                  placeholder="ABC-1234" 
                  defaultValue={selectedRecord?.plate}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="driver">Motorista</Label>
                <Input 
                  name="driver" 
                  placeholder="Nome do motorista" 
                  defaultValue={selectedRecord?.driver}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="supplier">Fornecedor</Label>
                <Input 
                  name="supplier" 
                  placeholder="Nome do fornecedor" 
                  defaultValue={selectedRecord?.supplier}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit_type">Unidade</Label>
                <Select name="unit_type" defaultValue={selectedRecord?.unit_type} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de medida" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input 
                  name="quantity" 
                  type="number" 
                  step="0.001"
                  placeholder="0.000" 
                  defaultValue={selectedRecord ? getQuantityValue(selectedRecord) : ""}
                  required 
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea 
                name="observations" 
                placeholder="Observações adicionais (opcional)"
                defaultValue={selectedRecord?.observations}
                className="min-h-[80px]"
              />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">
                {selectedRecord ? "Atualizar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MaterialReceipts;