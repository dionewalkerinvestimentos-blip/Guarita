import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Settings, Image as ImageIcon, CheckCircle, Loader2, Camera, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEquipment } from "@/hooks/use-supabase";
import type { Equipment as EquipmentType } from "@/lib/supabase";

const Equipment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { records, loading, addRecord, updateRecord, deleteRecord } = useEquipment();
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDeleteEquipment = async (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o equipamento "${name}"?`)) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const purpose = formData.get("purpose") as string;
    
    const recordData = {
      date: formData.get("date") as string,
      photo_url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400",
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      destination: formData.get("destination") as string,
      purpose: purpose,
      donation_to: purpose === "Doação" ? (formData.get("donationTo") as string) : "",
      authorized_by: formData.get("authorizedBy") as string,
      withdrawn_by: formData.get("withdrawnBy") as string,
      status: purpose === "Doação" ? "completed" as const : "pending" as const
    };
    
    try {
      await addRecord(recordData);
      e.currentTarget.reset();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleReturnEquipment = async () => {
    if (!selectedEquipment) return;
    
    const returnDate = (document.getElementById("returnDate") as HTMLInputElement)?.value;
    const returnNotes = (document.getElementById("returnNotes") as HTMLInputElement)?.value;
    
    if (!returnDate) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha a data de retorno.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await updateRecord(selectedEquipment.id, {
        status: "completed",
        return_date: returnDate,
        return_notes: returnNotes
      });
      
      toast({
        title: "Retorno registrado!",
        description: `${selectedEquipment.name} devolvido à unidade.`,
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const pendingRecords = records.filter(r => r.status === "pending");
  const completedRecords = records.filter(r => r.status === "completed");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-muted/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando equipamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-muted/5">
      <header className="border-b bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Settings className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Saída de Equipamentos</h1>
              <p className="text-sm text-muted-foreground">Máquinas e peças</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Registrar Saída
              </CardTitle>
              <CardDescription>Equipamentos, máquinas e peças</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data da Saída</Label>
                  <Input type="date" name="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo">Foto do Item</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-lg">
                    <Input 
                      type="file" 
                      name="photo" 
                      accept="image/*" 
                      capture="environment"
                      className="flex-1 border-none p-0 h-auto" 
                    />
                    <div className="flex gap-1">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <Camera className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selecione arquivo ou use a câmera do dispositivo
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Item</Label>
                    <Input name="name" placeholder="Ex: Motor Hidráulico" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select name="type" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Equipamento">Equipamento</SelectItem>
                        <SelectItem value="Máquina">Máquina</SelectItem>
                        <SelectItem value="Peça">Peça</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="destination">Destino / Prestador</Label>
                    <Input name="destination" placeholder="Local de destino ou nome do prestador" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Finalidade</Label>
                    <Select name="purpose" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Uso interno">Uso interno</SelectItem>
                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                        <SelectItem value="Empréstimo">Empréstimo</SelectItem>
                        <SelectItem value="Doação">Doação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donationTo">Se doação, para quem? (opcional)</Label>
                  <Input name="donationTo" placeholder="Nome da pessoa/empresa" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authorizedBy">Quem Autorizou</Label>
                    <Input name="authorizedBy" placeholder="Nome" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="withdrawnBy">Quem Retirou</Label>
                    <Input name="withdrawnBy" placeholder="Nome" required />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Saída
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lists with Tabs */}
          <div className="space-y-4">
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending" className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground">
                  Pendentes ({pendingRecords.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-success data-[state=active]:text-success-foreground">
                  Concluídos ({completedRecords.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending" className="space-y-4 mt-6">
                {pendingRecords.map((record) => (
                  <Card 
                    key={record.id} 
                    className="border-secondary/20 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedEquipment(record);
                      setIsDialogOpen(true);
                    }}
                  >
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Settings className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-lg">{record.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs font-medium">
                                  {record.type}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-warning/20 text-warning text-xs font-medium">
                                  {record.purpose}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <p className="text-sm text-muted-foreground">
                                {new Date(record.date).toLocaleDateString('pt-BR')}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteEquipment(record.id, record.name);
                                }}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm mt-3">
                            <p><span className="text-muted-foreground">Destino/Prestador:</span> {record.destination}</p>
                            {record.donation_to && (
                              <p><span className="text-muted-foreground">Doado para:</span> {record.donation_to}</p>
                            )}
                            <p><span className="text-muted-foreground">Autorizou:</span> {record.authorized_by}</p>
                            <p><span className="text-muted-foreground">Retirou:</span> {record.withdrawn_by}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingRecords.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      Nenhum equipamento pendente de retorno
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="space-y-4 mt-6">
                {completedRecords.map((record) => (
                  <Card key={record.id} className="border-success/20">
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-8 w-8 text-success" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold text-lg">{record.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded bg-secondary/10 text-secondary text-xs font-medium">
                                  {record.type}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-success/20 text-success text-xs font-medium flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {record.purpose}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <p className="text-sm text-muted-foreground">
                                {new Date(record.date).toLocaleDateString('pt-BR')}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteEquipment(record.id, record.name)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm mt-3">
                            <p><span className="text-muted-foreground">Destino/Prestador:</span> {record.destination}</p>
                            {record.donation_to && (
                              <p><span className="text-muted-foreground">Doado para:</span> {record.donation_to}</p>
                            )}
                            {record.return_date && (
                              <p><span className="text-muted-foreground">Retorno:</span> {new Date(record.return_date).toLocaleDateString('pt-BR')}</p>
                            )}
                            {record.return_notes && (
                              <p><span className="text-muted-foreground">Obs. retorno:</span> {record.return_notes}</p>
                            )}
                            <p><span className="text-muted-foreground">Autorizou:</span> {record.authorized_by}</p>
                            <p><span className="text-muted-foreground">Retirou:</span> {record.withdrawn_by}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {completedRecords.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      Nenhum equipamento concluído
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Dialog for registering return */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Retorno</DialogTitle>
            <DialogDescription>
              {selectedEquipment?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEquipment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnDate">Data de Retorno</Label>
                <Input type="date" id="returnDate" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnNotes">Observações (opcional)</Label>
                <Input id="returnNotes" placeholder="Estado do equipamento, etc." />
              </div>
              <Button 
                onClick={handleReturnEquipment} 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Confirmar Retorno
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipment;
