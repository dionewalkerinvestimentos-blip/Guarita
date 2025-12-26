import { useCallback, useEffect, useState } from 'react'
import { supabase, AerationEvent } from '@/lib/supabase'

export const useAeration = () => {
  const [events, setEvents] = useState<AerationEvent[]>([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('aeration_events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEvents(data || [])
    } catch (err) {
      console.error('Erro ao buscar eventos de aeração:', err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  const startEvent = async (barracao: number, motor_index: number, created_by?: string, status?: string) => {
    const record = {
      barracao,
      motor_index,
      start_at: new Date().toISOString(),
      status: status || 'on',
      created_by
    }
    const { data, error } = await supabase.from('aeration_events').insert([record]).select().single()
    if (error) throw error
    setEvents(prev => [data, ...prev])
    return data as AerationEvent
  }

  const stopEvent = async (id: string, endAt?: string) => {
    const updates: any = { status: 'off', end_at: endAt || new Date().toISOString() }
    const { data, error } = await supabase.from('aeration_events').update(updates).eq('id', id).select().single()
    if (error) throw error
    setEvents(prev => prev.map(e => e.id === id ? data : e))
    return data as AerationEvent
  }

  const updateEvent = async (id: string, updates: Partial<AerationEvent>) => {
    const { data, error } = await supabase.from('aeration_events').update(updates).eq('id', id).select().single()
    if (error) throw error
    setEvents(prev => prev.map(e => e.id === id ? data : e))
    return data as AerationEvent
  }

  const deleteEvent = async (id: string) => {
    const { data, error } = await supabase.from('aeration_events').delete().eq('id', id).select().single()
    if (error) throw error
    setEvents(prev => prev.filter(e => e.id !== id))
    return data as AerationEvent
  }

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  return {
    events,
    loading,
    fetchEvents,
    startEvent,
    stopEvent,
    updateEvent,
    deleteEvent,
  }
}
