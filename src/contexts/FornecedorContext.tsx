
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Fornecedor, FornecedorFormData } from '@/types/fornecedor';
import { cleanDocument } from '@/utils/formatters';
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

  // Carregar fornecedores do localStorage na inicialização
  useEffect(() => {
    const loadFornecedores = () => {
      try {
        const stored = localStorage.getItem('fornecedores');
        if (stored) {
          setFornecedores(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Erro ao carregar fornecedores:', err);
      }
    };

    loadFornecedores();
  }, []);

  const addFornecedor = useCallback(async (fornecedorData: FornecedorFormData) => {
    try {
      const novoFornecedor: Fornecedor = {
        id: crypto.randomUUID(),
        nome: fornecedorData.nome,
        cpfCnpj: fornecedorData.cpfCnpj,
        email: fornecedorData.email || '',
        telefone: fornecedorData.telefone || '',
        endereco: fornecedorData.endereco || '',
        tipo: fornecedorData.tipo || 'Fornecedor',
        createdAt: new Date().toISOString()
      };
      
      setFornecedores(prev => {
        const updated = [novoFornecedor, ...prev];
        localStorage.setItem('fornecedores', JSON.stringify(updated));
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
      setFornecedores(prev => {
        const updated = prev.map(fornecedor => 
          fornecedor.id === id 
            ? { ...fornecedor, ...fornecedorData }
            : fornecedor
        );
        localStorage.setItem('fornecedores', JSON.stringify(updated));
        return updated;
      });
      
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
      setFornecedores(prev => {
        const updated = prev.filter(fornecedor => fornecedor.id !== id);
        localStorage.setItem('fornecedores', JSON.stringify(updated));
        return updated;
      });
      
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
