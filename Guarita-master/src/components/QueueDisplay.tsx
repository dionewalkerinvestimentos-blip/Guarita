import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, ArrowRight } from "lucide-react";
import type { Vehicle } from "@/lib/supabase";

interface QueueDisplayProps {
  vehicles: Vehicle[];
  loading?: boolean;
}

const QueueDisplay = ({ vehicles, loading }: QueueDisplayProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Carregando fila...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Separar por produto e ordenar por horário de entrada
  const filaPluma = vehicles
    .filter(v => v.purpose?.toLowerCase().includes('pluma') && !v.exit_time)
    .sort((a, b) => a.entry_time.localeCompare(b.entry_time));

  const filaCaroco = vehicles
    .filter(v => v.purpose?.toLowerCase().includes('caroço') && !v.exit_time)
    .sort((a, b) => a.entry_time.localeCompare(b.entry_time));

  const renderQueue = (queue: Vehicle[], produto: string, color: string) => {
    if (queue.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className={`font-semibold ${color}`}>{produto}</h4>
          <Badge variant="outline">{queue.length} na fila</Badge>
        </div>
        <div className="space-y-2">
          {queue.map((vehicle, index) => (
            <div
              key={vehicle.id}
              className={`p-3 rounded-lg border ${
                index === 0 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {index === 0 && (
                    <Badge className="bg-green-600">
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Próximo da vez
                    </Badge>
                  )}
                  <span className="font-medium">{vehicle.plate}</span>
                  <span className="text-sm text-muted-foreground">
                    {vehicle.driver}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-mono">
                    {vehicle.entry_time}
                  </span>
                  {index === 0 && (
                    <Badge variant="secondary" className="ml-2">
                      Agora
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mt-1">
                <span className="text-xs text-muted-foreground">
                  {vehicle.vehicle_type} • {vehicle.purpose}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (filaPluma.length === 0 && filaCaroco.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Fila de Carregamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhum veículo na fila</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Fila de Carregamento
          <Badge variant="outline">
            {filaPluma.length + filaCaroco.length} total
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderQueue(filaPluma, "Pluma", "text-blue-600")}
        {renderQueue(filaCaroco, "Caroço", "text-orange-600")}
      </CardContent>
    </Card>
  );
};

export default QueueDisplay;