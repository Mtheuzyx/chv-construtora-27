import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Boleto, BoletoFormData } from '@/types/boleto';
import { calculateBoletoStatus } from '@/utils/boletoUtils';

interface BoletoContextType {
  boletos: Boleto[];
  addBoleto: (boletoData: BoletoFormData) => void;
  updateBoletoPayment: (boletoId: string, dataPagamento: string) => void;
}

const BoletoContext = createContext<BoletoContextType | undefined>(undefined);

export function BoletoProvider({ children }: { children: React.ReactNode }) {
  const [boletos, setBoletos] = useState<Boleto[]>([]);

  const addBoleto = useCallback((boletoData: BoletoFormData) => {
    const valorTotal = parseFloat(boletoData.valor);
    const quantidadeParcelas = parseInt(boletoData.parcelas);
    const valorParcela = valorTotal / quantidadeParcelas;
    
    const novoBoleto: Boleto = {
      id: crypto.randomUUID(),
      nomeCliente: boletoData.nomeCliente,
      cpf: boletoData.cpf,
      cidade: boletoData.cidade,
      formaPagamento: boletoData.formaPagamento,
      dataPagamento: boletoData.dataPagamento || undefined,
      dataVencimento: boletoData.dataVencimento,
      valor: valorTotal,
      parcelas: quantidadeParcelas,
      valorParcela: valorParcela,
      parcelaAtual: parseInt(boletoData.parcelaAtual),
      observacoes: boletoData.observacoes || undefined,
      status: calculateBoletoStatus(boletoData.dataVencimento, boletoData.dataPagamento),
      createdAt: new Date().toISOString()
    };

    setBoletos(prev => [...prev, novoBoleto]);
  }, []);

  const updateBoletoPayment = useCallback((boletoId: string, dataPagamento: string) => {
    setBoletos(prev => prev.map(boleto => {
      if (boleto.id === boletoId) {
        const updatedBoleto = {
          ...boleto,
          dataPagamento,
          status: calculateBoletoStatus(boleto.dataVencimento, dataPagamento)
        };
        return updatedBoleto;
      }
      return boleto;
    }));
  }, []);

  const contextValue = useMemo(() => ({
    boletos,
    addBoleto,
    updateBoletoPayment
  }), [boletos, addBoleto, updateBoletoPayment]);

  return (
    <BoletoContext.Provider value={contextValue}>
      {children}
    </BoletoContext.Provider>
  );
}

export function useBoletos() {
  const context = useContext(BoletoContext);
  if (context === undefined) {
    throw new Error('useBoletos must be used within a BoletoProvider');
  }
  return context;
}