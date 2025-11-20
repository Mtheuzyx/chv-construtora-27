
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Fornecedor, FornecedorFormData } from '@/types/fornecedor';
import { cleanDocument } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    const loadFornecedores = async () => {
      try {
        console.log('🔄 Carregando fornecedores do banco...');
        
        const { data, error } = await supabase
          .from('fornecedores')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log('📊 Dados recebidos do Supabase:', { data, error, count: data?.length });
        
        if (error) {
          console.error('❌ Erro ao carregar fornecedores:', error);
          throw error;
        }
        
        const mapped = (data || []).map(f => ({
          id: f.id,
          nome: f.nome,
          cpfCnpj: f.cpf_cnpj,
          email: f.email || '',
          telefone: f.telefone || '',
          endereco: f.endereco || '',
          tipo: (f.tipo as 'Cliente' | 'Fornecedor') || 'Fornecedor',
          createdAt: f.created_at || new Date().toISOString()
        }));
        
        console.log('✅ Fornecedores carregados:', mapped.length, 'itens');
        setFornecedores(mapped);
      } catch (err) {
        console.error('❌ Erro crítico ao carregar fornecedores:', err);
      }
    };

    loadFornecedores();
  }, []);

  const addFornecedor = useCallback(async (fornecedorData: FornecedorFormData) => {
    try {
      console.log('🔵 Tentando adicionar fornecedor:', fornecedorData);
      
      const { data, error } = await supabase
        .from('fornecedores')
        .insert([{
          nome: fornecedorData.nome,
          cpf_cnpj: fornecedorData.cpfCnpj,
          email: fornecedorData.email || null,
          telefone: fornecedorData.telefone || null,
          endereco: fornecedorData.endereco || null,
          tipo: fornecedorData.tipo || 'Fornecedor'
        }])
        .select()
        .single();

      console.log('📊 Resposta do Supabase:', { data, error });

      if (error) {
        console.error('❌ Erro ao inserir fornecedor:', error);
        throw error;
      }
      
      console.log('✅ Fornecedor inserido com sucesso:', data);

      const novoFornecedor: Fornecedor = {
        id: data.id,
        nome: data.nome,
        cpfCnpj: data.cpf_cnpj,
        email: data.email || '',
        telefone: data.telefone || '',
        endereco: data.endereco || '',
        tipo: (data.tipo as 'Cliente' | 'Fornecedor') || 'Fornecedor',
        createdAt: data.created_at || new Date().toISOString()
      };
      
      setFornecedores(prev => {
        const updated = [novoFornecedor, ...prev];
        console.log('📋 Lista atualizada de fornecedores:', updated.length, 'itens');
        return updated;
      });
      
      toast({
        title: "Sucesso",
        description: "Fornecedor cadastrado com sucesso",
      });
    } catch (err) {
      console.error('Erro ao adicionar fornecedor:', err);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o fornecedor",
        variant: "destructive"
      });
    }
  }, [toast]);

  const editFornecedor = useCallback(async (id: string, fornecedorData: FornecedorFormData) => {
    try {
      const { data, error } = await supabase
        .from('fornecedores')
        .update({
          nome: fornecedorData.nome,
          cpf_cnpj: fornecedorData.cpfCnpj,
          email: fornecedorData.email || null,
          telefone: fornecedorData.telefone || null,
          endereco: fornecedorData.endereco || null,
          tipo: fornecedorData.tipo || 'Fornecedor'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      const fornecedorAtualizado: Fornecedor = {
        id: data.id,
        nome: data.nome,
        cpfCnpj: data.cpf_cnpj,
        email: data.email || '',
        telefone: data.telefone || '',
        endereco: data.endereco || '',
        tipo: (data.tipo as 'Cliente' | 'Fornecedor') || 'Fornecedor',
        createdAt: data.created_at || new Date().toISOString()
      };
      
      setFornecedores(prev => prev.map(f => f.id === id ? fornecedorAtualizado : f));
      
      toast({
        title: "Sucesso",
        description: "Fornecedor atualizado com sucesso",
      });
    } catch (err) {
      console.error('Erro ao editar fornecedor:', err);
      toast({
        title: "Erro",
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

      if (error) throw error;
      
      setFornecedores(prev => prev.filter(fornecedor => fornecedor.id !== id));
      
      toast({
        title: "Sucesso",
        description: "Fornecedor excluído com sucesso",
      });
    } catch (err) {
      console.error('Erro ao deletar fornecedor:', err);
      toast({
        title: "Erro",
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
