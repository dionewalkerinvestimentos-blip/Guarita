/**
 * Calcula a diferença de tempo entre entrada e saída, considerando mudanças de dia
 * @param entryDate Data de entrada (YYYY-MM-DD)
 * @param entryTime Hora de entrada (HH:MM:SS)
 * @param exitDate Data de saída (YYYY-MM-DD)
 * @param exitTime Hora de saída (HH:MM:SS)
 * @returns String formatada como "Xh Ymin" ou "-" se inválido
 */
export function calculateLoadingTime(
  entryDate: string | null,
  entryTime: string | null,
  exitDate: string | null,
  exitTime: string | null
): string {
  if (!entryDate || !entryTime || !exitDate || !exitTime) {
    return '-';
  }

  try {
    // Criar timestamps completos com data + hora
    const entryTimestamp = new Date(`${entryDate}T${entryTime}`);
    const exitTimestamp = new Date(`${exitDate}T${exitTime}`);

    // Calcular diferença em milissegundos
    const diffMs = exitTimestamp.getTime() - entryTimestamp.getTime();

    // Se negativo, houve erro (saída antes da entrada)
    if (diffMs < 0) {
      return 'Erro';
    }

    // Converter para minutos
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}min`;
  } catch (error) {
    console.error('Erro ao calcular tempo de carregamento:', error);
    return '-';
  }
}
