
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Fornecedor, FornecedorFormData } from '@/types/fornecedor';
import { cleanDocument } from '@/utils/formatters';

interface FornecedorContextType {
  fornecedores: Fornecedor[];
  addFornecedor: (fornecedorData: FornecedorFormData) => void;
  editFornecedor: (id: string, fornecedorData: FornecedorFormData) => void;
  deleteFornecedor: (id: string) => void;
  searchFornecedor: (termo: string) => Fornecedor[];
}

const FornecedorContext = createContext<FornecedorContextType | undefined>(undefined);

export function FornecedorProvider({ children }: { children: React.ReactNode }) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const addFornecedor = useCallback((fornecedorData: FornecedorFormData) => {
    const novoFornecedor: Fornecedor = {
      id: crypto.randomUUID(),
      ...fornecedorData,
      createdAt: new Date().toISOString()
    };

    setFornecedores(prev => [...prev, novoFornecedor]);
  }, []);

  const editFornecedor = useCallback((id: string, fornecedorData: FornecedorFormData) => {
    setFornecedores(prev => 
      prev.map(fornecedor => 
        fornecedor.id === id 
          ? { ...fornecedor, ...fornecedorData }
          : fornecedor
      )
    );
  }, []);

  const deleteFornecedor = useCallback((id: string) => {
    setFornecedores(prev => prev.filter(fornecedor => fornecedor.id !== id));
  }, []);

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
