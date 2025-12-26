import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CloudRain, Truck, PackageCheck, Clock, Droplet } from "lucide-react";
import { useVehicles, useCottonPull, useRainRecords, useLoadingRecords, useEquipment, useGestaoTempo, useGestaoTempoCargas } from "@/hooks/use-supabase";
import { useRainAlert } from "@/hooks/use-rain-alert";
import { useMaterialReceipts } from "@/hooks/use-material-receipts";
import { RainAnimation } from "@/components/RainAnimation";
import { RainHeaderAnimation } from "@/components/RainHeaderAnimation";
import ControleGuaritaFitScreen from "@/components/ControleGuaritaFitScreen";
import logo from "@/assets/BF_logo.png";
import { getTodayLocalDate, convertIsoToLocalDateString, toLocalDateString } from "@/lib/date-utils";

function DashboardPortariaTV() {
  const { vehicles, loading: loadingVehicles, refetch: refetchVehicles } = useVehicles();
  const { records: cottonPullRecords, loading: loadingCotton, refetch: refetchCotton } = useCottonPull();
  const { records: rainRecords, loading: loadingRain, refetch: refetchRain } = useRainRecords();
  const { records: loadingRecords, loading: loadingLoadings, refetch: refetchLoadings } = useLoadingRecords();
  const { records: materialRecords, loading: loadingMaterials, refetch: refetchMaterials } = useMaterialReceipts();
  const { records: equipmentRecords, loading: loadingEquipment, refetch: refetchEquipment } = useEquipment();
  const { data: gestaoTempo, loading: loadingGestaoTempo, refetch: refetchGestaoTempo } = useGestaoTempo();
  const { cargas, loading: loadingCargas, refetch: refetchCargas } = useGestaoTempoCargas();
  const { isRaining, toggleRainAlert } = useRainAlert();
  
  // Estado para modo claro/escuro com persistência
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('tv-mode-theme');
    return saved ? saved === 'dark' : true; // default: dark
  });
  
  // Debug: Log do estado de chuva
  useEffect(() => {
    console.log('🌧️ Estado da chuva no Modo TV:', isRaining);
  }, [isRaining]);
  
  // Salvar preferência de tema
  useEffect(() => {
    localStorage.setItem('tv-mode-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bannerIndex, setBannerIndex] = useState(0);
  const [timerTick, setTimerTick] = useState(0); // Para forçar re-render do cronômetro
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // atualiza a cada 1 minuto
    return () => clearInterval(timer);
  }, []);

  // Timer para atualizar cronômetro a cada 1 minuto
  useEffect(() => {
    const cronometro = setInterval(() => {
      setTimerTick(prev => prev + 1);
    }, 60000); // atualiza a cada 1 minuto
    return () => clearInterval(cronometro);
  }, []);

  // Estado para forçar re-render e atualização automática
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Atualização automática do modo TV a cada 60 segundos sem piscar a tela
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      // Refetch de todos os dados sem recarregar a página
      refetchVehicles?.();
      refetchCotton?.();
      refetchRain?.();
      refetchLoadings?.();
      refetchMaterials?.();
      refetchEquipment?.();
      refetchGestaoTempo?.();
      refetchCargas?.();
      
      console.log('🔄 Auto-refresh executado:', new Date().toLocaleTimeString());
    }, 60000); // atualiza a cada 60 segundos
    
    return () => clearInterval(autoRefresh);
  }, [refetchVehicles, refetchCotton, refetchRain, refetchLoadings, refetchMaterials, refetchEquipment, refetchGestaoTempo, refetchCargas]);

  // Auto-scroll para o card de Gestão de Tempo
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || cargas.length === 0) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5; // pixels por intervalo (bem devagar)
    const scrollInterval = 50; // ms entre cada movimento

    const autoScroll = setInterval(() => {
      if (scrollContainer) {
        scrollPosition += scrollSpeed;
        
        // Se chegou no final, volta pro início suavemente
        if (scrollPosition >= scrollContainer.scrollHeight - scrollContainer.clientHeight) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollTop = scrollPosition;
      }
    }, scrollInterval);

    return () => clearInterval(autoScroll);
  }, [cargas]);

  const getBannerMessages = useCallback(() => {
    const today = getTodayLocalDate(); // Usa a função local
    const todayMaterials = materialRecords.filter(m => m.date === today);
    const todayEquipment = equipmentRecords.filter(e => e.date === today);
    
    const messages = [];
    
    // Materiais recebidos
    if (todayMaterials.length === 0) {
      messages.push("📦 Nenhum material recebido hoje");
    } else {
      // Mensagem geral
      const totalWeight = todayMaterials.reduce((sum, m) => sum + m.net_weight, 0);
      messages.push(`📦 ${todayMaterials.length} materiais recebidos hoje - Total: ${totalWeight.toFixed(1)}t`);
      
      // Detalhes específicos de cada material recebido
      todayMaterials.forEach(material => {
        const supplierInfo = material.supplier ? ` | ${material.supplier}` : '';
        messages.push(`📦 ${material.material_type}: ${material.net_weight.toFixed(1)}t${supplierInfo} | ${material.plate}`);
      });
      
      // Por tipo de material (resumo)
      const materialsByType = todayMaterials.reduce((acc: Record<string, number>, m) => {
        acc[m.material_type] = (acc[m.material_type] || 0) + m.net_weight;
        return acc;
      }, {});
      
      Object.entries(materialsByType).forEach(([type, weight]) => {
        const count = todayMaterials.filter(m => m.material_type === type).length;
        messages.push(`� Resumo ${type}: ${count} entregas totalizando ${weight.toFixed(1)}t`);
      });
    }
    
    // Saída de equipamentos
    if (todayEquipment.length === 0) {
      messages.push("🔧 Nenhuma saída de equipamento hoje");
    } else {
      // Mensagem geral de equipamentos
      messages.push(`🔧 ${todayEquipment.length} equipamentos saíram hoje`);
      
      // Detalhes específicos de cada equipamento
      todayEquipment.forEach(equipment => {
        messages.push(`🔧 ${equipment.name} | ${equipment.destination} | ${equipment.purpose || 'Saída'}`);
      });

    }
    
    return messages;
  }, [materialRecords, equipmentRecords]);

  // Banner rotativo para materiais e equipamentos
  useEffect(() => {
    const messages = getBannerMessages();
    if (messages.length === 0) return;
    
    const bannerTimer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % messages.length);
    }, 4000); // muda a cada 4 segundos para acomodar mais informações
    return () => clearInterval(bannerTimer);
  }, [materialRecords, equipmentRecords, getBannerMessages]);

  const loading = loadingVehicles || loadingCotton || loadingRain || loadingLoadings || loadingMaterials || loadingEquipment;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-green-400 text-[clamp(1rem,1.5vw,1.3rem)]">
        <Loader2 className="animate-spin mr-3" /> Carregando informações...
      </div>
    );
  }

  const today = new Date();
  const todayStr = getTodayLocalDate(); // Usa a função local
  
  // Calcular início da semana (Segunda-feira)
  const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Segunda-feira
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // Domingo
  thisWeekEnd.setHours(23, 59, 59, 999);
  
  const thisWeekStartStr = toLocalDateString(thisWeekStart); // CORRIGIDO
  const thisWeekEndStr = toLocalDateString(thisWeekEnd);     // CORRIGIDO
  
  // Início e fim do mês atual
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const thisMonthStartStr = toLocalDateString(thisMonthStart); // CORRIGIDO
  const thisMonthEndStr = toLocalDateString(thisMonthEnd);     // CORRIGIDO
  
  // Início e fim do ano atual
  const thisYearStart = new Date(today.getFullYear(), 0, 1);
  const thisYearEnd = new Date(today.getFullYear(), 11, 31);
  const thisYearStartStr = toLocalDateString(thisYearStart); // CORRIGIDO
  const thisYearEndStr = toLocalDateString(thisYearEnd);     // CORRIGIDO

  // Filtros de carregamento (mesma lógica do Dashboard principal)
  const todayLoadings = loadingRecords;
  
  // FILA: status = 'fila' E sem data de entrada
  const fila = todayLoadings.filter(l => 
    l.status === 'fila' && !l.entry_date
  );
  
  // CARREGANDO (CARD): APENAS status 'carregando' sem exit_date
  const carregandoCard = todayLoadings.filter(l => {
    if (l.exit_date) return false;
    if (l.status === 'carregando') return true;
    return false;
  });
  
  // CARREGANDO (LISTA): status 'carregando' OU 'carregado' de hoje sem exit_date
  const carregando = todayLoadings.filter(l => {
    const todayDateString = getTodayLocalDate();
    
    if (l.exit_date) return false; // Se já saiu, não está mais carregando
    
    // Mostra os que estão carregando
    if (l.status === 'carregando') return true;
    
    // Mostra os carregados de HOJE que ainda não registraram saída
    if (l.status === 'carregado' && l.loaded_at && !l.exit_date) {
      const loadedAtNormalized = l.loaded_at.split('T')[0].split(' ')[0].trim();
      return loadedAtNormalized === todayDateString;
    }
    
    return false;
  });
  
  // AGUARDANDO NF: Removido - agora vai para "Carregando" com alerta
  const aguardandoNF: typeof todayLoadings = [];

  // CONCLUÍDOS (SAÍDA): Apenas caminhões que JÁ SAÍRAM e foram carregados HOJE
  const concluidosSaida = todayLoadings.filter(l => {
    const todayDateString = getTodayLocalDate();
    
    // Caso 1: Tem loaded_at de HOJE (carregado hoje)
    if (l.loaded_at) {
      const loadedAtNormalized = l.loaded_at.split('T')[0].split(' ')[0].trim();
      if (loadedAtNormalized === todayDateString) {
        return true; // Carregou hoje = Concluído (mesmo sem exit_date)
      }
      // Se loaded_at NÃO é de hoje, não mostra
      return false;
    }
    
    // Caso 2: NÃO tem loaded_at (registros antigos) - mostra se saiu hoje
    if (l.exit_date) {
      const exitDateNormalized = l.exit_date.split('T')[0].split(' ')[0].trim();
      return exitDateNormalized === todayDateString;
    }
    
    return false;
  });

  // NOVO: Total de concluídos para o card principal (soma aguardando NF + saídos)
  const totalConcluidosHoje = aguardandoNF.length + concluidosSaida.length;

  // Estatísticas de carregamento por produto
  const produtosFixos = ["PLUMA", "CAROÇO", "FIBRILHA", "BRIQUETE"];
  const produtosOpcionais = ["RECICLADOS", "CAVACO", "OUTROS"];
  
  // Produtos opcionais que tiveram movimentação no dia
  const produtosComMovimentacao = produtosOpcionais.filter(produto => {
    const filaCount = fila.filter(l => l.product.toUpperCase() === produto).length;
    const carregandoCount = carregando.filter(l => l.product.toUpperCase() === produto).length;
    const aguardandoNFCount = aguardandoNF.filter(l => l.product.toUpperCase() === produto).length;
    const concluidosSaidaCount = concluidosSaida.filter(l => l.product.toUpperCase() === produto).length;
    return filaCount > 0 || carregandoCount > 0 || aguardandoNFCount > 0 || concluidosSaidaCount > 0;
  });
  
  // Lista final de produtos
  const produtosParaExibir = [...produtosFixos, ...produtosComMovimentacao];
  
  console.log('🎯 PRODUTOS PARA EXIBIR:', produtosParaExibir);
  console.log('📦 Produtos Fixos:', produtosFixos);
  console.log('📦 Produtos com Movimentação:', produtosComMovimentacao);

  // Rolos puxados hoje
  const todayRolls = cottonPullRecords?.filter(r => r.date === todayStr) || [];

  // Estatísticas de chuva - corrigido para respeitar as datas corretas
  const chuvaHoje = rainRecords?.filter(r => convertIsoToLocalDateString(r.date) === todayStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0) || 0;
  const chuvaSemana = rainRecords?.filter(r => convertIsoToLocalDateString(r.date) && convertIsoToLocalDateString(r.date)! >= thisWeekStartStr && convertIsoToLocalDateString(r.date)! <= thisWeekEndStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0) || 0;
  const chuvaMes = rainRecords?.filter(r => convertIsoToLocalDateString(r.date) && convertIsoToLocalDateString(r.date)! >= thisMonthStartStr && convertIsoToLocalDateString(r.date)! <= thisMonthEndStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0) || 0;
  const chuvaAno = rainRecords?.filter(r => convertIsoToLocalDateString(r.date) && convertIsoToLocalDateString(r.date)! >= thisYearStartStr && convertIsoToLocalDateString(r.date)! <= thisYearEndStr && r.millimeters !== null).reduce((sum, r) => sum + (r.millimeters || 0), 0) || 0;
  
  // Última chuva
  const ultimaChuva = rainRecords && rainRecords.length > 0 
    ? new Date(rainRecords.find(r => r.millimeters > 0)?.date || rainRecords[0].date)
    : null;

  // Ranking de placas - Rolos do dia
  const rankingDia = todayRolls.reduce((acc, r) => {
    if (!acc[r.plate]) {
      acc[r.plate] = { plate: r.plate, driver: r.driver, rolos: 0, viagens: 0 };
    }
    acc[r.plate].rolos += r.rolls;
    acc[r.plate].viagens += 1;
    acc[r.plate].driver = r.driver; // Sempre usar o motorista mais recente
    return acc;
  }, {} as Record<string, {plate: string, driver: string, rolos: number, viagens: number}>);

  const rankingDiaArray = Object.values(rankingDia)
    .sort((a, b) => b.rolos - a.rolos)
    .slice(0, 10);

  // Verificar quais caminhões estão na algodoeira agora
  const trucksInAlgodoeira = new Set(
    cottonPullRecords
      ?.filter(r => r.entry_time && !r.exit_time)
      .map(r => r.plate) || []
  );

  // Função para calcular tempo na algodoeira (em minutos)
  const calculateTimeInAlgodoeira = (plate: string): number | null => {
    const record = cottonPullRecords?.find(r => r.plate === plate && r.entry_time && !r.exit_time);
    if (!record || !record.entry_time) return null;

    // Se tem parada_puxe, não calcular tempo (retorna null para não mostrar cronômetro)
    if (record.parada_puxe) return null;

    const now = new Date();
    const [hours, minutes] = record.entry_time.split(':').map(Number);
    const entryTime = new Date();
    entryTime.setHours(hours, minutes, 0, 0);

    const diffMs = now.getTime() - entryTime.getTime();
    return Math.floor(diffMs / (1000 * 60)); // retorna em minutos
  };

  // Função para formatar tempo (minutos para horas se > 60)
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}min`;
  };

  // Função para renderizar cronômetro com cor baseada no tempo
  const renderCronometro = (minutes: number) => {
    const timeFormatted = formatTime(minutes);
    
    if (minutes < 20) {
      return (
        <span className="text-[clamp(0.6rem,0.85vw,0.75rem)] font-medium text-green-500 flex items-center gap-1">
          🕒 {timeFormatted} na unidade
        </span>
      );
    } else if (minutes < 30) {
      return (
        <span className="text-[clamp(0.6rem,0.85vw,0.75rem)] font-medium text-yellow-500 flex items-center gap-1">
          ⚠️ Lentidão Descarga ({timeFormatted})
        </span>
      );
    } else {
      return (
        <span className="text-[clamp(0.6rem,0.85vw,0.75rem)] font-medium text-red-600 animate-pulse flex items-center gap-1">
          ⛔ Descarga Atrasada ({timeFormatted})
        </span>
      );
    }
  };

  // Ranking de placas - Acumulado do mês
  const thisMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const monthRolls = cottonPullRecords?.filter(r => r.date && r.date.startsWith(thisMonth)) || [];
  
  const rankingMes = monthRolls.reduce((acc, r) => {
    if (!acc[r.plate]) {
      acc[r.plate] = { plate: r.plate, driver: r.driver, rolos: 0, viagens: 0 };
    }
    acc[r.plate].rolos += r.rolls;
    acc[r.plate].viagens += 1;
    acc[r.plate].driver = r.driver; // Sempre usar o motorista mais recente
    return acc;
  }, {} as Record<string, {plate: string, driver: string, rolos: number, viagens: number}>);

  const rankingMesArray = Object.values(rankingMes)
    .sort((a, b) => b.rolos - a.rolos)
    .slice(0, 10);

  // Sistema responsivo otimizado para TVs
  const totalCards = produtosParaExibir.length;
  const getResponsiveClasses = () => {
    if (totalCards <= 2) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(280px, 40vw, 800px), 1fr))',
        textSize: 'text-[clamp(0.8rem, 1.6vw, 1.8rem)]',
        titleSize: 'text-[clamp(1rem, 1.9vw, 2.2rem)]',
        cardTitleSize: 'text-[clamp(1.3rem, 2.2vw, 2.8rem)]',
        padding: 'p-[clamp(0.8rem, 1.4vw, 2rem)]',
        gap: 'gap-[clamp(1rem, 1.6vw, 2.2rem)]',
        minHeight: 'min-h-[clamp(5rem, 15vh, 12rem)]'
      };
    } else if (totalCards <= 3) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(240px, 30vw, 600px), 1fr))',
        textSize: 'text-[clamp(0.7rem, 1.4vw, 1.6rem)]',
        titleSize: 'text-[clamp(0.9rem, 1.7vw, 2rem)]',
        cardTitleSize: 'text-[clamp(1.1rem, 2vw, 2.5rem)]',
        padding: 'p-[clamp(0.6rem, 1.2vw, 1.8rem)]',
        gap: 'gap-[clamp(0.8rem, 1.4vw, 2rem)]',
        minHeight: 'min-h-[clamp(4rem, 12vh, 10rem)]'
      };
    } else if (totalCards <= 4) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(200px, 22vw, 500px), 1fr))',
        textSize: 'text-[clamp(0.6rem, 1.2vw, 1.4rem)]',
        titleSize: 'text-[clamp(0.8rem, 1.5vw, 1.8rem)]',
        cardTitleSize: 'text-[clamp(1rem, 1.8vw, 2.2rem)]',
        padding: 'p-[clamp(0.5rem, 1.1vw, 1.6rem)]',
        gap: 'gap-[clamp(0.7rem, 1.3vw, 1.8rem)]',
        minHeight: 'min-h-[clamp(3.5rem, 10vh, 8rem)]'
      };
    } else if (totalCards <= 6) {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(160px, 16vw, 400px), 1fr))',
        textSize: 'text-[clamp(0.5rem, 1vw, 1.2rem)]',
        titleSize: 'text-[clamp(0.7rem, 1.3vw, 1.6rem)]',
        cardTitleSize: 'text-[clamp(0.9rem, 1.5vw, 1.9rem)]',
        padding: 'p-[clamp(0.4rem, 0.9vw, 1.3rem)]',
        gap: 'gap-[clamp(0.6rem, 1.1vw, 1.5rem)]',
        minHeight: 'min-h-[clamp(3rem, 8vh, 6rem)]'
      };
    } else {
      return {
        gridCols: 'repeat(auto-fit, minmax(clamp(130px, 12vw, 300px), 1fr))',
        textSize: 'text-[clamp(0.4rem, 0.8vw, 1rem)]',
        titleSize: 'text-[clamp(0.6rem, 1.1vw, 1.4rem)]',
        cardTitleSize: 'text-[clamp(0.8rem, 1.3vw, 1.7rem)]',
        padding: 'p-[clamp(0.3rem, 0.7vw, 1rem)]',
        gap: 'gap-[clamp(0.5rem, 0.9vw, 1.2rem)]',
        minHeight: 'min-h-[clamp(2.5rem, 6vh, 5rem)]'
      };
    }
  };

  const classes = getResponsiveClasses();
  const infoLevel = totalCards <= 4 ? 'low' : totalCards <= 6 ? 'medium' : 'high';

  // --- DEBUGGING LOGS ---
  console.log('--- DashboardPortariaTV Debug ---');
  console.log('Today (local):', todayStr);
  console.log('Week Range:', thisWeekStartStr, '-', thisWeekEndStr);
  console.log('Month Range:', thisMonthStartStr, '-', thisMonthEndStr);
  console.log('Year Range:', thisYearStartStr, '-', thisYearEndStr);
  console.log('Global Counts:');
  console.log('  Fila:', fila.length);
  console.log('  Carregando:', carregando.length);
  console.log('  Aguardando NF (global):', aguardandoNF.length);
  console.log('  Concluídos (Saída - global):', concluidosSaida.length);
  console.log('  Total Concluídos (top card):', totalConcluidosHoje); // Usando a nova variável
  console.log('---------------------------------');

  // Debugging específico para Pluma e Caroço Aguardando NF
  console.log('\n--- DEBUG: Aguardando NF por Produto ---');
  ['PLUMA', 'CAROÇO'].forEach(productName => {
    const aguardandoNFForProduct = aguardandoNF.filter(l => l.product.toUpperCase() === productName);
    console.log(`  ${productName} - Aguardando NF: ${aguardandoNFForProduct.length}`);
    aguardandoNFForProduct.forEach(item => {
      console.log(`    - Placa: ${item.plate}, Status: ${item.status}, Loaded_at: ${item.loaded_at}, Loaded_date_local: ${convertIsoToLocalDateString(item.loaded_at)}`);
    });
  });
  console.log('---------------------------------------');


  return (
    <ControleGuaritaFitScreen>
      <div className={`fixed inset-0 w-screen h-screen flex flex-col overflow-y-auto transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-[#0a0a0a] text-foreground' 
          : 'bg-gray-50 text-gray-900'
      }`}>
        {/* HEADER - Fluido e Responsivo */}
        <header className={`relative flex flex-wrap items-center justify-between gap-2 backdrop-blur-sm border-b px-[clamp(0.5rem,2vw,3rem)] py-2 sm:py-3 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-black/70 border-emerald-600/30' 
            : 'bg-white/80 border-emerald-500/40'
        }`}>
          {/* Animação de chuva no header */}
          {isRaining && <RainHeaderAnimation />}
          
          <div className="relative z-10 flex items-center gap-2">
            <img 
              src={logo} 
              alt="Logo" 
              className="h-[clamp(1.5rem,2vw,2.5rem)] w-auto cursor-pointer hover:scale-105 transition-transform duration-300" 
              onClick={() => setIsDarkMode(!isDarkMode)}
              title={isDarkMode ? 'Clique para ativar modo claro' : 'Clique para ativar modo escuro'}
            />
            <div>
              <h1 className={`text-[clamp(1rem,2vw,1.8rem)] font-semibold transition-colors duration-300 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>Controle Guarita</h1>
              <p className={`text-[clamp(0.7rem,1.2vw,1rem)] transition-colors duration-300 ${
                isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
              }`}>IBA Santa Luzia</p>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 sm:gap-3">
            {/* Indicador de Chuva */}
            <div className="flex items-start gap-1">
              <Droplet size={14} className={`w-[clamp(0.9rem,1.2vw,1.2rem)] h-[clamp(0.9rem,1.2vw,1.2rem)] text-blue-400 mt-0.5 ${isRaining ? 'animate-pulse' : ''}`} />
              <div className={`flex flex-col gap-0.5 text-[clamp(0.6rem,0.9vw,0.8rem)] font-normal transition-colors duration-300 ${
                isDarkMode ? 'text-muted-foreground' : 'text-gray-600'
              }`}>
                <div>H - {Math.round(chuvaHoje)} mm</div>
                <div>M - {Math.round(chuvaMes)} mm</div>
                <div>A - {Math.round(chuvaAno)} mm</div>
              </div>
            </div>
            
            {/* Data e Hora */}
            <div className="text-right whitespace-nowrap">
              <p className={`text-[clamp(0.7rem,1vw,0.9rem)] hidden sm:block transition-colors duration-300 ${
                isDarkMode ? 'text-muted-foreground' : 'text-gray-600'
              }`}>
                {currentTime.toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric' 
                })}
              </p>
              <p className={`text-[clamp(0.8rem,1.3vw,1.1rem)] font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
              }`}>
                {currentTime.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </header>

        {/* BANNER MATERIAIS RECEBIDOS */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-[clamp(0.5rem,2vw,3rem)] py-1">
          <div className="w-full">
            <div className="animate-pulse text-center font-semibold text-[clamp(0.7rem,1.1vw,1rem)]">
              {getBannerMessages()[bannerIndex] || "📦 Sistema de materiais carregando..."}
            </div>
          </div>
        </div>

        {/* CARREGAMENTOS - Grid Responsivo Compacto */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[clamp(0.5rem,1vw,1rem)] px-[clamp(0.5rem,1.5vw,1.5rem)] py-[clamp(0.3rem,0.8vw,0.8rem)]">
            {produtosParaExibir.map((produto) => {
              const filaItems = fila.filter(l => l.product.toUpperCase() === produto);
              const carregandoItems = carregandoCard.filter(l => l.product.toUpperCase() === produto);
              const carregandoListaItems = carregando.filter(l => l.product.toUpperCase() === produto);
              const aguardandoNFItems = aguardandoNF.filter(l => l.product.toUpperCase() === produto);
              const concluidosSaidaItems = concluidosSaida.filter(l => l.product.toUpperCase() === produto);

              // --- DEBUGGING LOGS PER PRODUCT ---
            console.log(`\n--- Produto: ${produto} ---`);
            console.log('  Fila Items:', filaItems.length);
            console.log('  Carregando Items (Card):', carregandoItems.length);
            console.log('  Carregando Items (Lista):', carregandoListaItems.length);
            console.log('  Aguardando NF Items:', aguardandoNFItems.length);
            console.log('  Concluídos Saída Items:', concluidosSaidaItems.length);
            console.log('---------------------------------');
            // --- END DEBUGGING LOGS ---

            // Cálculo inteligente de quantidades
            const getQuantidadeTotal = (items: Array<{bales?: number; weight?: number}>) => {
              if (produto === "PLUMA" || produto === "FIBRILHA") {
                // Para Pluma e Fibrilha: mostrar em Fardos
                const totalFardos = items.reduce((sum, item) => sum + (item.bales || 0), 0);
                return `${totalFardos.toLocaleString('pt-BR')} Fardos`;
              } else {
                // Para Caroço e Briquete: mostrar em KG
                const totalKg = items.reduce((sum, item) => sum + (item.weight || 0), 0);
                return `${totalKg.toLocaleString('pt-BR')} KG`;
              }
            };

            return (
              <Card key={produto} className={`backdrop-blur-lg border flex flex-col transition-all duration-500 hover:shadow-xl ${
                isDarkMode 
                  ? 'bg-black/60 border-emerald-600/30 text-emerald-100' 
                  : 'bg-white/90 border-emerald-500/30 text-gray-900'
              }`}>
                <CardHeader className={`border-b p-[clamp(0.4rem,0.8vw,0.8rem)] flex-shrink-0 transition-colors duration-300 ${
                  isDarkMode ? 'border-emerald-600/30' : 'border-emerald-500/30'
                }`}>
                  <CardTitle className={`text-[clamp(0.9rem,1.4vw,1.2rem)] font-bold text-center transition-colors duration-300 ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>
                    {produto}
                  </CardTitle>
                  <div className="text-center">
                    <p className={`text-[clamp(0.65rem,0.9vw,0.8rem)] transition-colors duration-300 ${
                      isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                    }`}>
                      {produto === "PLUMA" || produto === "FIBRILHA" ? 
                        `${(filaItems.reduce((sum, item) => sum + (item.bales || 0), 0) + 
                           carregandoListaItems.reduce((sum, item) => sum + (item.bales || 0), 0) + 
                           aguardandoNFItems.reduce((sum, item) => sum + (item.bales || 0), 0) +
                           concluidosSaidaItems.reduce((sum, item) => sum + (item.bales || 0), 0)).toLocaleString('pt-BR')} Fardos` :
                        `${(filaItems.reduce((sum, item) => sum + (item.weight || 0), 0) + 
                           carregandoListaItems.reduce((sum, item) => sum + (item.weight || 0), 0) + 
                           aguardandoNFItems.reduce((sum, item) => sum + (item.weight || 0), 0) +
                           concluidosSaidaItems.reduce((sum, item) => sum + (item.weight || 0), 0)).toLocaleString('pt-BR')} KG`
                      }
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-[clamp(0.4rem,0.8vw,0.8rem)] flex flex-col justify-start">
                  <div className="grid grid-cols-3 gap-[clamp(0.3rem,0.6vw,0.6rem)] mb-[clamp(0.4rem,0.8vw,0.8rem)] text-center flex-shrink-0">
                    <div className={`border rounded p-[clamp(0.2rem,0.4vw,0.5rem)] flex flex-col justify-center min-h-[clamp(2rem,4vh,2.5rem)] transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-yellow-600/20 border-yellow-600/30' 
                        : 'bg-yellow-100/80 border-yellow-400/40'
                    }`}>
                      <p className={`text-[clamp(0.55rem,0.8vw,0.7rem)] font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-yellow-400' : 'text-yellow-700'
                      }`}>FILA</p>
                      <p className={`text-[clamp(0.7rem,1vw,0.9rem)] font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                      }`}>{filaItems.length}</p>
                    </div>
                    <div className={`border rounded p-[clamp(0.2rem,0.4vw,0.5rem)] flex flex-col justify-center min-h-[clamp(2rem,4vh,2.5rem)] transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-blue-600/20 border-blue-600/30' 
                        : 'bg-blue-100/80 border-blue-400/40'
                    }`}>
                      <p className={`text-[clamp(0.55rem,0.8vw,0.7rem)] font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-700'
                      }`}>CARREGANDO</p>
                      <p className={`text-[clamp(0.7rem,1vw,0.9rem)] font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-blue-300' : 'text-blue-800'
                      }`}>{carregandoItems.length}</p>
                    </div>
                    <div className={`border rounded p-[clamp(0.2rem,0.4vw,0.5rem)] flex flex-col justify-center min-h-[clamp(2rem,4vh,2.5rem)] transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-green-600/20 border-green-600/30' 
                        : 'bg-green-100/80 border-green-400/40'
                    }`}>
                      <p className={`text-[clamp(0.55rem,0.8vw,0.7rem)] font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-green-400' : 'text-green-700'
                      }`}>CONCLUÍDOS</p>
                      <p className={`text-[clamp(0.7rem,1vw,0.9rem)] font-bold transition-colors duration-300 ${
                        isDarkMode ? 'text-green-300' : 'text-green-800'
                      }`}>{aguardandoNFItems.length + concluidosSaidaItems.length}</p>
                    </div>
                  </div>

                  {/* Seção de Detalhes - Caminhões Carregando (apenas 2 primeiros) */}
                  {carregandoListaItems.length > 0 && (
                    <div className="mt-[clamp(0.3rem,0.6vw,0.6rem)] flex-shrink-0">
                      <p className={`text-[clamp(0.6rem,0.8vw,0.75rem)] mb-[clamp(0.2rem,0.4vw,0.4rem)] font-semibold transition-colors duration-300 ${
                        isDarkMode ? 'text-emerald-300' : 'text-emerald-700'
                      }`}>🚛 Carregando agora:</p>
                      <div className="grid grid-cols-2 gap-[clamp(0.2rem,0.4vw,0.4rem)]">
                        {carregandoListaItems.slice(0, 2).map((item, index) => (
                          <div 
                            key={index}
                            className={`border rounded p-[clamp(0.2rem,0.4vw,0.4rem)] transition-colors duration-300 ${
                              isDarkMode 
                                ? 'bg-blue-600/10 border-blue-600/30' 
                                : 'bg-blue-100/50 border-blue-400/30'
                            }`}
                          >
                            <p className={`text-[clamp(0.55rem,0.75vw,0.65rem)] font-semibold truncate transition-colors duration-300 ${
                              isDarkMode ? 'text-blue-400' : 'text-blue-700'
                            }`}>
                              {item.truck_type}
                            </p>
                            <p className={`text-[clamp(0.5rem,0.7vw,0.6rem)] truncate transition-colors duration-300 ${
                              isDarkMode ? 'text-blue-300' : 'text-blue-600'
                            }`}>
                              {index + 1}º {item.carrier}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* ROLOS E GESTÃO DE TEMPO - Grid Responsivo Compacto */}
        <div className="px-[clamp(0.5rem,1.5vw,1.5rem)] py-[clamp(0.3rem,0.8vw,0.8rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(0.5rem,1vw,1rem)]">

              {/* Card de Ranking Puxe Lavoura */}
              <Card className={`backdrop-blur-lg border flex flex-col transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-black/60 border-emerald-600/30 text-emerald-100' 
                  : 'bg-emerald-700 border-emerald-600/50 text-white'
              }`}>
                <CardHeader className={`border-b p-[clamp(0.4rem,0.8vw,0.8rem)] transition-colors duration-300 ${
                  isDarkMode ? 'border-emerald-600/30' : 'border-emerald-600/50'
                }`}>
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-2">
                    <CardTitle className={`text-[clamp(0.85rem,1.3vw,1.1rem)] font-bold flex items-center gap-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-emerald-400' : 'text-white'
                    }`}>
                      <span>Ranking Puxe Lavoura</span>
                    </CardTitle>
              <div className={`text-[clamp(0.6rem,0.9vw,0.8rem)] transition-colors duration-300 ${
                isDarkMode ? 'text-emerald-300' : 'text-emerald-100'
              }`}>
                {(() => {
                  // Filtrar registros de hoje de forma mais robusta
                  const todayString = getTodayLocalDate(); // Usa a função local
                  const pulledToday = cottonPullRecords?.filter(r => {
                    // Normaliza comparando strings YYYY-MM-DD ou convertendo ISO para local
                    const dateField = r.date || r.created_at || null;
                    if (!dateField) return false;
                    // convertIsoToLocalDateString lida com ISO ou DATE
                    const localDate = convertIsoToLocalDateString(dateField) || '';
                    return localDate === todayString;
                  }) || [];

                  console.log('=== DEBUG FAZENDAS (improved) ===');
                  console.log('Cotton Pull Records Total:', cottonPullRecords?.length || 0);
                  console.log('Today String:', todayString);
                  console.log('Pulled Today Count:', pulledToday.length);
                  console.log('Pulled Today Data (FULL OBJECT):', JSON.stringify(pulledToday, null, 2));

                  if (pulledToday.length > 0) {
                    // Normalização: remove acentos, pontuação e case para agrupar nomes equivalentes
                    const normalize = (s?: string) => {
                      if (!s) return '';
                      try {
                        return s
                          .toString()
                          .normalize('NFD')
                          .replace(/\p{Diacritic}/gu, '')
                          .replace(/[^\p{L}\p{N} ]+/gu, '')
                          .toLowerCase()
                          .trim();
                      } catch (e) {
                        // Fallback se ambiente não suportar \p{Diacritic}
                        return s.toString().normalize('NFD').replace(/[^\w\s]/g, '').toLowerCase().trim();
                      }
                    };

                    // Construir mapa normalized -> set of original names (prefer farm, then producer fields)
                    const farmMap = new Map<string, Set<string>>();
                    pulledToday.forEach(r => {
                      const candidates = [r.farm, r.producer];
                      for (const c of candidates) {
                        if (c && String(c).trim() !== '') {
                          const n = normalize(String(c));
                          if (!farmMap.has(n)) farmMap.set(n, new Set());
                          farmMap.get(n)!.add(String(c).trim());
                          break; // use first available candidate for that record
                        }
                      }
                    });

                    const uniqueFarms = Array.from(farmMap.values()).map(set => Array.from(set)[0]);

                    // Talhões - Limpar "TH" e "Talhao" duplicados
                    const uniqueTalhaos = [...new Set(
                      pulledToday
                        .map(r => r.talhao)
                        .filter(t => t && String(t).trim() !== '')
                        .map(t => String(t).replace(/^(TH|Talh[aã]o)\s*/gi, '').trim()) // Remove "TH" ou "Talhao/Talhão" do início
                    )];

                    console.log('Unique Farms (normalized):', uniqueFarms);
                    console.log('Unique Talhaos (filtered):', uniqueTalhaos);
                    console.log('Farm details:', pulledToday.map(r => ({ plate: r.plate, farm: r.farm, producer: r.producer, talhao: r.talhao })));
                    console.log('======================');

                    if (uniqueFarms.length > 0 || uniqueTalhaos.length > 0) {
                      return (
                        <div className="flex items-center gap-[clamp(0.2rem,0.4vw,0.5rem)]">
                          <span className="text-green-400 text-[clamp(0.8rem,1.2vw,1.4rem)]">🌿</span>
                          <div className="flex flex-col">
                            <span className="text-[clamp(0.65rem,1vw,1.1rem)] font-semibold text-emerald-400">
                              Puxando hoje
                            </span>
                            <div className="text-[clamp(0.55rem,0.85vw,0.95rem)] text-emerald-300">
                              {uniqueFarms.length > 0 && (
                                <span>
                                  {uniqueFarms.slice(0, 2).join(', ')}
                                  {uniqueFarms.length > 2 && ` +${uniqueFarms.length - 2}`}
                                </span>
                              )}
                              {uniqueTalhaos.length > 0 && (
                                <span className={uniqueFarms.length > 0 ? "ml-2" : ""}>
                                  Talhão {uniqueTalhaos.slice(0, 3).join(', ')}
                                  {uniqueTalhaos.length > 3 && ` +${uniqueTalhaos.length - 3}`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  
                  return (
                    <div className="flex items-center gap-[clamp(0.2rem,0.4vw,0.5rem)]">
                      <span className="text-green-400 text-[clamp(0.8rem,1.2vw,1.4rem)]">🌿</span>
                      <span className="text-[clamp(0.65rem,1vw,1.1rem)] font-semibold text-emerald-400">
                        Puxando hoje - {pulledToday.length} registros
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>
          </CardHeader>
          <CardContent className={`p-[clamp(0.4rem,0.8vw,0.8rem)] h-full overflow-hidden ${
            isDarkMode ? '' : '[&_.text-emerald-400]:!text-white [&_.text-emerald-300]:!text-gray-100'
          }`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[clamp(0.4rem,0.8vw,0.8rem)] h-full">
              
              {/* Ranking do Dia */}
              <div className="flex flex-col h-full">
                <h3 className={`text-[clamp(0.65rem,0.9vw,0.85rem)] font-semibold mb-[clamp(0.15rem,0.3vh,0.3rem)] border-b pb-[clamp(0.15rem,0.3vh,0.3rem)] ${
                  isDarkMode ? 'text-emerald-400 border-emerald-600/30' : 'text-white border-emerald-400/30'
                }`}>
                  HOJE ({rankingDiaArray.reduce((sum, item) => sum + item.rolos, 0).toLocaleString('pt-BR')} rolos)
                </h3>
                <div className="space-y-[clamp(0.1rem,0.2vh,0.25rem)] flex-1 overflow-y-auto">
                  {rankingDiaArray.length > 0 ? (
                    rankingDiaArray.slice(0, totalCards <= 3 ? 8 : totalCards <= 4 ? 10 : totalCards <= 6 ? 12 : 15).map((item, index) => {
                      const isInAlgodoeira = trucksInAlgodoeira.has(item.plate);
                      const record = cottonPullRecords?.find(r => r.plate === item.plate && r.entry_time && !r.exit_time);
                      const hasParadaPuxe = record?.parada_puxe === true;
                      const timeInAlgodoeira = isInAlgodoeira && !hasParadaPuxe ? calculateTimeInAlgodoeira(item.plate) : null;
                      
                      return (
                        <div
                          key={item.plate}
                          className={`bg-black/40 border rounded p-[clamp(0.15rem,0.3vw,0.35rem)] flex justify-between items-center hover:border-emerald-500/40 transition-colors ${
                            isInAlgodoeira && !hasParadaPuxe
                              ? 'loading-truck-alert border-yellow-400' 
                              : 'border-emerald-600/20'
                          }`}
                        >
                          <div className="flex items-center gap-[clamp(0.15rem,0.3vw,0.35rem)] min-w-0 flex-1">
                            <span className={`w-[clamp(0.9rem,1.3vw,1.4rem)] h-[clamp(0.9rem,1.3vw,1.4rem)] rounded-full flex items-center justify-center text-[clamp(0.4rem,0.6vw,0.65rem)] font-bold ${
                              index === 0 ? 'bg-yellow-500 text-black' :
                              index === 1 ? 'bg-gray-400 text-black' :
                              index === 2 ? 'bg-orange-500 text-black' :
                              'bg-emerald-600/30 text-emerald-300'
                            }`}>
                              {index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className={`font-semibold text-[clamp(0.5rem,0.75vw,0.8rem)] ${isInAlgodoeira && !hasParadaPuxe ? 'text-yellow-300' : 'text-emerald-400'}`}>
                                {item.plate} {isInAlgodoeira && !hasParadaPuxe && '🚛'}
                              </p>
                              <p className={`text-[clamp(0.45rem,0.65vw,0.7rem)] ${isInAlgodoeira && !hasParadaPuxe ? 'text-yellow-200' : 'text-emerald-300'}`}>
                                {item.driver}
                              </p>
                              {/* Status Parada Puxe */}
                              {hasParadaPuxe && (
                                <div className="mt-[clamp(0.1rem,0.2vh,0.2rem)]">
                                  <span className="text-[clamp(0.6rem,0.85vw,0.75rem)] font-medium text-muted-foreground italic flex items-center gap-1">
                                    ⏸️ Parada Puxe
                                  </span>
                                </div>
                              )}
                              {/* Cronômetro em tempo real */}
                              {isInAlgodoeira && timeInAlgodoeira !== null && !hasParadaPuxe && (
                                <div className="mt-[clamp(0.1rem,0.2vh,0.2rem)]">
                                  {renderCronometro(timeInAlgodoeira)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-1">
                            <p className={`font-bold text-[clamp(0.5rem,0.75vw,0.8rem)] ${isInAlgodoeira ? 'text-yellow-300' : 'text-emerald-400'}`}>
                              {item.rolos.toLocaleString('pt-BR')}
                            </p>
                            <p className={`text-[clamp(0.45rem,0.65vw,0.7rem)] ${isInAlgodoeira ? 'text-yellow-200' : 'text-emerald-300'}`}>
                              {item.viagens} viagens
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-emerald-400 text-center py-4 text-[clamp(0.5rem,0.75vw,0.8rem)]">Nenhum rolo hoje</p>
                  )}
                </div>
              </div>

              {/* Ranking do Mês */}
              <div className="flex flex-col h-full">
                <h3 className={`text-[clamp(0.65rem,0.9vw,0.85rem)] font-semibold mb-[clamp(0.15rem,0.3vh,0.3rem)] border-b pb-[clamp(0.15rem,0.3vh,0.3rem)] ${
                  isDarkMode ? 'text-emerald-400 border-emerald-600/30' : 'text-white border-emerald-400/30'
                }`}>
                  MÊS ({rankingMesArray.reduce((sum, item) => sum + item.rolos, 0).toLocaleString('pt-BR')} rolos)
                </h3>
                <div className="space-y-[clamp(0.1rem,0.2vh,0.25rem)] flex-1 overflow-y-auto">
                  {rankingMesArray.length > 0 ? (
                    rankingMesArray.slice(0, totalCards <= 3 ? 8 : totalCards <= 4 ? 10 : totalCards <= 6 ? 12 : 15).map((item, index) => (
                      <div
                        key={item.plate}
                        className="bg-black/40 border border-emerald-600/20 rounded p-[clamp(0.15rem,0.3vw,0.35rem)] flex justify-between items-center hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="flex items-center gap-[clamp(0.15rem,0.3vw,0.35rem)] min-w-0 flex-1">
                          <span className={`w-[clamp(0.9rem,1.3vw,1.4rem)] h-[clamp(0.9rem,1.3vw,1.4rem)] rounded-full flex items-center justify-center text-[clamp(0.4rem,0.6vw,0.65rem)] font-bold ${
                            index === 0 ? 'bg-yellow-500 text-black' :
                            index === 1 ? 'bg-gray-400 text-black' :
                            index === 2 ? 'bg-orange-500 text-black' :
                            'bg-emerald-600/30 text-emerald-300'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-emerald-400 text-[clamp(0.5rem,0.75vw,0.8rem)]">{item.plate}</p>
                            <p className="text-[clamp(0.45rem,0.65vw,0.7rem)] text-emerald-300">{item.driver}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-1">
                          <p className="font-bold text-emerald-400 text-[clamp(0.5rem,0.75vw,0.8rem)]">{item.rolos.toLocaleString('pt-BR')}</p>
                          <p className="text-[clamp(0.45rem,0.65vw,0.7rem)] text-emerald-300">{item.viagens} viagens</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-emerald-400 text-center py-4 text-[clamp(0.5rem,0.75vw,0.8rem)]">Nenhum rolo neste mês</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
              </Card>

              {/* Card de Gestão de Tempo */}
              <Card className={`backdrop-blur-lg border transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-black/60 text-emerald-100 border-emerald-600/30' 
                  : 'bg-emerald-700 text-white border-emerald-600/50'
              }`}>
                <CardHeader className={`border-b p-[clamp(0.5rem,1vw,1rem)] transition-colors duration-300 ${
                  isDarkMode ? 'border-emerald-600/30' : 'border-emerald-600/50'
                }`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                    <CardTitle className={`text-[clamp(1rem,1.8vw,1.5rem)] font-bold flex items-center gap-2 transition-colors duration-300 ${
                      isDarkMode ? 'text-emerald-400' : 'text-white'
                    }`}>
                      <Clock size={18} className={`w-[clamp(1rem,1.5vw,1.5rem)] h-[clamp(1rem,1.5vw,1.5rem)] transition-colors duration-300 ${
                        isDarkMode ? 'text-emerald-400' : 'text-white'
                      }`} />
                      <span>Gestão de Tempo</span>
                    </CardTitle>
                    
                    {/* Médias Gerais - Lado a Lado */}
                    <div className="flex items-center gap-[clamp(0.3rem,0.6vw,0.8rem)]">
                      <div className="text-right">
                        <p className="text-[clamp(0.65rem,1vw,0.9rem)] text-muted-foreground font-medium">Algodoeira</p>
                        <p className="text-[clamp(0.85rem,1.4vw,1.3rem)] font-bold text-green-500">
                          {loadingGestaoTempo ? "..." : formatTime(gestaoTempo?.tempo_algodoeira || 0)}
                        </p>
                      </div>
                      <div className="h-[clamp(2rem,3vh,3rem)] w-px bg-emerald-600/30"></div>
                      <div className="text-right">
                        <p className="text-[clamp(0.65rem,1vw,0.9rem)] text-muted-foreground font-medium">Lavoura</p>
                        <p className="text-[clamp(0.85rem,1.4vw,1.3rem)] font-bold text-green-500">
                          {loadingGestaoTempo ? "..." : formatTime(gestaoTempo?.tempo_lavoura || 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className={`p-[clamp(0.5rem,1vw,1rem)] ${
                  isDarkMode ? '' : '[&_.text-emerald-400]:!text-white [&_.text-emerald-300]:!text-gray-100'
                }`}>
                  {/* Detalhamento Carga a Carga - Scroll Interno */}
                  <div className="max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted/40">
                    <h4 className={`text-[clamp(0.7rem,1.1vw,1rem)] font-semibold mb-2 border-b pb-2 ${
                      isDarkMode ? 'text-emerald-400 border-emerald-600/30' : 'text-white border-emerald-400/30'
                    }`}>
                      📊 Detalhamento Carga a Carga (Hoje)
                    </h4>
                    <div 
                      ref={scrollContainerRef}
                      className={`border rounded-lg p-[clamp(0.4rem,0.8vw,0.8rem)] max-h-[50vh] overflow-y-auto scroll-smooth ${
                        isDarkMode ? 'bg-black/30 border-emerald-600/20' : 'bg-emerald-800/30 border-emerald-400/20'
                      }`}
                    >
                      {loadingCargas ? (
                        <p className="text-emerald-400 text-center text-[clamp(0.65rem,1vw,0.9rem)] py-3">Carregando...</p>
                      ) : cargas.length > 0 ? (
                        <div className="space-y-1">
                          {/* Cabeçalho da tabela */}
                          <div className="grid grid-cols-8 gap-[clamp(0.2rem,0.4vw,0.5rem)] text-[clamp(0.55rem,0.8vw,0.75rem)] font-semibold text-white pb-1 sm:pb-2 border-b border-emerald-600/20">
                            <div>Placa</div>
                            <div>Motorista</div>
                            <div className="text-center">Talhão</div>
                            <div className="text-center">Viagem</div>
                            <div className="text-center">Rolos</div>
                            <div className="text-center">T.Lavoura</div>
                            <div className="text-center">T.Algod.</div>
                            <div className="text-center">Total</div>
                          </div>
                          {/* Linhas de dados */}
                          {cargas.map((carga, index) => (
                            <div 
                              key={`${carga.placa}-${carga.viagem_num}`}
                              className={`grid grid-cols-8 gap-[clamp(0.2rem,0.4vw,0.5rem)] text-[clamp(0.5rem,0.75vw,0.7rem)] py-1 sm:py-1.5 ${
                                index % 2 === 0 ? 'bg-muted/30' : ''
                              }`}
                            >
                              <div className="text-emerald-400 font-semibold truncate text-[clamp(0.65rem,1vw,0.9rem)]">{carga.placa}</div>
                              <div className="text-emerald-300 font-medium truncate text-[clamp(0.6rem,0.9vw,0.8rem)]">{carga.motorista}</div>
                              <div className="text-center text-orange-400 font-semibold text-[clamp(0.6rem,0.9vw,0.8rem)]">{carga.talhao || '-'}</div>
                              <div className="text-center text-blue-400 font-semibold text-[clamp(0.6rem,0.9vw,0.8rem)]">{carga.viagem_num}ª</div>
                              <div className="text-center text-yellow-400 font-medium text-[clamp(0.6rem,0.9vw,0.8rem)]">{carga.qtd_rolos}</div>
                              <div className="text-center text-emerald-400 font-semibold text-[clamp(0.6rem,0.9vw,0.8rem)]">{formatTime(carga.tempo_lavoura)}</div>
                              <div className="text-center text-emerald-400 font-semibold text-[clamp(0.6rem,0.9vw,0.8rem)]">{formatTime(carga.tempo_algodoeira)}</div>
                              <div className="text-center text-emerald-400 font-bold text-[clamp(0.65rem,1vw,0.9rem)]">{formatTime(carga.tempo_total)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-emerald-400 text-center text-[clamp(0.65rem,1vw,0.9rem)] py-2 sm:py-3">Nenhuma carga completa registrada hoje</p>
                      )}
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </ControleGuaritaFitScreen>
  );
}

export default DashboardPortariaTV;