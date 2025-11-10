import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
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
      const stored = localStorage.getItem('obras');
      if (stored) {
        setObras(JSON.parse(stored));
      } else {
        setObras([]);
      }
    } catch (error) {
      console.warn('Erro ao carregar obras:', error);
      setObras([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addObra = useCallback(async (
    obra: Omit<Obra, 'id' | 'codigo' | 'created_at' | 'updated_at'>
  ) => {
    try {
      setLoading(true);
      const novaObra: Obra = {
        id: crypto.randomUUID(),
        codigo: (obra as any).codigo || `OBRA-${Date.now()}`,
        nome: obra.nome,
        endereco: obra.endereco,
        cidade: (obra as any).cidade,
        estado: (obra as any).estado,
        ativa: (obra as any).ativa ?? true,
        created_at: new Date().toISOString()
      };

      setObras(prev => {
        const updated = [novaObra, ...prev];
        localStorage.setItem('obras', JSON.stringify(updated));
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
      setObras(prev => {
        const updated = prev.map(obra => 
          obra.id === id 
            ? { ...obra, ...changes, updated_at: new Date().toISOString() }
            : obra
        );
        localStorage.setItem('obras', JSON.stringify(updated));
        return updated;
      });
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
      setObras(prev => {
        const updated = prev.filter(obra => obra.id !== id);
        localStorage.setItem('obras', JSON.stringify(updated));
        return updated;
      });
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
