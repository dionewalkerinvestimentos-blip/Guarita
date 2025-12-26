// Extensão do hook use-supabase para MaterialReceipts
import { useState, useEffect, useCallback } from 'react'
import { supabase, MaterialReceipt } from '@/lib/supabase'
import { useToast } from './use-toast'

// Hook para Materiais Recebidos
export const useMaterialReceipts = () => {
  const [records, setRecords] = useState<MaterialReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('material_receipts')
        .select('*')
        .order('date', { ascending: false })
        .order('entry_time', { ascending: false })

      if (error) {
        // Se a tabela não existe (código 400 ou 42P01), não mostra erro ao usuário
        if (error.message?.includes('does not exist') || 
            error.code === '42P01' || 
            error.message?.includes('relation') ||
            error.message?.includes('400')) {
          console.log('Tabela material_receipts ainda não criada no Supabase')
          setRecords([])
          return
        }
        throw error
      }
      setRecords(data || [])
    } catch (error) {
      console.error('Erro ao buscar materiais recebidos:', error)
      // Só mostra toast se não for erro de tabela inexistente
      setRecords([])
    } finally {
      setLoading(false)
    }
  }, [])

  const addRecord = async (recordData: Omit<MaterialReceipt, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Remove campos undefined para evitar problemas no INSERT
      const cleanData = Object.fromEntries(
        Object.entries(recordData).filter(([_, value]) => value !== undefined)
      )
      
      const { data, error } = await supabase
        .from('material_receipts')
        .insert([cleanData])
        .select()
        .single()

      if (error) {
        if (error.message?.includes('does not exist') || 
            error.code === '42P01' || 
            error.message?.includes('relation') ||
            error.message?.includes('400')) {
          toast({
            title: "🚨 Erro de Permissão",
            description: "Execute: ALTER TABLE material_receipts DISABLE ROW LEVEL SECURITY; no Supabase SQL Editor",
            variant: "destructive"
          })
          return null
        }
        throw error
      }
      
      setRecords(prev => [data, ...prev])
      toast({
        title: "Material registrado!",
        description: `Recebimento de ${recordData.material_type} registrado com sucesso.`,
      })
      
      return data
    } catch (error) {
      console.error('Erro ao adicionar material:', error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar o material.",
        variant: "destructive"
      })
      throw error
    }
  }

  const updateRecord = async (id: string, updateData: Partial<MaterialReceipt>) => {
    try {
      const { data, error } = await supabase
        .from('material_receipts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      setRecords(prev => prev.map(record => record.id === id ? data : record))
      toast({
        title: "Material atualizado!",
        description: "Informações atualizadas com sucesso.",
      })

      return data
    } catch (error) {
      console.error('Erro ao atualizar material:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o material.",
        variant: "destructive"
      })
      throw error
    }
  }

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('material_receipts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setRecords(prev => prev.filter(record => record.id !== id))
      toast({
        title: "Material removido!",
        description: "Registro removido com sucesso.",
      })
    } catch (error) {
      console.error('Erro ao remover material:', error)
      toast({
        title: "Erro",
        description: "Não foi possível remover o material.",
        variant: "destructive"
      })
      throw error
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  return {
    records,
    loading,
    addRecord,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords
  }
}