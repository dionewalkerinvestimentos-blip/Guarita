import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './use-toast'

export interface RainAlert {
  id: string
  is_raining: boolean
  started_at?: string
  stopped_at?: string
  updated_at?: string
  updated_by?: string
  created_at?: string
}

// Hook para gerenciar alerta de chuva em tempo real
export const useRainAlert = () => {
  const [isRaining, setIsRaining] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const RAIN_ALERT_ID = '00000000-0000-0000-0000-000000000001'

  const fetchRainAlert = useCallback(async () => {
    try {
      console.log('🔍 Buscando estado inicial da chuva...')
      const { data, error } = await supabase
        .from('rain_alert')
        .select('*')
        .eq('id', RAIN_ALERT_ID)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar:', error)
        throw error
      }
      console.log('📥 Estado inicial recebido:', data?.is_raining)
      console.log('📦 OBJETO COMPLETO:', data)
      setIsRaining(data?.is_raining || false)
    } catch (error) {
      console.error('Erro ao buscar alerta de chuva:', error)
      setIsRaining(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleRainAlert = async (raining: boolean) => {
    try {
      console.log('🌧️ Tentando atualizar alerta de chuva para:', raining);
      console.log('🔑 ID do registro:', RAIN_ALERT_ID);
      
      const updateData = {
        is_raining: raining,
        updated_at: new Date().toISOString(),
        ...(raining ? { started_at: new Date().toISOString() } : { stopped_at: new Date().toISOString() })
      }
      
      console.log('📝 Dados para atualizar:', updateData);

      const { data, error, count, status, statusText } = await supabase
        .from('rain_alert')
        .update(updateData)
        .eq('id', RAIN_ALERT_ID)
        .select()

      console.log('📊 Resposta completa do UPDATE:');
      console.log('  - Status:', status, statusText);
      console.log('  - Count:', count);
      console.log('  - Data:', data);
      console.log('  - Error:', error);

      if (error) {
        console.error('❌ Erro no update do Supabase:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ NENHUMA LINHA FOI ATUALIZADA! Registro não encontrado ou sem permissão.');
        throw new Error('Nenhuma linha atualizada - registro não existe ou sem permissão RLS');
      }

      console.log('✅ Alerta de chuva atualizado com sucesso!');
      console.log('✅ Registro atualizado:', data[0]);
      setIsRaining(raining)
      toast({
        title: raining ? '🌧️ Alerta de Chuva Ativado' : '☀️ Alerta de Chuva Desativado',
        description: raining ? 'Animação de chuva ativa no Modo TV' : 'Animação de chuva pausada',
      })
    } catch (error) {
      console.error('Erro ao atualizar alerta de chuva:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o alerta de chuva.',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchRainAlert()

    console.log('🔌 Iniciando subscription real-time para rain_alert...')
    
    // Subscription para mudanças em tempo real
    const channel = supabase
      .channel('rain_alert_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rain_alert' }, (payload: any) => {
        console.log('🔔 Realtime update recebido:', payload)
        console.log('🔔 Evento:', payload.eventType)
        console.log('🔔 Novo valor is_raining:', payload.new?.is_raining)
        if (payload.new?.is_raining !== undefined) {
          setIsRaining(payload.new.is_raining)
        }
      })
      .subscribe((status) => {
        console.log('📡 Status da subscription:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscription ativa e pronta!')
          // Refetch após subscription estar ativa para pegar qualquer mudança perdida
          setTimeout(() => {
            console.log('🔄 Verificando estado após subscription...')
            fetchRainAlert()
          }, 1000)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription real-time!')
        }
      })

    // Polling de backup: verifica estado a cada 5 segundos
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling: Verificando estado da chuva...')
      fetchRainAlert()
    }, 5000)

    return () => {
      console.log('🔌 Desconectando subscription...')
      channel.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [fetchRainAlert])

  return {
    isRaining,
    loading,
    toggleRainAlert,
    refetch: fetchRainAlert
  }
}
