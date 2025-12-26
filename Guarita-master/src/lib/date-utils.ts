/**
 * Utilitários para lidar com datas no timezone local do Brasil
 */

/**
 * Retorna a data de hoje no formato YYYY-MM-DD no timezone local
 * Evita problemas com UTC que pode retornar o dia anterior
 */
export function getTodayLocalDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma string de data do input para formato YYYY-MM-DD garantindo timezone local
 * Quando o usuário seleciona uma data no input, precisamos garantir que ela seja
 * salva exatamente como selecionada, sem conversão UTC que pode mudar o dia
 */
export function normalizeLocalDate(dateString: string): string {
  if (!dateString) return getTodayLocalDate();
  
  // O input date já retorna no formato YYYY-MM-DD
  // Apenas retornamos o valor exatamente como veio, sem fazer parse
  // Isso evita qualquer conversão de timezone
  return dateString;
}

/**
 * Converte uma data para o formato YYYY-MM-DD no timezone local
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formata uma string de data YYYY-MM-DD para exibição DD/MM/YYYY
 * SEM fazer conversão de timezone - usa a data exatamente como está no banco
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return '';
  
  // Se já está no formato YYYY-MM-DD, apenas formata para DD/MM/YYYY
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  
  return dateString;
}

/**
 * Converte uma string ISO (e.g., de loaded_at ou created_at) ou uma string DATE (YYYY-MM-DD)
 * para uma string de data local YYYY-MM-DD.
 * Isso é crucial para comparar datas de forma consistente com o 'hoje' local.
 */
export function convertIsoToLocalDateString(dateString: string | undefined | null): string | null {
  if (!dateString) return null;

  // Se a string já está no formato YYYY-MM-DD (vindo de uma coluna DATE do DB),
  // tratamos ela diretamente como a data local.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Caso contrário, assumimos que é uma string ISO completa (vindo de TIMESTAMP WITH TIME ZONE)
  try {
    const date = new Date(dateString);
    // Usamos toLocalDateString para formatar o objeto Date para YYYY-MM-DD local
    return toLocalDateString(date);
  } catch (e) {
    console.error("Erro ao converter string de data para data local:", dateString, e);
    return null;
  }
}