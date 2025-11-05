import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      const { data, error } = await (supabase as any)
        .from('obras')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Tabela obras não encontrada ou sem acesso:', error);
        setObras([]);
        setLoading(false);
        return;
      }

      setObras((data || []) as Obra[]);
    } catch (error) {
      console.warn('Erro ao carregar obras:', error);
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
      const { error } = await (supabase as any)
        .from('obras')
        .insert({
          nome: obra.nome,
          codigo: (obra as any).codigo || `OBRA-${Date.now()}`,
          endereco: obra.endereco,
          cidade: (obra as any).cidade,
          estado: (obra as any).estado,
          ativa: (obra as any).ativa ?? true,
        });

      if (error) {
        console.error('Erro ao cadastrar obra:', error);
        toast({ title: 'Erro', description: 'Tabela obras não está disponível no banco de dados.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      toast({ title: 'Obra cadastrada', description: 'A obra foi cadastrada com sucesso.' });
      await loadObras();
    } catch (error) {
      console.error('Erro ao cadastrar obra:', error);
      toast({ title: 'Erro', description: 'Não foi possível cadastrar a obra.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [loadObras, toast]);

  const updateObra = useCallback(async (
    id: string,
    changes: Partial<Omit<Obra, 'id' | 'codigo' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('obras')
        .update(changes)
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Obra atualizada', description: 'As informações da obra foram salvas.' });
      await loadObras();
    } catch (error) {
      console.error('Erro ao atualizar obra:', error);
      toast({ title: 'Erro', description: 'Não foi possível atualizar a obra.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [loadObras, toast]);

  const deleteObra = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const { error } = await (supabase as any)
        .from('obras')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Obra excluída', description: 'A obra foi removida com sucesso.' });
      await loadObras();
    } catch (error) {
      console.error('Erro ao excluir obra:', error);
      toast({ title: 'Erro', description: 'Não foi possível excluir a obra.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [loadObras, toast]);

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
