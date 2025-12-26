import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjnsbrkspgzioafvqfhe.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqbnNicmtzcGd6aW9hZnZxZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NDE0MjMsImV4cCI6MjA0NjMxNzQyM30.Cw8bs3aTBe6Qmr-0flDIR-dnx89C1LC0rJR_YCjIKP0'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos TypeScript para o banco
export interface Vehicle {
  id: string
  type: string
  date: string
  entry_time?: string // Agora opcional para suportar saída externa
  exit_time?: string
  plate: string
  driver: string
  vehicle_type: string
  company?: string // Empresa/Local de origem
  purpose?: string
  producer_id?: string
  producer_name?: string
  observations?: string
  internal_time_minutes?: number
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface Equipment {
  id: string
  date: string
  photo_url?: string
  name: string
  type: string
  destination: string
  purpose: string
  donation_to?: string
  authorized_by: string
  withdrawn_by: string
  status: 'pending' | 'completed'
  return_date?: string
  return_notes?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface CottonPull {
  id: string
  date: string
  entry_time: string
  exit_time?: string
  producer: string
  farm: string
  talhao?: string
  plate: string
  driver: string
  rolls: number
  observations?: string
  parada_puxe?: boolean
  hora_parada_puxe?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface RainRecord {
  id: string
  date: string
  time?: string // Campo antigo, manter para compatibilidade
  start_time?: string
  end_time?: string
  millimeters: number
  location?: string
  notes?: string
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface Producer {
  id: string
  name: string
  code?: string
  description?: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface LoadingRecord {
  id: string
  date: string
  time: string
  product: string
  harvest_year: string
  truck_type: string
  is_sider: boolean
  carrier: string
  destination: string
  plate: string
  driver: string
  client?: string
  entry_date?: string
  entry_time?: string
  exit_date?: string
  exit_time?: string
  bales: number
  weight: number
  notes?: string
  invoice_number?: string
  acompanhante?: boolean
  status?: 'fila' | 'carregando' | 'carregado' | 'concluido' // Novo campo para status do carregamento
  loaded_at?: string // Timestamp de quando foi carregado
  created_by?: string
  created_at?: string
  updated_at?: string
}

export interface SavedValue {
  id: string
  category: string
  value: string
  is_active: boolean
  usage_count: number
  created_at?: string
  updated_at?: string
}

export interface MaterialReceipt {
  id: string
  date: string
  entry_time: string
  exit_time?: string
  material_type: string // Areia, Cascalho, Cavaco, Pedra Brita, Pó de Pedra, Álcool
  plate: string
  driver: string
  supplier?: string // Fornecedor do material
  net_weight: number // Obrigatório agora
  volume_m3?: number
  volume_m2?: number
  volume_liters?: number
  unit_type: 'KG' | 'M3' | 'M2' | 'LITROS'
  observations?: string
  created_at?: string
  updated_at?: string
  created_by?: string
}

export interface PuxeViagem {
  id: string
  placa: string
  motorista: string
  fazenda_origem: string
  data: string
  hora_chegada: string
  hora_saida?: string
  tempo_unidade_min?: number
  tempo_lavoura_min?: number
  total_viagem_min?: number
  observacao?: string
  created_at?: string
  updated_at?: string
}

export interface RainAlert {
  id: string
  is_raining: boolean
  started_at?: string
  stopped_at?: string
  updated_at?: string
  updated_by?: string
  created_at?: string
}
