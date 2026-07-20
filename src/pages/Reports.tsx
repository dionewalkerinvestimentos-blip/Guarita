import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, BarChart3, Download, Share2, Loader2, Filter, FileSpreadsheet, FileText, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVehicles, useCottonPull, useRainRecords, useEquipment, useLoadingRecords, useGestaoTempoCargas } from "@/hooks/use-supabase";
import { useMaterialReceipts } from "@/hooks/use-material-receipts";
import { calculateLoadingTime } from "@/lib/time-utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getTodayLocalDate, convertIsoToLocalDateString } from "@/lib/date-utils";

// Extend jsPDF interface for autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: typeof autoTable;
  lastAutoTable: {
    finalY: number;
  };
}

// Função helper para converter texto para Title Case
const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

const Reports = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { vehicles, loading: loadingVehicles } = useVehicles();
  const { records: cottonRecords, loading: loadingCotton } = useCottonPull();
  const { records: rainRecords, loading: loadingRain } = useRainRecords();
  const { records: equipmentRecords, loading: loadingEquipment } = useEquipment();
  const { records: loadingRecords, loading: loadingLoadings, updateRecord } = useLoadingRecords();
  const { cargas: gestaoCargas, loading: loadingCargas } = useGestaoTempoCargas();
  const { records: materialRecords, loading: loadingMaterials } = useMaterialReceipts();

  // Estados dos filtros
  const [dateFilter, setDateFilter] = useState(getTodayLocalDate()); // Default para hoje
  const [productFilter, setProductFilter] = useState("todos");
  const [plateFilter, setPlateFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("day"); // day, month, year
  const [isExpanded, setIsExpanded] = useState(false); // Estado para expandir/recolher movimentação geral
  const [showAllVehicles, setShowAllVehicles] = useState(false); // Novo: mostrar todos os veículos
  
  // Novos estados para filtros por coluna
  const [columnFilters, setColumnFilters] = useState({
    status: '',
    plate: '',
    product: '',
    driver: '',
    carrier: '',
    destination: '',
    type: ''
  });

  // Edit modal states for loading record
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLoading, setEditingLoading] = useState<any>(null);
  const [editEntryDate, setEditEntryDate] = useState('');
  const [editEntryTime, setEditEntryTime] = useState('');
  const [editExitDate, setEditExitDate] = useState('');
  const [editExitTime, setEditExitTime] = useState('');

  const openEditModal = (loading: any) => {
    setEditingLoading(loading);
    setEditEntryDate(loading.entry_date || '');
    setEditEntryTime(loading.entry_time || '');
    setEditExitDate(loading.exit_date || '');
    setEditExitTime(loading.exit_time || '');
    setIsEditModalOpen(true);
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoading) return;
    try {
      await updateRecord(editingLoading.id, {
        entry_date: editEntryDate === '' ? null : editEntryDate,
        entry_time: editEntryTime === '' ? null : editEntryTime,
        exit_date: editExitDate === '' ? null : editExitDate,
        exit_time: editExitTime === '' ? null : editExitTime,
      });
      setIsEditModalOpen(false);
      setEditingLoading(null);
    } catch (err) {
      console.error('Erro salvando edição:', err);
    }
  }

  const getTypeFor = (plate: string, loadingType?: string) => {
    if (!plate) return loadingType || '-'
    const v = vehicles.find(v => v.plate?.toLowerCase() === plate.toLowerCase())
    return v?.vehicle_type || loadingType || '-'
  }
  
  // Estado para modal de visualização de mensagem
  const [messageModal, setMessageModal] = useState({ open: false, title: '', content: '' });

  // Calcular estatísticas reais
  const today = getTodayLocalDate();
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Contagens mensais baseadas em loadingRecords.loaded_at (data em que foi marcado como carregado)
  const carregamentosConcluidosMonth = loadingRecords.filter(l => {
    if (!l.loaded_at) return false;
    const d = new Date(l.loaded_at);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && l.status === 'carregado';
  });

  const carregamentosPluma = carregamentosConcluidosMonth.filter(l => l.product === 'Pluma');
  const carregamentosCaroco = carregamentosConcluidosMonth.filter(l => l.product === 'Caroço');
  const totalVehiclesMonth = carregamentosConcluidosMonth.length;
  
  const totalRolls = cottonRecords.reduce((sum, r) => sum + r.rolls, 0);
  
  const yearRain = rainRecords
    .filter(r => new Date(r.date).getFullYear() === currentYear)
    .reduce((sum, r) => sum + r.millimeters, 0);

  // Funções de exportação
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Aba Carregamentos
    const loadingData = loadingRecords.map(record => ({
      'Data': record.date,
      'Horário': record.time,
      'Produto': record.product,
      'Safra': record.harvest_year,
      'Tipo Caminhão': record.truck_type,
      'Sider': record.is_sider ? 'Sim' : 'Não',
      'Transportadora': record.carrier,
      'Destino': record.destination,
      'Placa': record.plate,
      'Motorista': record.driver,
      'Fardos': record.bales,
      'Peso': record.weight,
      'Observações': record.notes || ''
    }));
    const wsLoading = XLSX.utils.json_to_sheet(loadingData);
    XLSX.utils.book_append_sheet(wb, wsLoading, "Carregamentos");

    // Aba Puxe de Algodão
    const cottonData = cottonRecords.map(record => ({
      'Data': record.date,
      'Entrada': record.entry_time,
      'Saída': record.exit_time || '',
      'Produtor': record.producer,
      'Fazenda': record.farm,
      'Talhão': record.talhao || '',
      'Placa': record.plate,
      'Motorista': record.driver,
      'Rolos': record.rolls,
      'Observações': record.observations || ''
    }));
    const wsCotton = XLSX.utils.json_to_sheet(cottonData);
    XLSX.utils.book_append_sheet(wb, wsCotton, "Puxe Algodão");

    // Aba Chuva
    const rainData = rainRecords.map(record => ({
      'Data': record.date,
      'Horário Início': record.start_time || record.time || '',
      'Horário Fim': record.end_time || '',
      'Milímetros': record.millimeters,
      'Local': record.location || '',
      'Observações': record.notes || ''
    }));
    const wsRain = XLSX.utils.json_to_sheet(rainData);
    XLSX.utils.book_append_sheet(wb, wsRain, "Chuva");

    // Aba Veículos
    const vehicleData = vehicles.map(record => ({
      'Data': record.date,
      'Tipo': record.type,
      'Entrada': record.entry_time,
      'Saída': record.exit_time || '',
      'Placa': record.plate,
      'Motorista': record.driver,
      'Tipo Veículo': record.vehicle_type,
      'Finalidade': record.purpose || '',
      'Produtor': record.producer_name || '',
      'Observações': record.observations || ''
    }));
    const wsVehicles = XLSX.utils.json_to_sheet(vehicleData);
    XLSX.utils.book_append_sheet(wb, wsVehicles, "Veículos");

    XLSX.writeFile(wb, `Relatorio_Guarita_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Relatório exportado!",
      description: "Arquivo Excel baixado com sucesso.",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    
    // Título do relatório
    doc.setFontSize(16);
    doc.text('Relatório Sistema Guarita', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 25);
    
    let yPosition = 35;

    // Carregamentos
    if (loadingRecords.length > 0) {
      doc.setFontSize(12);
      doc.text('Carregamentos', 14, yPosition);
      yPosition += 10;
      
      const loadingTableData = loadingRecords.slice(0, 20).map(record => [
        record.date,
        record.product,
        record.plate,
        record.driver,
        record.destination
      ]);
      
      autoTable(doc, {
        head: [['Data', 'Produto', 'Placa', 'Motorista', 'Destino']],
        body: loadingTableData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
      
      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Puxe de Algodão
    if (cottonRecords.length > 0 && yPosition < 250) {
      doc.setFontSize(12);
      doc.text('Puxe de Algodão', 14, yPosition);
      yPosition += 10;
      
      const cottonTableData = cottonRecords.slice(0, 15).map(record => [
        record.date,
        record.producer,
        record.plate,
        record.rolls.toString(),
        record.entry_time
      ]);
      
      autoTable(doc, {
        head: [['Data', 'Produtor', 'Placa', 'Rolos', 'Entrada']],
        body: cottonTableData,
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 8 }
      });
    }

    doc.save(`Relatorio_Guarita_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Relatório exportado!",
      description: "Arquivo PDF baixado com sucesso.",
    });
  };
    
  const equipmentsSaidas = equipmentRecords.length;

  const stats = [
    { 
      label: "Total de Veículos (Mês)", 
      value: loadingVehicles ? "..." : totalVehiclesMonth.toString(), 
      change: "+12%" 
    },
    { 
      label: "Carregamentos Pluma", 
      value: loadingVehicles ? "..." : carregamentosPluma.length.toString(), 
      change: "+8%" 
    },
    { 
      label: "Carregamentos Caroço", 
      value: loadingVehicles ? "..." : carregamentosCaroco.length.toString(), 
      change: "+5%" 
    },
    { 
      label: "Rolos Puxados", 
      value: loadingCotton ? "..." : totalRolls.toLocaleString('pt-BR'), 
      change: "+15%" 
    },
    { 
      label: "Chuva Acumulada (Ano)", 
      value: loadingRain ? "..." : `${yearRain.toFixed(1)} mm`, 
      change: "-3%" 
    },
    { 
      label: "Equipamentos Saídos", 
      value: loadingEquipment ? "..." : equipmentsSaidas.toString(), 
      change: "+2%" 
    },
    {
      label: "Materiais Recebidos (Mês)",
      value: loadingMaterials ? "..." : (() => {
        try {
          const monthMaterials = materialRecords.filter(m => {
            const d = new Date(m.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          });
          const deliveries = monthMaterials.length;
          const totalKg = monthMaterials
            .filter(m => m.unit_type === 'KG')
            .reduce((s, m) => s + (m.net_weight || 0), 0);
          return `${deliveries} entregas • ${totalKg.toLocaleString('pt-BR')} kg`;
        } catch (e) {
          return "0";
        }
      })(),
      change: "+0%"
    }
  ];

  // Top produtores baseado em dados reais
  const producerStats = cottonRecords.reduce((acc, record) => {
    if (!acc[record.producer]) {
      acc[record.producer] = 0;
    }
    acc[record.producer] += record.rolls;
    return acc;
  }, {} as Record<string, number>);

  const topProducers = Object.entries(producerStats)
    .map(([name, rolls]) => ({ name, rolls }))
    .sort((a, b) => b.rolls - a.rolls)
    .slice(0, 5);

  // Carregamentos por tipo de caminhão baseado nos dados de loadingRecords
  const truckTypeStats = loadingRecords.reduce((acc, loading) => {
    // Determinar o tipo de caminhão baseado na placa ou outros critérios
    let truckType = "Carreta"; // padrão
    
    // Lógica para determinar tipo (pode ser expandida conforme necessário)
    if (loading.plate && loading.plate.length > 0) {
      // Assumir que placas com determinado padrão são sider ou outros tipos
      truckType = "Carreta";
    }

    const key = loading.is_sider ? `${truckType} (Sider)` : truckType;
    
    if (!acc[key]) {
      acc[key] = 0;
    }
    acc[key]++;
    return acc;
  }, {} as Record<string, number>);

  const loadingByTruck = Object.entries(truckTypeStats)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const isLoading = loadingVehicles || loadingCotton || loadingRain || loadingEquipment;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p>Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  const generateDailySummary = (sendToWhatsAppFlag = false, showInModal = false) => {
    const filterDateStr = dateFilter || today;
    const displayDate = new Date(filterDateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    
    // Chuva do dia e do mês
    const chuvaHoje = rainRecords.filter(r => r.date === filterDateStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0);
    const monthStart = new Date(new Date(filterDateStr).getFullYear(), new Date(filterDateStr).getMonth(), 1).toISOString().split('T')[0];
    const chuvaMes = rainRecords.filter(r => r.date >= monthStart && r.date <= filterDateStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0);

    // Carregamentos do dia (entry_date = data filtrada)
    const carregamentosConcluidos = loadingRecords.filter(l => 
      convertIsoToLocalDateString(l.exit_date) === filterDateStr || 
      (l.status === 'carregado' && convertIsoToLocalDateString(l.loaded_at) === filterDateStr)
    );
    
    // Agrupar carregamentos por produto
    const plumaCarregamentos = carregamentosConcluidos.filter(l => l.product === 'Pluma');
    const carocoCarregamentos = carregamentosConcluidos.filter(l => l.product === 'Caroço');
    const fibrilhaCarregamentos = carregamentosConcluidos.filter(l => l.product === 'Fibrilha');
    const briqueteCarregamentos = carregamentosConcluidos.filter(l => l.product === 'Briquete');
    
    // Calcular totais
    const totalPlumaFardos = plumaCarregamentos.reduce((sum, l) => sum + (l.bales || 0), 0);
    const totalCarocoKg = carocoCarregamentos.reduce((sum, l) => sum + (l.weight || 0), 0);
    const totalFibrilhaFardos = fibrilhaCarregamentos.reduce((sum, l) => sum + (l.bales || 0), 0);
    const totalBriqueteKg = briqueteCarregamentos.reduce((sum, l) => sum + (l.weight || 0), 0);
    
    // Puxe de algodão do dia
    const todayCotton = cottonRecords.filter(r => r.date === filterDateStr);
    const todayRolls = todayCotton.reduce((sum, r) => sum + r.rolls, 0);
    
    // Agrupar puxe por fazenda e talhão
    const puxePorFazenda = todayCotton.reduce((acc, r) => {
      const key = `${r.farm} - ${r.talhao || 'N/A'}`;
      if (!acc[key]) acc[key] = { rolls: 0, count: 0 };
      acc[key].rolls += r.rolls;
      acc[key].count++;
      return acc;
    }, {} as Record<string, { rolls: number, count: number }>);

    // Materiais recebidos
    const todayMaterials = materialRecords.filter(m => m.date === filterDateStr);

    // Saída de equipamentos do dia
    const todayEquipment = equipmentRecords.filter(eq => eq.date === filterDateStr);
    
    // Fila de carregamento atual (apenas na fila)
    const filaAtual = loadingRecords.filter(l => !l.entry_date);
    const filaPlumaCount = filaAtual.filter(l => l.product === 'Pluma').length;
    const filaCarocoCount = filaAtual.filter(l => l.product === 'Caroço').length;
    const filaFibrilhaCount = filaAtual.filter(l => l.product === 'Fibrilha').length;
    const filaBriqueteCount = filaAtual.filter(l => l.product === 'Briquete').length;
    
    let message = `🏢 IBA Santa Luzia - Controle Guarita
📅 Resumo Diário - ${displayDate}

🌧️ CHUVA:
▪️ Hoje: ${chuvaHoje.toFixed(1)} mm
▪️ Acumulado Mês: ${chuvaMes.toFixed(1)} mm

🚛 CARREGAMENTOS CONCLUÍDOS:`;

    if (plumaCarregamentos.length > 0) {
      message += `\n▪️ Pluma: ${plumaCarregamentos.length} caminhões | ${totalPlumaFardos.toLocaleString('pt-BR')} fardos`;
    }
    if (carocoCarregamentos.length > 0) {
      message += `\n🌰 Caroço: ${carocoCarregamentos.length} caminhões | ${totalCarocoKg.toLocaleString('pt-BR')} kg`;
    }
    if (fibrilhaCarregamentos.length > 0) {
      message += `\n▪️ Fibrilha: ${fibrilhaCarregamentos.length} caminhões | ${totalFibrilhaFardos.toLocaleString('pt-BR')} fardos`;
    }
    if (briqueteCarregamentos.length > 0) {
      message += `\n🔥 Briquete: ${briqueteCarregamentos.length} caminhões | ${totalBriqueteKg.toLocaleString('pt-BR')} kg`;
    }
    if (carregamentosConcluidos.length === 0) {
      message += `\n❌ Nenhum carregamento concluído na data`;
    }

    message += `\n\n🌾 PUXE DE ALGODÃO:`;
    if (todayRolls > 0) {
      message += `\n✅ ${todayRolls.toLocaleString('pt-BR')} rolos recebidos`;
      Object.entries(puxePorFazenda).forEach(([fazendaTalhao, data]) => {
        message += `\n  • ${fazendaTalhao}: ${data.rolls} rolos (${data.count} viagens)`;
      });
    } else {
      message += `\n❌ Nenhum rolo recebido na data`;
    }

    message += `\n\n📦 RECEBIMENTO DE MATERIAIS:`;
    if (todayMaterials.length > 0) {
      // Separar Cavaco de outros materiais
      const cavacoMaterials = todayMaterials.filter(m => m.material_type === 'Cavaco');
      const otherMaterials = todayMaterials.filter(m => m.material_type !== 'Cavaco');
      
      // Cavaco: mostrar apenas quantidade de cargas e peso total
      if (cavacoMaterials.length > 0) {
        const totalCavacoWeight = cavacoMaterials.reduce((sum, m) => sum + m.net_weight, 0);
        message += `\n• Cavaco: ${cavacoMaterials.length} carga${cavacoMaterials.length > 1 ? 's' : ''} | ${totalCavacoWeight.toLocaleString('pt-BR')} kg`;
      }
      
      // Outros materiais: agrupar por tipo e fornecedor
      if (otherMaterials.length > 0) {
        const groupedMaterials = otherMaterials.reduce((acc, material) => {
          const key = `${material.material_type}|${material.supplier || 'Fornecedor não informado'}`;
          if (!acc[key]) {
            acc[key] = {
              material_type: material.material_type,
              supplier: material.supplier || 'Fornecedor não informado',
              quantity: 0,
              unit: material.unit_type || 'KG'
            };
          }
          // Acumular quantidade baseada no tipo de unidade
          if (material.unit_type === 'KG') {
            acc[key].quantity += material.net_weight || 0;
          } else if (material.unit_type === 'UN') {
            // Para 'UN' usamos net_weight como quantidade de unidades
            acc[key].quantity += material.net_weight || 0;
          } else if (material.unit_type === 'M3' && material.volume_m3) {
            acc[key].quantity += material.volume_m3;
          } else if (material.unit_type === 'M2' && material.volume_m2) {
            acc[key].quantity += material.volume_m2;
          } else if (material.unit_type === 'LITROS' && material.volume_liters) {
            acc[key].quantity += material.volume_liters;
          }
          return acc;
        }, {} as Record<string, { material_type: string, supplier: string, quantity: number, unit: string }>);

        // Mostrar resumo por produto
        const materialsByType = Object.values(groupedMaterials).reduce((acc, item) => {
          if (!acc[item.material_type]) {
            acc[item.material_type] = {
              total: 0,
              unit: item.unit,
              suppliers: new Set<string>()
            };
          }
          acc[item.material_type].total += item.quantity;
          acc[item.material_type].suppliers.add(item.supplier);
          return acc;
        }, {} as Record<string, { total: number, unit: string, suppliers: Set<string> }>);

        // Se houver múltiplos fornecedores para o mesmo produto, mostrar separado
        Object.entries(materialsByType).forEach(([materialType, data]) => {
          if (data.suppliers.size === 1) {
            const supplier = Array.from(data.suppliers)[0];
            message += `\n• ${materialType}: ${data.total.toLocaleString('pt-BR')} ${data.unit} de ${supplier}`;
          } else {
            // Múltiplos fornecedores - mostrar cada um
            const itemsForType = Object.values(groupedMaterials).filter(item => item.material_type === materialType);
            itemsForType.forEach(item => {
              message += `\n• ${item.material_type}: ${item.quantity.toLocaleString('pt-BR')} ${item.unit} de ${item.supplier}`;
            });
          }
        });
      }
    } else {
      message += `\n❌ Nenhum material recebido na data`;
    }

    message += `\n\n🔧 SAÍDA DE EQUIPAMENTOS:`;
    if (todayEquipment.length > 0) {
      todayEquipment.forEach(eq => {
        message += `\n• ${eq.name} para ${eq.destination}`;
      });
    } else {
      message += `\n❌ Nenhum equipamento retirado na data`;
    }

    message += `\n\n⏳ FILA DE CARREGAMENTO ATUAL:`;
    const totalFilaCarregamento = filaAtual.length;
    
    if (filaPlumaCount > 0) message += `\n▪️ Pluma: ${filaPlumaCount} na fila`;
    if (filaCarocoCount > 0) message += `\n🌰 Caroço: ${filaCarocoCount} na fila`;
    if (filaFibrilhaCount > 0) message += `\n▪️ Fibrilha: ${filaFibrilhaCount} na fila`;
    if (filaBriqueteCount > 0) message += `\n🔥 Briquete: ${filaBriqueteCount} na fila`;
    if (totalFilaCarregamento === 0) {
      message += `\n✅ Fila vazia no momento`;
    }

    if (showInModal) {
      setMessageModal({ 
        open: true, 
        title: '📊 Resumo Diário', 
        content: message 
      });
    } else if (sendToWhatsAppFlag) {
      sendToWhatsApp(message);
    } else {
      navigator.clipboard.writeText(message);
      toast({
        title: "Mensagem copiada!",
        description: "Cole no WhatsApp para compartilhar o resumo.",
      });
    }
  };

  const generateQueueStatus = (sendToWhatsAppFlag = false, showInModal = false) => {
    const filterDateStr = dateFilter || today;
    const displayDate = new Date(filterDateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Chuva do dia e do mês
    const chuvaHoje = rainRecords.filter(r => r.date === filterDateStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0);
    const monthStart = new Date(new Date(filterDateStr).getFullYear(), new Date(filterDateStr).getMonth(), 1).toISOString().split('T')[0];
    const chuvaMes = rainRecords.filter(r => r.date >= monthStart && r.date <= filterDateStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0);

    // Dados reais da fila de carregamento (independente de data)
    const filaCarregamento = loadingRecords.filter(l => !l.entry_date);
    
    // Agrupar por produto
    const filaPluma = filaCarregamento.filter(l => l.product === 'Pluma');
    const filaCaroco = filaCarregamento.filter(l => l.product === 'Caroço');
    const filaFibrilha = filaCarregamento.filter(l => l.product === 'Fibrilha');
    const filaBriquete = filaCarregamento.filter(l => l.product === 'Briquete');
    const filaOutros = filaCarregamento.filter(l => !['Pluma', 'Caroço', 'Fibrilha', 'Briquete'].includes(l.product));
    
    // Total de carretas na fila
    const totalCarretas = filaCarregamento.length;
    
    let message = `🏢 IBA Santa Luzia - Controle Guarita
🕒 Fila de Carregamento - ${displayDate} - ${time}

🌧️ CHUVA:
▪️ Hoje: ${chuvaHoje.toFixed(1)} mm
▪️ Acumulado Mês: ${chuvaMes.toFixed(1)} mm

📊 TOTAL: ${totalCarretas} carreta${totalCarretas !== 1 ? 's' : ''} aguardando\n\n`;

    // Função auxiliar para agrupar e formatar por produto
    const formatProductQueue = (items: typeof filaCarregamento, productName: string, icon: string) => {
      if (items.length === 0) return '';
      
      let result = `${icon} ${productName} - ${items.length} Carreta${items.length > 1 ? 's' : ''}\n`;
      
      // Agrupar por transportadora
      const byCarrier = items.reduce((acc, item) => {
        const carrier = item.carrier || 'Sem Transportadora';
        if (!acc[carrier]) {
          acc[carrier] = [];
        }
        acc[carrier].push(item);
        return acc;
      }, {} as Record<string, typeof items>);
      
      // Para cada transportadora
      Object.entries(byCarrier)
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([carrier, carrierItems]) => {
          result += `*${carrierItems.length} - ${carrier}*\n`;
          
          // Agrupar por tipo de caminhão
          const byTruckType = carrierItems.reduce((acc, item) => {
            const key = `${item.truck_type}|${item.is_sider ? 'Sider' : 'Normal'}`;
            if (!acc[key]) {
              acc[key] = { truck_type: item.truck_type, is_sider: item.is_sider, count: 0, siderCount: 0 };
            }
            acc[key].count++;
            if (item.is_sider) acc[key].siderCount++;
            return acc;
          }, {} as Record<string, { truck_type: string, is_sider: boolean, count: number, siderCount: number }>);
          
          Object.values(byTruckType).forEach(group => {
            const siderInfo = group.siderCount > 0 ? ` (${group.siderCount} Sider)` : '';
            result += `   >> ${group.count} ${group.truck_type}${siderInfo}\n`;
          });
        });
      
      result += '\n';
      return result;
    };

    if (filaPluma.length > 0) {
      message += formatProductQueue(filaPluma, 'Pluma', '▪️');
    }

    if (filaCaroco.length > 0) {
      message += formatProductQueue(filaCaroco, 'Caroço', '🌰');
    }

    if (filaFibrilha.length > 0) {
      message += formatProductQueue(filaFibrilha, 'Fibrilha', '▪️');
    }

    if (filaBriquete.length > 0) {
      message += formatProductQueue(filaBriquete, 'Briquete', '▪️');
    }

    if (filaOutros.length > 0) {
      message += `📦 Outros Produtos – ${filaOutros.length} carreta${filaOutros.length > 1 ? 's' : ''} aguardando:\n`;
      filaOutros.slice(0, 5).forEach(item => {
        message += `🚚 ${item.product} | ${item.plate} | ${item.carrier}\n`;
      });
      message += '\n';
    }

    if (filaCarregamento.length === 0) {
      message += '✅ Não há carretas aguardando na fila no momento.\n\n';
    }

    if (showInModal) {
      setMessageModal({ 
        open: true, 
        title: '📋 Status da Fila', 
        content: message 
      });
    } else if (sendToWhatsAppFlag) {
      sendToWhatsApp(message);
    } else {
      navigator.clipboard.writeText(message);
      toast({
        title: "Mensagem copiada!",
        description: "Cole no WhatsApp para compartilhar o status da fila.",
      });
    }
  };

  const sendToWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const generateCottonPullSummary = (sendToWhatsAppFlag = false, showInModal = false) => {
    const filterDateStr = dateFilter || today;
    const displayDate = new Date(filterDateStr + 'T00:00:00').toLocaleDateString('pt-BR');
    
    // Filtrar registros do dia
    const todayRecords = cottonRecords.filter(record => record.date === filterDateStr);
    
    if (todayRecords.length === 0) {
      toast({
        title: "Sem dados",
        description: `Nenhum registro de puxe de rolos encontrado para ${displayDate}.`,
        variant: "destructive"
      });
      return;
    }

    // Tipo para agrupamento
    type VehicleData = {
      plate: string;
      driver: string;
      rolls: number;
      trips: number;
      totalTime: number;
      talhoesUnicos: Set<string>;
      fazendasUnicas: Set<string>;
      firstEntry: string | null;
      lastExit: string | null;
    };

    // Agrupar por placa e motorista
    const groupedData = todayRecords.reduce((acc, record) => {
      const key = `${record.plate}-${record.driver}`;
      if (!acc[key]) {
        acc[key] = {
          plate: record.plate,
          driver: record.driver,
          rolls: 0,
          trips: 0,
          totalTime: 0,
          talhoesUnicos: new Set<string>(),
          fazendasUnicas: new Set<string>(),
          firstEntry: null,
          lastExit: null
        };
      }
      
      acc[key].rolls += record.rolls;
      acc[key].trips += 1;
      
      // Adicionar fazenda e talhão
      if (record.farm && record.farm.trim()) {
        acc[key].fazendasUnicas.add(record.farm.trim());
      }
      if (record.talhao && record.talhao.trim()) {
        acc[key].talhoesUnicos.add(record.talhao.trim());
      }
      
      // Calcular tempo de permanência (se houver entrada e saída)
      if (record.entry_time && record.exit_time) {
        // Para CottonPull, usar a data + entry_time e exit_time
        const timeStr = calculateLoadingTime(
          record.date,
          record.entry_time,
          record.date,
          record.exit_time
        );
        
        // Extrair minutos do resultado (formato "Xh Ymin")
        if (timeStr !== '-' && timeStr !== 'Erro') {
          const hoursMatch = timeStr.match(/(\d+)h/);
          const minutesMatch = timeStr.match(/(\d+)min/);
          const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
          const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
          const timeInMinutes = hours * 60 + minutes;
          if (timeInMinutes > 0) {
            acc[key].totalTime += timeInMinutes;
          }
        }
      }
      
      // Primeira entrada e última saída
      if (!acc[key].firstEntry || record.entry_time < acc[key].firstEntry) {
        acc[key].firstEntry = record.entry_time;
      }
      if (!acc[key].lastExit || (record.exit_time && record.exit_time > acc[key].lastExit)) {
        acc[key].lastExit = record.exit_time;
      }
      
      return acc;
    }, {} as Record<string, VehicleData>);

    // Formatação da mensagem
    let message = `🏢 IBA Santa Luzia - Controle Guarita
📅 Relatório Puxe de Rolos - ${displayDate}
🌾 Movimentação Detalhada por Veículo

`;

    const vehiclesArray = Object.values(groupedData);
    const totalRolls = vehiclesArray.reduce((sum, v) => sum + v.rolls, 0);
    const totalTrips = vehiclesArray.reduce((sum, v) => sum + v.trips, 0);
    
    // Calcular média de tempo na algodoeira (entry_time até exit_time de cada viagem)
    const recordsWithBothTimes = todayRecords.filter(r => r.entry_time && r.exit_time);
    let totalAlgodoeiraTime = 0;
    recordsWithBothTimes.forEach(record => {
      const [entryH, entryM] = record.entry_time.split(':').map(Number);
      const [exitH, exitM] = record.exit_time!.split(':').map(Number);
      let timeInMinutes = (exitH * 60 + exitM) - (entryH * 60 + entryM);
      if (timeInMinutes < 0) timeInMinutes += 1440; // Passou da meia-noite
      if (timeInMinutes > 0) {
        totalAlgodoeiraTime += timeInMinutes;
      }
    });
    const avgAlgodoeiraTime = recordsWithBothTimes.length > 0 ? Math.round(totalAlgodoeiraTime / recordsWithBothTimes.length) : 0;
    const algodoeiraHours = Math.floor(avgAlgodoeiraTime / 60);
    const algodoeiraMinutes = avgAlgodoeiraTime % 60;
    const algodoeiraTimeStr = algodoeiraHours > 0 ? `${algodoeiraHours}h ${algodoeiraMinutes}min` : `${algodoeiraMinutes}min`;
    
    // Calcular média de tempo de viagem do dia (todas as viagens)
    const totalTimeAllVehicles = vehiclesArray.reduce((sum, v) => sum + v.totalTime, 0);
    const avgTripTime = totalTrips > 0 ? Math.round(totalTimeAllVehicles / totalTrips) : 0;
    const avgHours = Math.floor(avgTripTime / 60);
    const avgMinutes = avgTripTime % 60;
    const avgTimeStr = avgHours > 0 ? `${avgHours}h ${avgMinutes}min` : `${avgMinutes}min`;

    // Calcular média de tempo na lavoura (usando a view `view_gestao_tempo_cargas` via hook)
    // Regras: desconsiderar zeros/nulls e valores extremos (>= 300 minutos)
    const cargasHoje = (gestaoCargas || []).filter(c => !!c.placa);
    const lavouraList = cargasHoje
      .map(c => c.tempo_lavoura)
      .filter(t => typeof t === 'number' && t > 0 && t < 300) as number[];
    const avgLavouraTime = lavouraList.length > 0 ? Math.round(lavouraList.reduce((s, x) => s + x, 0) / lavouraList.length) : 0;
    const lavouraHours = Math.floor(avgLavouraTime / 60);
    const lavouraMinutes = avgLavouraTime % 60;
    const lavouraTimeStr = lavouraHours > 0 ? `${lavouraHours}h ${lavouraMinutes}min` : `${lavouraMinutes}min`;

    message += `📊 RESUMO GERAL:\n`;
    message += `🚛 Veículos: ${vehiclesArray.length}\n`;
    message += ` Viagens: ${totalTrips}\n`;
    message += `📦 Rolos: ${totalRolls.toLocaleString('pt-BR')}\n`;
    message += `⏱️ Tempo Médio na Algodoeira: ${algodoeiraTimeStr}\n`;
    message += `🚜 Tempo Médio na Lavoura: ${lavouraTimeStr}\n\n`;

    message += `📋 DETALHAMENTO POR VEÍCULO:\n`;
    
    vehiclesArray.forEach((vehicle) => {
      message += `\n🚛 ${vehicle.plate} | ${vehicle.driver}\n`;
      message += `  📦 Rolos: ${vehicle.rolls.toLocaleString('pt-BR')}\n`;
      message += `  Viagens: ${vehicle.trips}\n`;
      
      // Adiciona as fazendas e talhões
      const fazendas = Array.from(vehicle.fazendasUnicas);
      const talhoes = Array.from(vehicle.talhoesUnicos);
      
      if (fazendas.length > 0) {
        message += `  📍 Fazenda(s): ${fazendas.join(', ')}\n`;
      }
      if (talhoes.length > 0) {
        message += `  🌱 Talhão(ões): ${talhoes.join(', ')}\n`;
      }
    });

    if (showInModal) {
      setMessageModal({ 
        open: true, 
        title: '🌾 Puxe de Rolos', 
        content: message 
      });
    } else if (sendToWhatsAppFlag) {
      sendToWhatsApp(message);
    } else {
      // Copiar para área de transferência
      navigator.clipboard.writeText(message).then(() => {
        toast({
          title: "Copiado!",
          description: "Relatório de Puxe de Rolos copiado para área de transferência.",
        });
      }).catch(() => {
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar para a área de transferência.",
          variant: "destructive"
        });
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-background dark:bg-black shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Relatórios e Métricas</h1>
              <p className="text-sm text-muted-foreground">Análises e indicadores</p>
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel Completo
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              PDF Tabelas
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Overall Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    stat.change.startsWith('+') 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Movimentação Geral de Veículos */}
        <Card>
          <CardHeader className="bg-background dark:bg-black">
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <span>Movimentação Geral de Veículos</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🚀 CLIQUE EXPANDIR:', { antes: isExpanded, depois: !isExpanded });
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? "🔼 Recolher" : "🔽 Expandir com Filtros"}
              </Button>
            </CardTitle>
            <CardDescription className="font-medium">
              ⚡ NOVA VERSÃO: Filtros por coluna, cores e visualização completa
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros sempre visíveis */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div className="space-y-2">
                    <Label className="text-sm">Data</Label>
                    <Input 
                      type="date" 
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Produto</Label>
                    <Select value={productFilter} onValueChange={setProductFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="Pluma">Pluma</SelectItem>
                        <SelectItem value="Caroço">Caroço</SelectItem>
                        <SelectItem value="Fibrilha">Fibrilha</SelectItem>
                        <SelectItem value="Briquete">Briquete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Placa</Label>
                    <Input 
                      placeholder="Ex: ABC-1234"
                      value={plateFilter}
                      onChange={(e) => setPlateFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Motorista</Label>
                    <Input 
                      placeholder="Nome do motorista"
                      value={driverFilter}
                      onChange={(e) => setDriverFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período</Label>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Dia</SelectItem>
                        <SelectItem value="month">Mês</SelectItem>
                        <SelectItem value="year">Ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

            {/* Contadores de Rolos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{
                      periodFilter === 'day' ? cottonRecords.filter(r => !dateFilter || r.date === dateFilter).reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR') :
                      periodFilter === 'month' ? cottonRecords.filter(r => !dateFilter || r.date.startsWith(dateFilter.substring(0, 7))).reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR') :
                      cottonRecords.reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR')
                    }</p>
                    <p className="text-sm text-muted-foreground">Rolos por {periodFilter === 'day' ? 'Dia' : periodFilter === 'month' ? 'Mês' : 'Ano'}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{
                      loadingRecords.filter(l => 
                        (!dateFilter || l.date === dateFilter) &&
                        (productFilter === "todos" || l.product === productFilter) &&
                        (!plateFilter || l.plate.toLowerCase().includes(plateFilter.toLowerCase()))
                      ).length
                    }</p>
                    <p className="text-sm text-muted-foreground">Carregamentos Filtrados</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{
                      vehicles.filter(v => 
                        (!dateFilter || v.date === dateFilter) &&
                        (!plateFilter || v.plate.toLowerCase().includes(plateFilter.toLowerCase()))
                      ).length
                    }</p>
                    <p className="text-sm text-muted-foreground">Movimentações de Veículos</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Resultados Filtrados - SEMPRE VISÍVEL quando expandido */}
            {isExpanded && (
              <div className="overflow-x-auto border-4 border-orange-500 rounded-lg p-4 bg-orange-50 dark:bg-muted/10">
                <div className="mb-4 p-3 bg-orange-100 dark:bg-muted/10 rounded border-2 border-orange-600">
                  <h3 className="font-bold text-orange-900 text-lg mb-2">🎯 TABELA COM FILTROS ATIVA</h3>
                  <div className="flex items-center gap-4">
                    <Button
                      variant={showAllVehicles ? "default" : "outline"}
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => {
                        console.log('✅ Clicou em Ver Todos:', !showAllVehicles);
                        setShowAllVehicles(!showAllVehicles);
                      }}
                    >
                      {showAllVehicles ? "🔵 Ocultando todos" : "🟢 Ver Todos os Veículos"}
                    </Button>
                    <span className="text-sm font-semibold text-orange-900">
                      {showAllVehicles ? `Mostrando ${loadingRecords.length} registros` : `Mostrando registros filtrados`}
                    </span>
                  </div>
                </div>
                
                <div className="mb-2 text-xs text-muted-foreground">
                  💡 Use os filtros abaixo em cada coluna para refinar a busca
                </div>
                
                  <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/10 dark:bg-card">
                      <th className="border border-gray-300 p-2 text-left text-sm">
                        <div className="space-y-1">
                          <div>Status</div>
                          <Input 
                            placeholder="Filtrar..."
                            className="h-7 text-xs"
                            value={columnFilters.status}
                            onChange={(e) => setColumnFilters({...columnFilters, status: e.target.value})}
                          />
                        </div>
                      </th>

                      <th className="border border-gray-300 p-2 text-left text-sm">
                        <div className="space-y-1">
                          <div>Placa</div>
                          <Input 
                            placeholder="Filtrar..."
                            className="h-7 text-xs"
                            value={columnFilters.plate}
                            onChange={(e) => setColumnFilters({...columnFilters, plate: e.target.value})}
                          />
                        </div>
                      </th>

                      <th className="border border-gray-300 p-2 text-left text-sm">
                        <div className="space-y-1">
                          <div>Tipo</div>
                          <Input 
                            placeholder="Filtrar..."
                            className="h-7 text-xs"
                            value={columnFilters.type}
                            onChange={(e) => setColumnFilters({...columnFilters, type: e.target.value})}
                          />
                        </div>
                      </th>

                      <th className="border border-gray-300 p-2 text-left text-sm">
                        <div className="space-y-1">
                          <div>Produto</div>
                          <Input 
                            placeholder="Filtrar..."
                            className="h-7 text-xs"
                            value={columnFilters.product}
                            onChange={(e) => setColumnFilters({...columnFilters, product: e.target.value})}
                          />
                        </div>
                      </th>

                      <th className="border border-gray-300 p-2 text-left text-sm">
                        <div className="space-y-1">
                          <div>Motorista</div>
                          <Input 
                            placeholder="Filtrar..."
                            className="h-7 text-xs"
                            value={columnFilters.driver}
                            onChange={(e) => setColumnFilters({...columnFilters, driver: e.target.value})}
                          />
                        </div>
                      </th>

                      <th className="border border-gray-300 p-2 text-left text-sm">
                        <div className="space-y-1">
                          <div>Transportadora</div>
                          <Input 
                            placeholder="Filtrar..."
                            className="h-7 text-xs"
                            value={columnFilters.carrier}
                            onChange={(e) => setColumnFilters({...columnFilters, carrier: e.target.value})}
                          />
                        </div>
                      </th>

                      <th className="border border-gray-300 p-2 text-left text-sm">
                        <div className="space-y-1">
                          <div>Destino</div>
                          <Input 
                            placeholder="Filtrar..."
                            className="h-7 text-xs"
                            value={columnFilters.destination}
                            onChange={(e) => setColumnFilters({...columnFilters, destination: e.target.value})}
                          />
                        </div>
                      </th>

                      <th className="border border-gray-300 p-2 text-left text-sm">Marcação</th>
                      <th className="border border-gray-300 p-2 text-left text-sm">Entrada</th>
                      <th className="border border-gray-300 p-2 text-left text-sm">Saída</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingRecords
                      .filter(l => {
                        // Filtros globais
                        const matchesGlobal = (!dateFilter || l.date === dateFilter) &&
                          (productFilter === "todos" || l.product === productFilter) &&
                          (!plateFilter || l.plate.toLowerCase().includes(plateFilter.toLowerCase())) &&
                          (!driverFilter || l.driver.toLowerCase().includes(driverFilter.toLowerCase()));
                        
                        // Filtros por coluna
                        const matchesColumns = 
                          (!columnFilters.status || l.status?.toLowerCase().includes(columnFilters.status.toLowerCase())) &&
                          (!columnFilters.plate || l.plate?.toLowerCase().includes(columnFilters.plate.toLowerCase())) &&
                          (!columnFilters.product || l.product?.toLowerCase().includes(columnFilters.product.toLowerCase())) &&
                          (!columnFilters.driver || l.driver?.toLowerCase().includes(columnFilters.driver.toLowerCase())) &&
                          (!columnFilters.type || ( (l.truck_type || '').toLowerCase().includes(columnFilters.type.toLowerCase()) || (vehicles.find(v => v.plate?.toLowerCase() === l.plate?.toLowerCase())?.vehicle_type || '').toLowerCase().includes(columnFilters.type.toLowerCase()) )) &&
                          (!columnFilters.carrier || l.carrier?.toLowerCase().includes(columnFilters.carrier.toLowerCase())) &&
                          (!columnFilters.destination || l.destination?.toLowerCase().includes(columnFilters.destination.toLowerCase()));
                        
                        // Se showAllVehicles está ativo, mostra tudo que passa nos filtros
                        if (showAllVehicles) {
                          return matchesGlobal && matchesColumns;
                        }
                        
                        // Caso contrário, aplica filtros normais
                        return matchesGlobal && matchesColumns;
                      })
                      .map((loading) => {
                        // Verifica se o registro está completo (status SAIU = concluido com saída registrada)
                        const isComplete = loading.status === 'concluido' && loading.exit_date && loading.exit_time;
                        const hasMissingData = !isComplete;
                        
                        return (
                          <tr 
                            key={`loading-${loading.id}`} 
                            className={`hover:bg-muted/40 dark:hover:bg-muted/30 ${isComplete ? 'bg-green-100 dark:bg-green-900 border-l-4 border-l-green-500' : hasMissingData ? 'bg-yellow-100 dark:bg-yellow-900 border-l-4 border-l-yellow-400' : ''}`}
                          >
                            <td className="border border-border p-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                loading.status === 'concluido' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                loading.status === 'carregado' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                                loading.status === 'carregando' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                'bg-muted/10 dark:bg-card text-muted-foreground'
                              }`}>
                                {loading.status ? toTitleCase(loading.status) : '-'}
                              </span>
                            </td>
                            <td className="border border-border p-2 font-medium text-sm">{loading.plate.toUpperCase()}</td>
                            <td className="border border-border p-2 text-sm">{getTypeFor(loading.plate, loading.truck_type)}</td>
                            <td className="border border-border p-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                loading.product === 'Pluma' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                                loading.product === 'Caroço' ? 'bg-brown-100 text-brown-800 dark:bg-muted/10 dark:text-brown-100' :
                                loading.product === 'Fibrilha' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                                'bg-muted/10 dark:bg-card text-muted-foreground'
                              }`}>
                                {toTitleCase(loading.product)}
                              </span>
                            </td>
                            <td className="border border-border p-2 text-sm">{toTitleCase(loading.driver)}</td>
                            <td className="border border-border p-2 text-sm">{toTitleCase(loading.carrier)}</td>
                            <td className="border border-border p-2 text-sm">{toTitleCase(loading.destination)}</td>
                            <td className="border border-border p-2 text-sm flex items-center justify-between">
                              <span>{loading.date} {loading.time}</span>
                              <Button size="sm" variant="outline" onClick={() => openEditModal(loading)}>
                                Editar
                              </Button>
                            </td>
                            <td className="border border-border p-2 text-sm">
                              {loading.entry_date && loading.entry_time ? 
                                `${loading.entry_date} ${loading.entry_time}` : 
                                <span className="text-red-500 font-semibold">Pendente</span>
                              }
                            </td>
                            <td className="border border-border p-2 text-sm">
                              {loading.exit_date && loading.exit_time ? 
                                `${loading.exit_date} ${loading.exit_time}` : 
                                <span className="text-red-500 font-semibold">Pendente</span>
                              }
                            </td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            )}
            
            {!isExpanded && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm mb-2">Clique em "Expandir Tudo" para ver a tabela completa de movimentações</p>
                <p className="text-xs">Total de {loadingRecords.length} registros de carregamento disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Puxe de Algodão por Motorista */}
          <Card>
            <CardHeader>
              <CardTitle>Puxe de Algodão por Motorista</CardTitle>
              <CardDescription>Ranking de motoristas por rolos puxados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  // Calcular estatísticas por motorista
                  const driverStats = cottonRecords.reduce((acc, record) => {
                    const key = `${record.driver}-${record.plate}`;
                    if (!acc[key]) {
                      acc[key] = {
                        driver: record.driver,
                        plate: record.plate,
                        totalRolls: 0,
                        totalTrips: 0
                      };
                    }
                    acc[key].totalRolls += record.rolls;
                    acc[key].totalTrips += 1;
                    return acc;
                  }, {} as Record<string, {driver: string, plate: string, totalRolls: number, totalTrips: number}>);

                  const sortedDrivers = Object.values(driverStats)
                    .sort((a, b) => b.totalRolls - a.totalRolls)
                    .slice(0, 5);

                  return sortedDrivers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum registro de puxe de algodão encontrado</p>
                      <p className="text-sm">Cadastre registros para ver o ranking</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-semibold">Pos</th>
                            <th className="text-left p-2 font-semibold">Placa</th>
                            <th className="text-left p-2 font-semibold">Motorista</th>
                            <th className="text-center p-2 font-semibold">Viagens</th>
                            <th className="text-center p-2 font-semibold">Total Rolos</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedDrivers.map((driver, index) => (
                            <tr key={`${driver.driver}-${driver.plate}`} className="border-b hover:bg-muted/40 dark:hover:bg-muted/30">
                              <td className="p-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0 ? 'bg-yellow-500 text-white' :
                                  index === 1 ? 'bg-gray-400 text-white' :
                                  index === 2 ? 'bg-amber-600 text-white' :
                                  'bg-gray-200 text-gray-700'
                                }`}>
                                  {index + 1}
                                </div>
                              </td>
                              <td className="p-2 font-medium">{driver.plate}</td>
                              <td className="p-2">{driver.driver}</td>
                              <td className="p-2 text-center font-medium">{driver.totalTrips}</td>
                              <td className="p-2 text-center font-bold text-green-600">{driver.totalRolls}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Loading by Truck Type */}
          <Card>
            <CardHeader>
              <CardTitle>Carregamentos por Tipo de Caminhão</CardTitle>
              <CardDescription>Distribuição de carretas no período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingByTruck.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum veículo registrado</p>
                    <p className="text-sm">Cadastre veículos para ver a distribuição por tipo</p>
                  </div>
                ) : (
                  loadingByTruck.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-24 font-semibold text-sm">{item.type}</div>
                      <div className="flex-1">
                        <div className="w-full bg-muted rounded-full h-3">
                          <div 
                            className="bg-accent h-3 rounded-full transition-all"
                            style={{ width: `${loadingByTruck[0] ? (item.count / loadingByTruck[0].count) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <p className="font-bold text-accent w-12 text-right">{item.count}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Materiais Recebidos por Tipo */}
        {(() => {
          const materialsByType = materialRecords.reduce((acc: Record<string, { count: number, totalKg: number, totalM3: number, totalM2: number, totalLitros: number, unitType: string }>, material) => {
            if (!acc[material.material_type]) {
              acc[material.material_type] = { 
                count: 0, 
                totalKg: 0, 
                totalM3: 0, 
                totalM2: 0, 
                totalLitros: 0,
                unitType: material.unit_type 
              };
            }
            acc[material.material_type].count += 1;
            
            // Acumular baseado no tipo de unidade
            if (material.unitType === 'KG') {
              acc[material.material_type].totalKg += material.net_weight;
            } else if (material.unitType === 'M3' && material.volume_m3) {
              acc[material.material_type].totalM3 += material.volume_m3;
            } else if (material.unitType === 'M2' && material.volume_m2) {
              acc[material.material_type].totalM2 += material.volume_m2;
            } else if (material.unitType === 'LITROS' && material.volume_liters) {
              acc[material.material_type].totalLitros += material.volume_liters;
            }
            
            return acc;
          }, {});
          
          return Object.keys(materialsByType).length > 0 ? (
            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(materialsByType).map(([type, data]) => {
                // Determinar qual quantidade e unidade mostrar
                let totalQuantity = 0;
                let unit = '';
                let avgQuantity = 0;
                
                if (data.unitType === 'KG') {
                  totalQuantity = data.totalKg / 1000; // Converter para toneladas
                  unit = 't';
                  avgQuantity = totalQuantity / data.count;
                } else if (data.unitType === 'M3') {
                  totalQuantity = data.totalM3;
                  unit = 'm³';
                  avgQuantity = totalQuantity / data.count;
                } else if (data.unitType === 'M2') {
                  totalQuantity = data.totalM2;
                  unit = 'm²';
                  avgQuantity = totalQuantity / data.count;
                } else if (data.unitType === 'LITROS') {
                  totalQuantity = data.totalLitros;
                  unit = 'L';
                  avgQuantity = totalQuantity / data.count;
                }
                
                return (
                  <Card key={type} className="border-l-4 border-orange-500">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        📦 {type}
                      </CardTitle>
                      <CardDescription>Material recebido</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Entregas:</span>
                          <span className="font-bold">{data.count}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Quantidade Total:</span>
                          <span className="font-bold text-orange-600">
                            {totalQuantity.toFixed(1)}{unit}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Média por entrega:</span>
                          <span className="font-medium">
                            {avgQuantity.toFixed(1)}{unit}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4" />
                  <p>Nenhum material registrado ainda</p>
                  <p className="text-sm">Registre materiais para ver os resumos aqui</p>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* WhatsApp Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Mensagens WhatsApp
            </CardTitle>
            <CardDescription>Gere mensagens automáticas para compartilhar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filtro de Data para Relatórios */}
            <div className="p-4 bg-muted/10 dark:bg-card rounded-lg border border-border">
              <Label htmlFor="reportDateFilter" className="font-semibold">📅 Selecionar Data do Relatório</Label>
              <Input 
                id="reportDateFilter"
                type="date" 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="mt-2 max-w-xs"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Data atual do filtro: {new Date(dateFilter + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </div>

            {/* Botão Relatório de Gestão de Puxe */}
            <div className="mb-6">
              <Button 
                className="w-full h-auto py-6 flex-col items-start bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                onClick={() => navigate("/reports/gestao-puxe")}
              >
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="w-6 h-6" />
                  <span className="font-bold text-lg">📊 Relatório de Gestão do Puxe</span>
                </div>
                <span className="text-sm opacity-90">
                  Análise completa de tempos, viagens, ranking e performance
                </span>
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Button 
                  className="w-full h-auto py-4 flex-col items-start bg-primary hover:bg-primary/90"
                  onClick={() => generateDailySummary(false, true)}
                >
                  <span className="font-semibold mb-1">📊 Resumo Diário</span>
                  <span className="text-xs opacity-90">Visualizar e copiar</span>
                </Button>
                <Button 
                  className="w-full h-auto py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => generateDailySummary(true)}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Enviar via WhatsApp</span>
                </Button>
              </div>
              
              <div className="space-y-2">
                <Button 
                  className="w-full h-auto py-4 flex-col items-start bg-accent hover:bg-accent/90"
                  onClick={() => generateQueueStatus(false, true)}
                >
                  <span className="font-semibold mb-1">🚛 Status da Fila</span>
                  <span className="text-xs opacity-90">Visualizar e copiar</span>
                </Button>
                <Button 
                  className="w-full h-auto py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => generateQueueStatus(true)}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Enviar via WhatsApp</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Button 
                  className="w-full h-auto py-4 flex-col items-start bg-orange-600 hover:bg-orange-700"
                  onClick={() => generateCottonPullSummary(false, true)}
                >
                  <span className="font-semibold mb-1">🌾 Puxe de Rolos</span>
                  <span className="text-xs opacity-90">Visualizar e copiar</span>
                </Button>
                <Button 
                  className="w-full h-auto py-3 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => generateCottonPullSummary(true)}
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Enviar via WhatsApp</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      
      {/* Modal para visualizar e copiar mensagem */}
      <Dialog open={messageModal.open} onOpenChange={(open) => setMessageModal({ ...messageModal, open })}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{messageModal.title}</DialogTitle>
            <DialogDescription>
              Visualize a mensagem abaixo e clique em "Copiar" para copiar para a área de transferência
            </DialogDescription>
          </DialogHeader>
            <div className="mt-4">
            <pre className="bg-muted/10 dark:bg-card p-4 rounded-lg overflow-auto max-h-[50vh] text-sm whitespace-pre-wrap font-mono">
              {messageModal.content}
            </pre>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setMessageModal({ ...messageModal, open: false })}
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(messageModal.content);
                toast({
                  title: "Copiado!",
                  description: "Mensagem copiada para a área de transferência.",
                });
                setMessageModal({ ...messageModal, open: false });
              }}
            >
              📋 Copiar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de edição de Marcação (entrada/saída) */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Datas/Horários</DialogTitle>
            <DialogDescription>Atualize a data e horário de entrada e saída.</DialogDescription>
          </DialogHeader>

          {editingLoading && (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-entry-date">Data de Entrada</Label>
                  <Input id="edit-entry-date" type="date" value={editEntryDate} onChange={(e) => setEditEntryDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-entry-time">Hora de Entrada</Label>
                  <Input id="edit-entry-time" type="time" value={editEntryTime} onChange={(e) => setEditEntryTime(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-exit-date">Data de Saída</Label>
                  <Input id="edit-exit-date" type="date" value={editExitDate} onChange={(e) => setEditExitDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-exit-time">Hora de Saída</Label>
                  <Input id="edit-exit-time" type="time" value={editExitTime} onChange={(e) => setEditExitTime(e.target.value)} />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reports;