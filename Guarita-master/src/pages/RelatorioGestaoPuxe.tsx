import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, TrendingUp, Clock, Users, BarChart3, Timer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import logo from "@/assets/BF_logo.png";
import { useCottonPull, useGestaoTempo, useGestaoTempoCargas } from "@/hooks/use-supabase";
import type { CottonPull } from "@/lib/supabase";

interface DadosDiario {
  dia: string;
  total_viagens: number;
  total_veiculos: number;
  media_algodoeira_min: number;
  media_viagem_min: number;
  media_total_min: number;
}

interface DadosMensal {
  mes: string;
  fazenda: string;
  viagens: number;
  media_algodoeira_min: number;
  media_viagem_min: number;
  media_total_min: number;
}

interface RankingData {
  motorista: string;
  placa: string;
  viagens: number;
  media_algodoeira_min: number;
  media_viagem_min: number;
  media_total_min: number;
  ultima_viagem: string;
}

interface ResumoPlaca {
  placa: string;
  motorista: string;
  viagens: number;
  rolos: number;
  tempoAlgodoeira: number;
  tempoViagemLavoura: number;
  talhoes: Set<string>;
}

interface DetalhePuxe extends CottonPull {
  tempo_algodoeira_min?: number;
  tempo_viagem_lavoura_min?: number;
}

