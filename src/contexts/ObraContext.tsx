import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Obra {
  id: string;
  codigo: string;
  nome: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  ativa?: boolean;
  created_at: string;
  updated_at?: string;
}

interface ObraContextType {
  obras: Obra[];
  loading: boolean;
  addObra: (obra: Omit<Obra, 'id' | 'codigo' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateObra: (id: string, changes: Partial<Omit<Obra, 'id' | 'codigo' | 'created_at' | 'updated_at'>>) => Promise<void>;
  deleteObra: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ObraContext = createContext<ObraContextType | undefined>(undefined);

export function ObraProvider({ children }: { children: React.ReactNode }) {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadObras = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando obras do banco...');
      
      const { data, error } = await supabase
        .from('obras')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('📊 Obras recebidas:', { data, error, count: data?.length });
      
      if (error) {
        console.error('❌ Erro ao carregar obras:', error);
        throw error;
      }
      
      console.log('✅ Obras carregadas:', data?.length, 'itens');
      setObras(data || []);
    } catch (error) {
      console.error('❌ Erro crítico ao carregar obras:', error);
      toast({ title: 'Erro', description: 'Não foi possível carregar as obras.', variant: 'destructive' });
      setObras([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const addObra = useCallback(async (
    obra: Omit<Obra, 'id' | 'codigo' | 'created_at' | 'updated_at'>
  ) => {
    try {
      setLoading(true);
      console.log('🔵 Tentando adicionar obra:', obra);
      
      const { data, error } = await supabase
        .from('obras')
        .insert([{
          codigo: (obra as any).codigo || `OBRA-${Date.now()}`,
          nome: obra.nome,
          endereco: obra.endereco,
          cidade: (obra as any).cidade,
          estado: (obra as any).estado,
          ativa: (obra as any).ativa ?? true
        }])
        .select()
        .single();

      console.log('📊 Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro ao inserir obra:', error);
        throw error;
      }
      
      console.log('✅ Obra inserida com sucesso:', data);
      setObras(prev => {
        const updated = [data, ...prev];
        console.log('📋 Lista atualizada de obras:', updated.length, 'itens');
        return updated;
      });
      toast({ title: 'Obra cadastrada', description: 'A obra foi cadastrada com sucesso.' });
    } catch (error) {
      console.error('Erro ao cadastrar obra:', error);
      toast({ title: 'Erro', description: 'Não foi possível cadastrar a obra.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateObra = useCallback(async (
    id: string,
    changes: Partial<Omit<Obra, 'id' | 'codigo' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('obras')
        .update(changes)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setObras(prev => prev.map(obra => obra.id === id ? data : obra));
      toast({ title: 'Obra atualizada', description: 'As informações da obra foram salvas.' });
    } catch (error) {
      console.error('Erro ao atualizar obra:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a obra.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteObra = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('obras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setObras(prev => prev.filter(obra => obra.id !== id));
      toast({ title: 'Obra excluída', description: 'A obra foi removida com sucesso.' });
    } catch (error) {
      console.error('Erro ao excluir obra:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir a obra.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadObras();
  }, [loadObras]);

  const value = useMemo(() => ({ obras, loading, addObra, updateObra, deleteObra, refresh: loadObras }), [obras, loading, addObra, updateObra, deleteObra, loadObras]);

  return <ObraContext.Provider value={value}>{children}</ObraContext.Provider>;
}

export function useObras() {
  const ctx = useContext(ObraContext);
  if (!ctx) throw new Error('useObras must be used within an ObraProvider');
  return ctx;
}
