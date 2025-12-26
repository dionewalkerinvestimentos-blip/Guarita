import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, Download, Share2, Loader2, Filter, FileSpreadsheet, FileText, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVehicles, useCottonPull, useRainRecords, useEquipment, useLoadingRecords } from "@/hooks/use-supabase";
import { useMaterialReceipts } from "@/hooks/use-material-receipts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  const { records: loadingRecords, loading: loadingLoadings } = useLoadingRecords();
  const { records: materialRecords, loading: loadingMaterials } = useMaterialReceipts();

  // Estados dos filtros
  const [dateFilter, setDateFilter] = useState("");
  const [productFilter, setProductFilter] = useState("todos");
  const [plateFilter, setPlateFilter] = useState("");
  const [driverFilter, setDriverFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("day"); // day, month, year
  const [isExpanded, setIsExpanded] = useState(true); // Estado para expandir/recolher movimentação geral

  // Calcular estatísticas reais
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthVehicles = vehicles.filter(v => 
    new Date(v.date).getMonth() === currentMonth && 
    new Date(v.date).getFullYear() === currentYear
  );
  
  const carregamentosPluma = thisMonthVehicles.filter(v => 
    v.type === 'Carregamento' && v.purpose?.toLowerCase().includes('pluma')
    const filaCarregamento = loadingRecords.filter(l => !l.entry_date);
  
  const carregamentosCaroco = thisMonthVehicles.filter(v => 
    v.type === 'Carregamento' && v.purpose?.toLowerCase().includes('caroço')
  );
  
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
      
      (doc as any).autoTable({
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
      
      (doc as any).autoTable({
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
      value: loadingVehicles ? "..." : thisMonthVehicles.length.toString(), 
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

  const generateDailySummary = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Carregamentos concluídos do dia
    const carregamentosConcluidos = loadingRecords.filter(l => l.exit_date === todayDate);
    
    // Agrupar carregamentos concluídos por produto
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
    const todayCotton = cottonRecords.filter(r => r.date === todayDate);
    const todayRolls = todayCotton.reduce((sum, r) => sum + r.rolls, 0);
    
    // Fila de carregamento atual (apenas na fila)
    const filaAtual = loadingRecords.filter(l => !l.entry_date);
    const filaPluma = filaAtual.filter(l => l.product === 'Pluma').length;
    const filaCaroco = filaAtual.filter(l => l.product === 'Caroço').length;
    const filaFibrilha = filaAtual.filter(l => l.product === 'Fibrilha').length;
    const filaBriquete = filaAtual.filter(l => l.product === 'Briquete').length;
    
    let message = `🏢 IBA Santa Luzia - Controle Guarita
📅 Resumo Diário - ${today}

� CARREGAMENTOS CONCLUÍDOS:`;

    if (plumaCarregamentos.length > 0) {
      message += `\n🧺 Pluma: ${plumaCarregamentos.length} caminhões | ${totalPlumaFardos.toLocaleString('pt-BR')} fardos`;
    }
    if (carocoCarregamentos.length > 0) {
      message += `\n🌰 Caroço: ${carocoCarregamentos.length} caminhões | ${totalCarocoKg.toLocaleString('pt-BR')} kg`;
    }
    if (fibrilhaCarregamentos.length > 0) {
      message += `\n🧵 Fibrilha: ${fibrilhaCarregamentos.length} caminhões | ${totalFibrilhaFardos.toLocaleString('pt-BR')} fardos`;
    }
    if (briqueteCarregamentos.length > 0) {
      message += `\n🔥 Briquete: ${briqueteCarregamentos.length} caminhões | ${totalBriqueteKg.toLocaleString('pt-BR')} kg`;
    }
    if (carregamentosConcluidos.length === 0) {
      message += `\n❌ Nenhum carregamento concluído hoje`;
    }

    message += `\n\n🌾 PUXE DE ALGODÃO:`;
    if (todayRolls > 0) {
      message += `\n✅ ${todayRolls.toLocaleString('pt-BR')} rolos recebidos`;
    } else {
      message += `\n❌ Nenhum rolo recebido hoje`;
    }

    message += `\n\n📦 RECEBIMENTO DE MATERIAIS:`;
    // Quando implementar materiais, adicionar aqui
    message += `\n❌ Nenhum material recebido hoje`; // Temporário

    message += `\n\n� FILA DE CARREGAMENTO ATUAL:`;
    if (filaPluma > 0) message += `\n🧺 Pluma: ${filaPluma} na fila`;
    if (filaCaroco > 0) message += `\n🌰 Caroço: ${filaCaroco} na fila`;
    if (filaFibrilha > 0) message += `\n🧵 Fibrilha: ${filaFibrilha} na fila`;
    if (filaBriquete > 0) message += `\n🔥 Briquete: ${filaBriquete} na fila`;
    if (filaAtual.length === 0) {
      message += `\n✅ Fila vazia no momento`;
    }

    message += `\n\n📌 Mensagem automática gerada via Controle Guarita`;

    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem copiada!",
      description: "Cole no WhatsApp para compartilhar o resumo.",
    });
  };

  const generateQueueStatus = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Dados reais da fila de carregamento
    const todayDate = new Date().toISOString().split('T')[0];
    const filaCarregamento = loadingRecords.filter(l => !l.entry_date);
    
    // Agrupar por produto
    const filaPluma = filaCarregamento.filter(l => l.product === 'Pluma');
    const filaCaroco = filaCarregamento.filter(l => l.product === 'Caroço');
    const filaFibrilha = filaCarregamento.filter(l => l.product === 'Fibrilha');
    const filaBriquete = filaCarregamento.filter(l => l.product === 'Briquete');
    const filaOutros = filaCarregamento.filter(l => !['Pluma', 'Caroço', 'Fibrilha', 'Briquete'].includes(l.product));
    
    let message = `🏢 IBA Santa Luzia - Controle Guarita
🕒 Fila de Carregamento - ${today} - ${time}\n\n`;

    if (filaPluma.length > 0) {
      message += `🧺 Pluma – ${filaPluma.length} carreta${filaPluma.length > 1 ? 's' : ''} aguardando:\n`;
      filaPluma.slice(0, 5).forEach(item => {
        message += `🚛 ${item.truck_type} | ${item.plate} | ${item.carrier}\n`;
      });
      message += '\n';
    }

    if (filaCaroco.length > 0) {
      message += `🌰 Caroço – ${filaCaroco.length} carreta${filaCaroco.length > 1 ? 's' : ''} aguardando:\n`;
      filaCaroco.slice(0, 5).forEach(item => {
        message += `🚚 ${item.truck_type} | ${item.plate} | ${item.carrier}\n`;
      });
      message += '\n';
    }

    if (filaFibrilha.length > 0) {
      message += `🧵 Fibrilha – ${filaFibrilha.length} carreta${filaFibrilha.length > 1 ? 's' : ''} aguardando:\n`;
      filaFibrilha.slice(0, 5).forEach(item => {
        message += `🚛 ${item.truck_type} | ${item.plate} | ${item.carrier}\n`;
      });
      message += '\n';
    }

    if (filaBriquete.length > 0) {
      message += `🔥 Briquete – ${filaBriquete.length} carreta${filaBriquete.length > 1 ? 's' : ''} aguardando:\n`;
      filaBriquete.slice(0, 5).forEach(item => {
        message += `🚛 ${item.truck_type} | ${item.plate} | ${item.carrier}\n`;
      });
      message += '\n';
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

    message += '📌 Mensagem automática gerada via Controle Guarita';

    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem copiada!",
      description: "Cole no WhatsApp para compartilhar o status da fila.",
    });
  };

  const sendToWhatsApp = (message: string) => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendDailyReportToWhatsApp = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Carregamentos concluídos do dia
    const carregamentosConcluidos = loadingRecords.filter(l => l.exit_date === todayDate);
    
    // Agrupar carregamentos concluídos por produto
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
    const todayCotton = cottonRecords.filter(r => r.date === todayDate);
    const todayRolls = todayCotton.reduce((sum, r) => sum + r.rolls, 0);
    
    // Materiais recebidos (assumindo que você tem os dados de materiais)
    // Como não temos os dados reais ainda, vou deixar preparado
    const todayMaterials = materialRecords.filter(m => m.date === todayDate);
    
    // Fila de carregamento atual (apenas na fila)
    const filaAtual = loadingRecords.filter(l => !l.entry_date);
    const filaPluma = filaAtual.filter(l => l.product === 'Pluma').length;
    const filaCaroco = filaAtual.filter(l => l.product === 'Caroço').length;
    const filaFibrilha = filaAtual.filter(l => l.product === 'Fibrilha').length;
    const filaBriquete = filaAtual.filter(l => l.product === 'Briquete').length;
    
    let message = `🏢 IBA Santa Luzia - Controle Guarita
📅 Resumo Diário - ${today}

� CARREGAMENTOS CONCLUÍDOS:`;

    if (plumaCarregamentos.length > 0) {
      message += `\n🧺 Pluma: ${plumaCarregamentos.length} caminhões | ${totalPlumaFardos.toLocaleString('pt-BR')} fardos`;
    }
    if (carocoCarregamentos.length > 0) {
      message += `\n🌰 Caroço: ${carocoCarregamentos.length} caminhões | ${totalCarocoKg.toLocaleString('pt-BR')} kg`;
    }
    if (fibrilhaCarregamentos.length > 0) {
      message += `\n� Fibrilha: ${fibrilhaCarregamentos.length} caminhões | ${totalFibrilhaFardos.toLocaleString('pt-BR')} fardos`;
    }
    if (briqueteCarregamentos.length > 0) {
      message += `\n🔥 Briquete: ${briqueteCarregamentos.length} caminhões | ${totalBriqueteKg.toLocaleString('pt-BR')} kg`;
    }
    if (carregamentosConcluidos.length === 0) {
      message += `\n❌ Nenhum carregamento concluído hoje`;
    }

    message += `\n\n🌾 PUXE DE ALGODÃO:`;
    if (todayRolls > 0) {
      message += `\n✅ ${todayRolls.toLocaleString('pt-BR')} rolos recebidos`;
    } else {
      message += `\n❌ Nenhum rolo recebido hoje`;
    }

    message += `\n\n📦 RECEBIMENTO DE MATERIAIS:`;
    // Quando implementar materiais, adicionar aqui
    message += `\n❌ Nenhum material recebido hoje`; // Temporário

    // Saída de equipamentos do dia
    const todayEquipment = equipmentRecords.filter(eq => eq.date === todayDate);
    message += `\n\n🔧 SAÍDA DE EQUIPAMENTOS:`;
    if (todayEquipment.length > 0) {
      message += `\n✅ ${todayEquipment.length} equipamento(s) retirado(s)`;
      todayEquipment.forEach(eq => {
        message += `\n• ${eq.name} - ${eq.destination}`;
      });
    } else {
      message += `\n❌ Nenhum equipamento retirado hoje`;
    }

    message += `\n\n🚛 FILA DE CARREGAMENTO ATUAL:`;
    if (filaPluma > 0) message += `\n🧺 Pluma: ${filaPluma} na fila`;
    if (filaCaroco > 0) message += `\n🌰 Caroço: ${filaCaroco} na fila`;
    if (filaFibrilha > 0) message += `\n🧵 Fibrilha: ${filaFibrilha} na fila`;
    if (filaBriquete > 0) message += `\n🔥 Briquete: ${filaBriquete} na fila`;
    if (filaAtual.length === 0) {
      message += `\n✅ Fila vazia no momento`;
    }

    message += `\n\n📌 Mensagem automática gerada via Controle Guarita`;

    sendToWhatsApp(message);
  };

  const sendQueueStatusToWhatsApp = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    // Dados reais da fila de carregamento (apenas os que estão na fila)
    const filaCarregamento = loadingRecords.filter(l => !l.entry_date);
    
    // Agrupar por produto
    const filaPluma = filaCarregamento.filter(l => l.product === 'Pluma');
    const filaCaroco = filaCarregamento.filter(l => l.product === 'Caroço');
    const filaFibrilha = filaCarregamento.filter(l => l.product === 'Fibrilha');
    const filaBriquete = filaCarregamento.filter(l => l.product === 'Briquete');
    const filaOutros = filaCarregamento.filter(l => !['Pluma', 'Caroço', 'Fibrilha', 'Briquete'].includes(l.product));
    
    let message = `🏢 IBA Santa Luzia - Controle Guarita
🕒 Fila de Carregamento - ${today} - ${time}

🚛 RESUMO DA FILA POR PRODUTO:\n`;

    if (filaPluma.length > 0) {
      message += `🧺 Pluma: ${filaPluma.length} carreta${filaPluma.length > 1 ? 's' : ''} na fila\n`;
    }
    if (filaCaroco.length > 0) {
      message += `🌰 Caroço: ${filaCaroco.length} carreta${filaCaroco.length > 1 ? 's' : ''} na fila\n`;
    }
    if (filaFibrilha.length > 0) {
      message += `🧵 Fibrilha: ${filaFibrilha.length} carreta${filaFibrilha.length > 1 ? 's' : ''} na fila\n`;
    }
    if (filaBriquete.length > 0) {
      message += `� Briquete: ${filaBriquete.length} carreta${filaBriquete.length > 1 ? 's' : ''} na fila\n`;
    }
    if (filaOutros.length > 0) {
      message += `📦 Outros: ${filaOutros.length} carreta${filaOutros.length > 1 ? 's' : ''} na fila\n`;
    }

    if (filaCarregamento.length === 0) {
      message += `✅ Fila vazia no momento`;
    } else {
      message += `\n📊 TOTAL: ${filaCarregamento.length} carreta${filaCarregamento.length > 1 ? 's' : ''} aguardando carregamento`;
    }

    message += `\n\n📌 Mensagem automática gerada via Controle Guarita`;

    sendToWhatsApp(message);
  };

  const generateCottonPullSummary = () => {
    const today = new Date().toLocaleDateString('pt-BR');
    const todayDate = new Date().toISOString().split('T')[0];
    
    // Filtrar registros do dia
    const todayRecords = cottonRecords.filter(record => record.date === todayDate);
    
    if (todayRecords.length === 0) {
      toast({
        title: "Sem dados",
        description: "Nenhum registro de puxe de rolos encontrado para hoje.",
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
          firstEntry: null,
          lastExit: null
        };
      }
      
      acc[key].rolls += record.rolls;
      acc[key].trips += 1;
      
      // Calcular tempo de permanência (se houver entrada e saída)
      if (record.entry_time && record.exit_time) {
        const [entryH, entryM] = record.entry_time.split(':').map(Number);
        const [exitH, exitM] = record.exit_time.split(':').map(Number);
        const timeInMinutes = (exitH * 60 + exitM) - (entryH * 60 + entryM);
        if (timeInMinutes > 0) {
          acc[key].totalTime += timeInMinutes;
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
📅 Relatório Puxe de Rolos - ${today}