const RelatorioGestaoPuxe = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("ranking");
  const [dadosDiario, setDadosDiario] = useState<DadosDiario[]>([]);
  const [dadosMensal, setDadosMensal] = useState<DadosMensal[]>([]);
  const [ranking, setRanking] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediasGerais, setMediasGerais] = useState({ algodoeira: 0, viagem: 0, totalViagens: 0 });
  const [filtroMotorista, setFiltroMotorista] = useState("");
  const [filtroPlaca, setFiltroPlaca] = useState("");
  const [filtroDataInicial, setFiltroDataInicial] = useState("");
  const [filtroDataFinal, setFiltroDataFinal] = useState("");
  const [rankingDetalhado, setRankingDetalhado] = useState<DetalhePuxe[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [puxeViagensMap, setPuxeViagensMap] = useState<Map<string, { algodoeira: number; viagem: number }>>(new Map());
  const { records: cottonRecords } = useCottonPull();
  const { data: gestaoTempo } = useGestaoTempo();
  const { cargas: gestaoTempoCargas } = useGestaoTempoCargas();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar dados diários
      const { data: diario, error: erroDiario } = await supabase
        .from("view_puxe_diario")
        .select("*")
        .order("dia", { ascending: false })
        .limit(30);

      if (!erroDiario && diario) {
        setDadosDiario(diario);
      }

      // Buscar dados mensais
      const { data: mensal, error: erroMensal } = await supabase
        .from("view_puxe_mensal")
        .select("*")
        .order("mes", { ascending: false });

      if (!erroMensal && mensal) {
        setDadosMensal(mensal);
      }

      // Buscar ranking
      const { data: rank, error: erroRank } = await supabase
        .from("view_ranking_puxe")
        .select("*")
        .order("viagens", { ascending: false })
        .limit(20);

      if (!erroRank && rank) {
        setRanking(rank);
      }

      // Buscar médias gerais DIRETO da tabela puxe_viagens
      // FILTRO: apenas viagens onde entrada E saída são NO MESMO DIA
      const { data: viagensMedias, error: erroMedias } = await supabase
        .from("puxe_viagens")
        .select("hora_chegada, hora_saida, tempo_unidade_min, tempo_lavoura_min")
        .not("hora_chegada", "is", null)
        .not("hora_saida", "is", null)
        .not("tempo_unidade_min", "is", null);

      if (!erroMedias && viagensMedias && viagensMedias.length > 0) {
        // Filtrar apenas viagens onde entrada e saída são no mesmo dia
        const viagensMesmoDia = viagensMedias.filter(v => {
          const dataChegada = new Date(v.hora_chegada).toDateString();
          const dataSaida = new Date(v.hora_saida).toDateString();
          return dataChegada === dataSaida && (v.tempo_unidade_min || 0) > 0;
        });

        if (viagensMesmoDia.length > 0) {
          const somaAlgodoeira = viagensMesmoDia.reduce((sum, v) => sum + (v.tempo_unidade_min || 0), 0);
          const somaViagem = viagensMesmoDia.reduce((sum, v) => sum + (v.tempo_lavoura_min || 0), 0);
          
          setMediasGerais({
            algodoeira: Math.round(somaAlgodoeira / viagensMesmoDia.length),
            viagem: Math.round(somaViagem / viagensMesmoDia.length),
            totalViagens: viagensMesmoDia.length,
          });
        }
      }

      // Buscar tempo_lavoura_min da view view_relatorio_puxe que já tem tudo calculado
      const { data: viagensRelatorio, error: erroRelatorio } = await supabase
        .from("view_relatorio_puxe")
        .select("placa, data, hora_chegada, tempo_unidade_min, tempo_lavoura_min");

      if (!erroRelatorio && viagensRelatorio) {
        const mapaViagens = new Map<string, { algodoeira: number; viagem: number }>();
        console.log('=== DEBUG VIEW_RELATORIO_PUXE ===');
        console.log('Total de registros:', viagensRelatorio.length);
        
        if (viagensRelatorio.length === 0) {
          console.warn('⚠️ VIEW view_relatorio_puxe ESTÁ VAZIA!');
          console.warn('Você precisa executar os seguintes scripts no Supabase SQL Editor:');
          console.warn('1. create_puxe_views.sql (cria tabela, triggers e views)');
          console.warn('2. migrate_historical_puxe_data.sql (migra dados históricos)');
        } else {
          viagensRelatorio.forEach(v => {
            // Criar chave: placa + data + hora (extrair apenas HH:mm do timestamp)
            const dataHora = new Date(v.hora_chegada);
            const hora = dataHora.toTimeString().substring(0, 5); // HH:mm
            const data = dataHora.toISOString().split('T')[0]; // yyyy-mm-dd
            const key = `${v.placa}_${data}_${hora}`;
            
            mapaViagens.set(key, {
              algodoeira: v.tempo_unidade_min || 0,
              viagem: v.tempo_lavoura_min || 0
            });
            
            // Log primeiros 5 para debug
            if (mapaViagens.size <= 5) {
              console.log(`Key: ${key}`);
              console.log(`  Algodoeira: ${v.tempo_unidade_min}min, Viagem: ${v.tempo_lavoura_min}min`);
            }
          });
          
          console.log('Total de chaves no mapa:', mapaViagens.size);
        }
        setPuxeViagensMap(mapaViagens);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular totalizadores para cards de resumo
  const totalizadoresGerais = dadosDiario.reduce(
    (acc, d) => ({
      viagensTotal: acc.viagensTotal + d.total_viagens,
      veiculosTotal: acc.veiculosTotal + d.total_veiculos,
    }),
    { viagensTotal: 0, veiculosTotal: 0 }
  );

  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  // Formatar minutos para horas e minutos
  const formatTime = (minutes: number | null) => {
    if (!minutes) return "0min";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const handleRankingClick = async (placa: string, motorista: string) => {
    try {
      // Buscar todos os registros dessa placa/motorista
      const registrosPlaca = cottonRecords.filter(
        r => r.plate === placa && r.driver === motorista
      ).sort((a, b) => `${a.date} ${a.entry_time}`.localeCompare(`${b.date} ${b.entry_time}`));
      
      // Agrupar por data para processar dia a dia
      const porData = registrosPlaca.reduce((acc, r) => {
        if (!acc[r.date]) acc[r.date] = [];
        acc[r.date].push(r);
        return acc;
      }, {} as Record<string, typeof registrosPlaca>);
      
      // Processar cada dia calculando tempos
      const detalhesComTempo: DetalhePuxe[] = [];
      
      Object.keys(porData).forEach(data => {
        const viagensDia = porData[data];
        
        viagensDia.forEach((r, idx) => {
          // Calcular tempo algodoeira
          let tempo_algodoeira_min = null;
          if (r.entry_time && r.exit_time) {
            const [eH, eM] = r.entry_time.split(':').map(Number);
            const [sH, sM] = r.exit_time.split(':').map(Number);
            let tempo = (sH * 60 + sM) - (eH * 60 + eM);
            // Se negativo, assumir que passou da meia-noite
            if (tempo < 0) tempo += 1440;
            tempo_algodoeira_min = tempo;
          }
          
          // Calcular tempo viagem lavoura (tempo entre saída anterior e entrada atual)
          let tempo_viagem_lavoura_min = null;
          if (idx > 0 && viagensDia[idx - 1].exit_time && r.entry_time) {
            const viagemAnterior = viagensDia[idx - 1];
            const [sH, sM] = viagemAnterior.exit_time!.split(':').map(Number);
            const [eH, eM] = r.entry_time.split(':').map(Number);
            let tempo = (eH * 60 + eM) - (sH * 60 + sM);
            // Se negativo, assumir que passou da meia-noite
            if (tempo < 0) tempo += 1440;
            if (tempo > 0) tempo_viagem_lavoura_min = tempo;
          }
          
          detalhesComTempo.push({
            ...r,
            tempo_algodoeira_min,
            tempo_viagem_lavoura_min
          });
        });
      });
      
      // Ordenar por data e hora decrescente para exibir
      detalhesComTempo.sort((a, b) => 
        `${b.date} ${b.entry_time}`.localeCompare(`${a.date} ${a.entry_time}`)
      );
      
      setRankingDetalhado(detalhesComTempo);
      setDialogOpen(true);
    } catch (error) {
      console.error("Erro ao buscar detalhes do ranking:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100">
      <div className="max-w-full px-4 py-4 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate("/reports")} className="flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-400">Gestão do Puxe de Rolos</h1>
              <p className="text-gray-400 mt-1 text-sm sm:text-base">Análise de tempos e performance</p>
            </div>
          </div>
          {/* Logo da Empresa */}
          <div className="flex items-center gap-3 bg-gray-800/60 px-4 py-2 rounded-lg border border-emerald-500/30">
            <img src={logo} alt="IBA Santa Luzia Logo" className="h-10 w-auto object-contain" />
            <div className="text-right">
              <p className="font-bold text-emerald-400 text-sm">IBA Santa Luzia</p>
              <p className="text-xs text-gray-400">Controle Guarita</p>
            </div>
          </div>
        </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total de Viagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">
              {totalizadoresGerais.viagensTotal}
            </div>
            <p className="text-xs text-gray-500 mt-1">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Veículos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{ranking.length}</div>
            <p className="text-xs text-gray-500 mt-1">Veículos no ranking</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Tempo Algodoeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">
              {formatTime(mediasGerais.algodoeira)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Média geral ({mediasGerais.totalViagens} viagens)</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/60 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Tempo Viagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">
              {formatTime(mediasGerais.viagem)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Média geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Relatórios */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger
            value="ranking"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            🏁 Ranking
          </TabsTrigger>
          <TabsTrigger
            value="gestao-tempo"
            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            ⏱️ Gestão de Tempo
          </TabsTrigger>
        </TabsList>

        {/* === RANKING === */}
        <TabsContent value="ranking" className="space-y-4">
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Top Caminhões / Motoristas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-emerald-400 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-2">#</th>
                      <th className="text-left py-3 px-2">Motorista</th>
                      <th className="text-left py-3 px-2">Placa</th>
                      <th className="text-center py-3 px-2">Viagens</th>
                      <th className="text-center py-3 px-2">Tempo Algodoeira</th>
                      <th className="text-center py-3 px-2">Tempo Viagem</th>
                      <th className="text-center py-3 px-2">Tempo Total</th>
                      <th className="text-center py-3 px-2">Última Viagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((r, i) => (
                      <tr
                        key={i}
                        onClick={() => handleRankingClick(r.placa, r.motorista)}
                        className={`border-b border-gray-800 hover:bg-emerald-900/30 text-gray-100 cursor-pointer transition-colors ${
                          i < 3 ? "bg-emerald-900/20" : ""
                        }`}
                      >
                        <td className="py-3 px-2">
                          {i === 0 && <span className="text-yellow-400 text-lg">🥇</span>}
                          {i === 1 && <span className="text-gray-300 text-lg">🥈</span>}
                          {i === 2 && <span className="text-orange-400 text-lg">🥉</span>}
                          {i > 2 && <span className="text-gray-400">{i + 1}</span>}
                        </td>
                        <td className="py-3 px-2 font-medium text-white">{r.motorista}</td>
                        <td className="py-3 px-2 text-cyan-400">{r.placa}</td>
                        <td className="text-center py-3 px-2 font-bold text-emerald-400">
                          {r.viagens}
                        </td>
                        <td className="text-center py-3 px-2 text-yellow-400">
                          {formatTime(r.media_algodoeira_min)}
                        </td>
                        <td className="text-center py-3 px-2 text-cyan-400">
                          {formatTime(r.media_viagem_min)}
                        </td>
                        <td className="text-center py-3 px-2 font-semibold text-white">
                          {formatTime(r.media_total_min)}
                        </td>
                        <td className="text-center py-3 px-2 text-white text-xs">
                          {new Date(r.ultima_viagem + "T00:00:00").toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === GESTÃO DE TEMPO === */}
        <TabsContent value="gestao-tempo" className="space-y-4">
          {/* Cards de Médias */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gray-900/60 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-yellow-400 flex items-center gap-2">
                  <Timer className="h-4 w-4" />
                  Tempo Médio Algodoeira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {gestaoTempo?.tempo_algodoeira 
                    ? formatTime(Math.round(gestaoTempo.tempo_algodoeira))
                    : "-"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/60 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-blue-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Tempo Médio Lavoura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  {gestaoTempo?.tempo_lavoura 
                    ? formatTime(Math.round(gestaoTempo.tempo_lavoura))
                    : "-"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ranking por Placa */}
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ranking por Placa (Hoje)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-emerald-400 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-2">Placa</th>
                      <th className="text-left py-3 px-2">Motorista</th>
                      <th className="text-center py-3 px-2">Viagens</th>
                      <th className="text-center py-3 px-2">🏭 T. Algodoeira</th>
                      <th className="text-center py-3 px-2">🚜 T. Lavoura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Agrupar cargas por placa
                      const porPlaca = gestaoTempoCargas?.reduce((acc, c) => {
                        if (!acc[c.placa]) {
                          acc[c.placa] = {
                            placa: c.placa,
                            motorista: c.motorista,
                            viagens: 0,
                            tempoAlgodoeira: 0,
                            tempoLavoura: 0,
                          };
                        }
                        acc[c.placa].viagens += 1;
                        acc[c.placa].tempoAlgodoeira += c.tempo_algodoeira || 0;
                        acc[c.placa].tempoLavoura += c.tempo_lavoura || 0;
                        return acc;
                      }, {} as Record<string, { placa: string; motorista: string; viagens: number; tempoAlgodoeira: number; tempoLavoura: number }>);

                      return Object.values(porPlaca || {})
                        .sort((a, b) => b.viagens - a.viagens)
                        .map((r, i) => (
                          <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 text-white">
                            <td className="py-3 px-2 font-semibold text-white">{r.placa}</td>
                            <td className="py-3 px-2 text-gray-100">{r.motorista}</td>
                            <td className="text-center py-3 px-2 text-blue-400 font-medium">{r.viagens}</td>
                            <td className="text-center py-3 px-2 text-yellow-400 font-medium">
                              {r.viagens > 0 ? formatTime(Math.round(r.tempoAlgodoeira / r.viagens)) : "-"}
                            </td>
                            <td className="text-center py-3 px-2 text-blue-400 font-medium">
                              {r.viagens > 0 ? formatTime(Math.round(r.tempoLavoura / r.viagens)) : "-"}
                            </td>
                          </tr>
                        ));
                    })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detalhamento Carga a Carga */}
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400">
                Detalhamento Carga a Carga - Hoje
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                {gestaoTempoCargas?.length || 0} cargas registradas
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-emerald-400 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-3 px-2">Placa</th>
                      <th className="text-left py-3 px-2">Motorista</th>
                      <th className="text-left py-3 px-2">Talhão</th>
                      <th className="text-center py-3 px-2">Viagem</th>
                      <th className="text-center py-3 px-2">Rolos</th>
                      <th className="text-center py-3 px-2">Entrada</th>
                      <th className="text-center py-3 px-2">Saída</th>
                      <th className="text-center py-3 px-2">🏭 T. Algod.</th>
                      <th className="text-center py-3 px-2">🚜 T. Lavoura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gestaoTempoCargas?.map((c, i) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50 text-white">
                        <td className="py-3 px-2 font-semibold text-white">{c.placa}</td>
                        <td className="py-3 px-2 text-gray-100">{c.motorista}</td>
                        <td className="py-3 px-2 text-yellow-400">{c.talhao || "-"}</td>
                        <td className="text-center py-3 px-2 text-cyan-400 font-medium">{c.viagem_num}</td>
                        <td className="text-center py-3 px-2 text-blue-400 font-medium">{c.qtd_rolos}</td>
                        <td className="text-center py-3 px-2 text-cyan-400">{c.hora_entrada}</td>
                        <td className="text-center py-3 px-2 text-orange-400">{c.hora_saida || "-"}</td>
                        <td className="text-center py-3 px-2 text-yellow-400 font-medium">
                          {c.tempo_algodoeira ? formatTime(c.tempo_algodoeira) : "-"}
                        </td>
                        <td className="text-center py-3 px-2 text-blue-400 font-medium">
                          {c.tempo_lavoura ? formatTime(c.tempo_lavoura) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Distribuição */}
          <Card className="bg-gray-900/40 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribuição de Tempos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gestaoTempoCargas?.map(c => ({
                  placa: c.placa,
                  algodoeira: c.tempo_algodoeira || 0,
                  lavoura: c.tempo_lavoura || 0,
                })) || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="placa" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                    labelStyle={{ color: '#10b981' }}
                  />
                  <Legend />
                  <Bar dataKey="algodoeira" fill="#facc15" name="Tempo Algodoeira (min)" />
                  <Bar dataKey="lavoura" fill="#3b82f6" name="Tempo Lavoura (min)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para detalhes do ranking */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-emerald-400">
              Histórico Completo - {rankingDetalhado?.[0]?.plate || ''} / {rankingDetalhado?.[0]?.driver || ''}
            </DialogTitle>
          </DialogHeader>
          
          {rankingDetalhado && (
            <div className="space-y-4">
              {/* Totalizadores */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gray-800/60 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Total de Viagens</p>
                      <p className="text-2xl font-bold text-emerald-400">{rankingDetalhado.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/60 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Total de Rolos</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {rankingDetalhado.reduce((sum, r) => sum + r.rolls, 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800/60 border-gray-700">
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Média Algodoeira</p>
                      <p className="text-2xl font-bold text-yellow-400">
                        {formatTime(
                          Math.round(
                            rankingDetalhado
                              .filter(r => r.tempo_algodoeira_min)
                              .reduce((sum, r) => sum + (r.tempo_algodoeira_min || 0), 0) /
                            rankingDetalhado.filter(r => r.tempo_algodoeira_min).length
                          )
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabela detalhada */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-emerald-400 border-b border-gray-700">
                    <tr>
                      <th className="text-left py-2 px-2">Data</th>
                      <th className="text-left py-2 px-2">Entrada</th>
                      <th className="text-left py-2 px-2">Saída</th>
                      <th className="text-left py-2 px-2">Fazenda</th>
                      <th className="text-left py-2 px-2">TH</th>
                      <th className="text-center py-2 px-2">Rolos</th>
                      <th className="text-center py-2 px-2">🏭 T. Algod.</th>
                      <th className="text-center py-2 px-2">🚜 T. Viagem</th>
                      <th className="text-left py-2 px-2">Observação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingDetalhado.map((r, i) => {
                      // Verificar se saída foi entre 11h-13h (almoço)
                      const isAlmoco = r.exit_time ? (() => {
                        const [hora] = r.exit_time.split(':').map(Number);
                        return hora >= 11 && hora < 13;
                      })() : false;
                      
                      // Verificar se tempo de viagem > 5h (parou puxe) OU tempo algodoeira > 5h
                      const isParouPuxe = (r.tempo_viagem_lavoura_min && r.tempo_viagem_lavoura_min > 300) ||
                                          (r.tempo_algodoeira_min && r.tempo_algodoeira_min > 300);
                      
                      return (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-2 px-2 text-gray-100">
                            {new Date(r.date + "T00:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2 px-2 text-cyan-400">{r.entry_time}</td>
                          <td className="py-2 px-2 text-orange-400">{r.exit_time || "-"}</td>
                          <td className="py-2 px-2 text-emerald-400">{r.farm}</td>
                          <td className="py-2 px-2 text-yellow-400">{r.talhao || "-"}</td>
                          <td className="text-center py-2 px-2 text-blue-400 font-medium">{r.rolls}</td>
                          <td className="text-center py-2 px-2 text-yellow-400 font-medium">
                            {r.tempo_algodoeira_min ? formatTime(r.tempo_algodoeira_min) : "-"}
                          </td>
                          <td className="text-center py-2 px-2 text-blue-400 font-medium">
                            {r.tempo_viagem_lavoura_min ? formatTime(r.tempo_viagem_lavoura_min) : "N/A"}
                          </td>
                          <td className="py-2 px-2 text-gray-400 italic text-xs">
                            {isParouPuxe ? "⏸️ Parou Puxe" : isAlmoco ? "🍽️ Almoço" : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
};

export default RelatorioGestaoPuxe;
