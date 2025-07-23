
import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Parcela, ParcelaStatus, NovoBoletoParcelas } from '@/types/parcela';

interface ParcelaContextType {
  parcelas: Parcela[];
  criarBoletoComParcelas: (boletoParcelas: NovoBoletoParcelas) => void;
  updateParcelaPagamento: (parcelaId: string, dataPagamento: string) => void;
  updateParcelaVencimento: (parcelaId: string, novaData: string) => void;
  updateParcelaStatus: (parcelaId: string, novoStatus: ParcelaStatus) => void;
  deleteParcela: (parcelaId: string) => void;
  getParcelasByFornecedor: (fornecedorId: string) => Parcela[];
}

const ParcelaContext = createContext<ParcelaContextType | undefined>(undefined);

export function ParcelaProvider({ children }: { children: React.ReactNode }) {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);

  const calculateParcelaStatus = useCallback((dataVencimento: string, dataPagamento?: string): ParcelaStatus => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    if (dataPagamento) {
      const pagamento = new Date(dataPagamento);
      return pagamento <= vencimento ? 'PAGO' : 'PAGO_COM_ATRASO';
    }
    
    // Status para "Vence hoje"
    if (hoje.getTime() === vencimento.getTime()) {
      return 'VENCE_HOJE';
    }
    
    return hoje > vencimento ? 'VENCIDO' : 'AGUARDANDO';
  }, []);

  const criarBoletoComParcelas = useCallback((boletoParcelas: NovoBoletoParcelas) => {
    const boletoId = crypto.randomUUID();
    const valorParcela = boletoParcelas.valorTotal / boletoParcelas.quantidadeParcelas;
    const novasParcelas: Parcela[] = [];

    for (let i = 1; i <= boletoParcelas.quantidadeParcelas; i++) {
      const dataVencimento = new Date(boletoParcelas.dataVencimentoPrimeira);
      dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));

      const parcela: Parcela = {
        id: crypto.randomUUID(),
        boletoId,
        fornecedorId: boletoParcelas.fornecedorId,
        numeroParcela: i,
        totalParcelas: boletoParcelas.quantidadeParcelas,
        valor: valorParcela,
        dataVencimento: dataVencimento.toISOString().split('T')[0],
        status: calculateParcelaStatus(dataVencimento.toISOString().split('T')[0]),
        observacoes: boletoParcelas.observacoes,
        createdAt: new Date().toISOString()
      };

      novasParcelas.push(parcela);
    }

    setParcelas(prev => [...prev, ...novasParcelas]);
  }, [calculateParcelaStatus]);

  const updateParcelaPagamento = useCallback((parcelaId: string, dataPagamento: string) => {
    setParcelas(prev => prev.map(parcela => {
      if (parcela.id === parcelaId) {
        return {
          ...parcela,
          dataPagamento,
          status: calculateParcelaStatus(parcela.dataVencimento, dataPagamento)
        };
      }
      return parcela;
    }));
  }, [calculateParcelaStatus]);

  const updateParcelaVencimento = useCallback((parcelaId: string, novaData: string) => {
    setParcelas(prev => prev.map(parcela => {
      if (parcela.id === parcelaId) {
        return {
          ...parcela,
          dataVencimento: novaData,
          status: calculateParcelaStatus(novaData, parcela.dataPagamento)
        };
      }
      return parcela;
    }));
  }, [calculateParcelaStatus]);

  const updateParcelaStatus = useCallback((parcelaId: string, novoStatus: ParcelaStatus) => {
    setParcelas(prev => prev.map(parcela => {
      if (parcela.id === parcelaId) {
        return {
          ...parcela,
          status: novoStatus
        };
      }
      return parcela;
    }));
  }, []);

  const deleteParcela = useCallback((parcelaId: string) => {
    setParcelas(prev => prev.filter(parcela => parcela.id !== parcelaId));
  }, []);

  const getParcelasByFornecedor = useCallback((fornecedorId: string): Parcela[] => {
    return parcelas.filter(p => p.fornecedorId === fornecedorId);
  }, [parcelas]);

  // Atualização automática de status baseada na data atual
  const updateAllParcelasStatus = useCallback(() => {
    setParcelas(prev => prev.map(parcela => {
      // Só atualiza se não há data de pagamento (não foi pago)
      if (!parcela.dataPagamento) {
        const novoStatus = calculateParcelaStatus(parcela.dataVencimento);
        if (novoStatus !== parcela.status) {
          return { ...parcela, status: novoStatus };
        }
      }
      return parcela;
    }));
  }, [calculateParcelaStatus]);

  // Executa atualização automática diariamente
  useEffect(() => {
    // Atualiza status imediatamente ao carregar
    updateAllParcelasStatus();

    // Configura atualização automática a cada minuto para detectar mudanças de dia
    const interval = setInterval(() => {
      updateAllParcelasStatus();
    }, 60000); // 1 minuto

    return () => clearInterval(interval);
  }, [updateAllParcelasStatus]);

  const contextValue = useMemo(() => ({ 
    parcelas, 
    criarBoletoComParcelas, 
    updateParcelaPagamento,
    updateParcelaVencimento,
    updateParcelaStatus,
    deleteParcela,
    getParcelasByFornecedor
  }), [
    parcelas, 
    criarBoletoComParcelas, 
    updateParcelaPagamento,
    updateParcelaVencimento,
    updateParcelaStatus,
    deleteParcela,
    getParcelasByFornecedor
  ]);

  return (
    <ParcelaContext.Provider value={contextValue}>
      {children}
    </ParcelaContext.Provider>
  );
}

export function useParcelas() {
  const context = useContext(ParcelaContext);
  if (context === undefined) {
    throw new Error('useParcelas must be used within a ParcelaProvider');
  }
  return context;
}
