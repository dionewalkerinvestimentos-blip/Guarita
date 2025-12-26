import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Settings, Edit, CheckCircle, Loader2, Camera, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEquipment } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { getTodayLocalDate, normalizeLocalDate, toLocalIsoWithOffset, convertIsoToLocalDateString, formatDateForDisplay } from "@/lib/date-utils";
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

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EquipmentType | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);

  const openEdit = (record: EquipmentType) => {
    setEditRecord(record);
    setEditPreview(record.photo_url || null);
    setIsEditOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditPreview(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editRecord) return;

    const fd = new FormData(e.currentTarget);
    const name = (fd.get('name') as string) || editRecord.name;
    const type = (fd.get('type') as string) || editRecord.type;
    const destination = (fd.get('destination') as string) || editRecord.destination;
    const purpose = (fd.get('purpose') as string) || editRecord.purpose || '';
    const authorized_by = (fd.get('authorizedBy') as string) || editRecord.authorized_by;
    const withdrawn_by = (fd.get('withdrawnBy') as string) || editRecord.withdrawn_by;
    const dateRaw = fd.get('date') as string;

    const rawDate = dateRaw ? normalizeLocalDate(dateRaw) : getTodayLocalDate();
    const isoDate = toLocalIsoWithOffset(rawDate);

    const file = fd.get('photo') as File | null;
    const updates: Partial<EquipmentType> = {
      name,
      type,
      destination,
      purpose,
      authorized_by,
      withdrawn_by,
      date: isoDate
    };

    try {
      if (file && file instanceof File) {
        const ext = (file.name.split('.').pop() || 'jpg').split('?')[0];
        const filePath = `equipment/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('equipment-photos').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: publicData } = await supabase.storage.from('equipment-photos').getPublicUrl(filePath);
        const publicUrl = (publicData as any)?.publicUrl || (publicData as any)?.public_url;
        if (publicUrl) updates.photo_url = publicUrl;
      }

      await updateRecord(editRecord.id, updates);
      setIsEditOpen(false);
      setEditRecord(null);
      toast({ title: 'Registro atualizado', description: `${name} atualizado com sucesso.` });
    } catch (err) {
      console.error('Erro ao editar equipamento:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const purpose = formData.get("purpose") as string;
    
    const recordDate = formData.get("date") as string;
    const rawDate = recordDate ? normalizeLocalDate(recordDate) : getTodayLocalDate();
    const isoDate = toLocalIsoWithOffset(rawDate);
    const recordData: any = {
      date: isoDate,
      name: formData.get("name") as string,
      type: formData.get("type") as string,
      destination: formData.get("destination") as string,
      purpose: purpose,
      donation_to: purpose === "Doação" ? (formData.get("donationTo") as string) : "",
      authorized_by: formData.get("authorizedBy") as string,
      withdrawn_by: formData.get("withdrawnBy") as string,
      status: purpose === "Doação" ? "completed" as const : "pending" as const
    };

    const file = formData.get('photo') as File | null;

    if (file && file instanceof File) {
      try {
        // create data URL for immediate preview
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
        recordData.photo_url = dataUrl;
      } catch (err) {
        console.error('Erro ao ler arquivo para preview:', err);
        recordData.photo_url = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400";
      }
    } else {
      recordData.photo_url = "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400";
    }

    let created: any = null;
    try {
      created = await addRecord(recordData);
      e.currentTarget.reset();
    } catch (err) {
      console.error('Erro ao criar equipamento:', err);
    }

    // attempt upload and update created record with public url
    if (file && file instanceof File && created && created.id) {
      try {
        const ext = (file.name.split('.').pop() || 'jpg').split('?')[0];
        const filePath = `equipment/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('equipment-photos').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: publicData } = await supabase.storage.from('equipment-photos').getPublicUrl(filePath);
        const publicUrl = (publicData as any)?.publicUrl || (publicData as any)?.public_url;
        if (publicUrl) {
          try { await updateRecord(created.id, { photo_url: publicUrl }) } catch (e) { console.error('Erro ao atualizar registro com publicUrl:', e) }
        }
      } catch (err) {
        console.error('Erro ao fazer upload da foto:', err);
      }
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
      const rawReturn = returnDate ? normalizeLocalDate(returnDate) : getTodayLocalDate();
      const isoReturn = toLocalIsoWithOffset(rawReturn);

      await updateRecord(selectedEquipment.id, {
        status: "completed",
        // send ISO with timezone for return date as well
        return_date: isoReturn,
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
      <header className="border-b bg-background dark:bg-black shadow-md sticky top-0 z-10">
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
                  <Input type="date" name="date" required defaultValue={getTodayLocalDate()} />
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
                      <Edit className="w-4 h-4 text-muted-foreground" />
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
                        <SelectItem value="Veiculo">Veículo</SelectItem>
                        <SelectItem value="Liquido">Líquido</SelectItem>
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
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {record.photo_url ? (
                            // show image if available (data URL or remote)
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={record.photo_url} alt={record.name} className="w-20 h-20 object-cover" />
                          ) : (
                            <Settings className="h-8 w-8 text-gray-400" />
                          )}
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
                                {(() => {
                                  const conv = convertIsoToLocalDateString(record.date as any);
                                  return conv ? formatDateForDisplay(conv) : new Date(record.date).toLocaleDateString('pt-BR');
                                })()}
                              </p>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEdit(record);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
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
                              <p><span className="text-muted-foreground">Retorno:</span> {(() => {
                                const conv = convertIsoToLocalDateString(record.return_date as any)
                                return conv ? formatDateForDisplay(conv) : new Date(record.return_date).toLocaleDateString('pt-BR')
                              })()}</p>
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
        <DialogContent className="max-h-[80vh] overflow-auto">
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
                <Input type="date" id="returnDate" defaultValue={getTodayLocalDate()} />
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
      {/* Dialog for editing equipment (name, date, photo, etc) */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
            <DialogDescription>
              {editRecord?.name}
            </DialogDescription>
          </DialogHeader>

          {editRecord && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" defaultValue={convertIsoToLocalDateString(editRecord.date as any) || getTodayLocalDate()} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="photo">Foto (substitui)</Label>
                  <Input id="photo" name="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
                {(editPreview || editRecord.photo_url) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editPreview ?? editRecord.photo_url} alt="preview" className="w-40 h-28 object-cover rounded mt-2" />
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" name="name" defaultValue={editRecord.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select id="type" name="type" defaultValue={editRecord.type}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equipamento">Equipamento</SelectItem>
                      <SelectItem value="Máquina">Máquina</SelectItem>
                      <SelectItem value="Peça">Peça</SelectItem>
                      <SelectItem value="Veiculo">Veículo</SelectItem>
                      <SelectItem value="Liquido">Líquido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Finalidade</Label>
                <Select id="purpose" name="purpose" defaultValue={editRecord.purpose}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Uso interno">Uso interno</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Empréstimo">Empréstimo</SelectItem>
                    <SelectItem value="Doação">Doação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Destino</Label>
                <Input id="destination" name="destination" defaultValue={editRecord.destination} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorizedBy">Quem Autorizou</Label>
                  <Input id="authorizedBy" name="authorizedBy" defaultValue={editRecord.authorized_by} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="withdrawnBy">Quem Retirou</Label>
                  <Input id="withdrawnBy" name="withdrawnBy" defaultValue={editRecord.withdrawn_by} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-secondary text-white">Salvar</Button>
                <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditRecord(null); }}>Cancelar</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipment;
