
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Fornecedor, FornecedorFormData } from '@/types/fornecedor';
import { cleanDocument } from '@/utils/formatters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FornecedorContextType {
  fornecedores: Fornecedor[];
  addFornecedor: (fornecedorData: FornecedorFormData) => Promise<void>;
  editFornecedor: (id: string, fornecedorData: FornecedorFormData) => Promise<void>;
  deleteFornecedor: (id: string) => Promise<void>;
  searchFornecedor: (termo: string) => Fornecedor[];
}

const FornecedorContext = createContext<FornecedorContextType | undefined>(undefined);

export function FornecedorProvider({ children }: { children: React.ReactNode }) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const { toast } = useToast();

  // Carregar fornecedores do Supabase na inicialização
  useEffect(() => {
    const loadFornecedores = async () => {
      try {
        const { data, error } = await supabase
          .from('fornecedores')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar fornecedores:', error);
          toast({
            title: "Erro ao carregar dados",
            description: "Não foi possível carregar os fornecedores",
            variant: "destructive"
          });
          return;
        }

        if (data) {
          const fornecedoresFormatados = data.map((item: any) => ({
            id: item.id,
            nome: item.nome,
            cpfCnpj: item.cpf_cnpj,
            email: item.email || '',
            telefone: item.telefone || '',
            endereco: item.endereco || '',
            tipo: 'Fornecedor' as const,
            createdAt: item.created_at
          }));
          setFornecedores(fornecedoresFormatados);
        }
      } catch (err) {
        console.error('Erro inesperado ao carregar fornecedores:', err);
      }
    };

    loadFornecedores();
  }, [toast]);

  const addFornecedor = useCallback(async (fornecedorData: FornecedorFormData) => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .insert([{
          nome: fornecedorData.nome,
          cpf_cnpj: fornecedorData.cpfCnpj,
          email: fornecedorData.email || null,
          telefone: fornecedorData.telefone || null,
          endereco: fornecedorData.endereco || null
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar fornecedor:', error);
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o fornecedor",
          variant: "destructive"
        });
        return;
      }

      if (data) {
        const novoFornecedor: Fornecedor = {
          id: data.id,
          nome: data.nome,
          cpfCnpj: data.cpf_cnpj,
          email: data.email || '',
          telefone: data.telefone || '',
          endereco: data.endereco || '',
          tipo: 'Fornecedor',
          createdAt: (data as any).created_at
        };
        setFornecedores(prev => [novoFornecedor, ...prev]);
      }
    } catch (err) {
      console.error('Erro inesperado ao adicionar fornecedor:', err);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao salvar o fornecedor",
        variant: "destructive"
      });
    }
  }, [toast]);

  const editFornecedor = useCallback(async (id: string, fornecedorData: FornecedorFormData) => {
    try {
      const { error } = await supabase
        .from('fornecedores')
        .update({
          nome: fornecedorData.nome,
          cpf_cnpj: fornecedorData.cpfCnpj,
          email: fornecedorData.email || null,
          telefone: fornecedorData.telefone || null,
          endereco: fornecedorData.endereco || null
        })
        .eq('id', id);

      if (error) {
        console.error('Erro ao editar fornecedor:', error);
        toast({
          title: "Erro ao editar",
          description: "Não foi possível editar o fornecedor",
          variant: "destructive"
        });
        return;
      }

      setFornecedores(prev => 
        prev.map(fornecedor => 
          fornecedor.id === id 
            ? { ...fornecedor, ...fornecedorData }
            : fornecedor
        )
      );
    } catch (err) {
      console.error('Erro inesperado ao editar fornecedor:', err);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao editar o fornecedor",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteFornecedor = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar fornecedor:', error);
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir o fornecedor",
          variant: "destructive"
        });
        return;
      }

      setFornecedores(prev => prev.filter(fornecedor => fornecedor.id !== id));
    } catch (err) {
      console.error('Erro inesperado ao deletar fornecedor:', err);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao excluir o fornecedor",
        variant: "destructive"
      });
    }
  }, [toast]);

  const searchFornecedor = useCallback((termo: string): Fornecedor[] => {
    if (!termo || termo.trim().length === 0) return fornecedores;
    
    const termoLower = termo.toLowerCase().trim();
    const termoLimpo = cleanDocument(termo);
    
    return fornecedores.filter(f => {
      const nomeMatch = f.nome.toLowerCase().includes(termoLower);
      const documentoMatch = f.cpfCnpj.toLowerCase().includes(termoLower) || 
                            cleanDocument(f.cpfCnpj).includes(termoLimpo);
      const emailMatch = f.email.toLowerCase().includes(termoLower);
      const telefoneMatch = f.telefone && (
        f.telefone.includes(termo) || 
        f.telefone.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
      );
      
      return nomeMatch || documentoMatch || emailMatch || telefoneMatch;
    });
  }, [fornecedores]);

  const contextValue = useMemo(() => ({
    fornecedores,
    addFornecedor,
    editFornecedor,
    deleteFornecedor,
    searchFornecedor
  }), [fornecedores, addFornecedor, editFornecedor, deleteFornecedor, searchFornecedor]);

  return (
    <FornecedorContext.Provider value={contextValue}>
      {children}
    </FornecedorContext.Provider>
  );
}

export function useFornecedores() {
  const context = useContext(FornecedorContext);
  if (context === undefined) {
    throw new Error('useFornecedores must be used within a FornecedorProvider');
  }
  return context;
}
