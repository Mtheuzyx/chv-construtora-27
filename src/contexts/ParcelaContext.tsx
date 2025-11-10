import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Parcela, ParcelaStatus, NovoBoletoParcelas } from '@/types/parcela';
import { useToast } from '@/hooks/use-toast';

interface ParcelaContextType {
  parcelas: Parcela[];
  loading: boolean;
  criarBoletoComParcelas: (boletoParcelas: NovoBoletoParcelas) => Promise<void>;
  updateParcelaPagamento: (parcelaId: string, dataPagamento: string) => Promise<void>;
  updateParcelaVencimento: (parcelaId: string, novaData: string) => Promise<void>;
  updateParcelaValor: (parcelaId: string, novoValor: number) => Promise<void>;
  updateParcelaStatus: (parcelaId: string, novoStatus: ParcelaStatus) => Promise<void>;
  deleteParcela: (parcelaId: string) => Promise<void>;
  getParcelasByFornecedor: (fornecedorId: string) => Parcela[];
  loadParcelas: () => Promise<void>;
}

const ParcelaContext = createContext<ParcelaContextType | undefined>(undefined);

export function ParcelaProvider({ children }: { children: React.ReactNode }) {
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const calculateParcelaStatus = useCallback((dataVencimento: string, dataPagamento?: string, statusBanco?: string): ParcelaStatus => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    
    // Se há data de pagamento, usar apenas "PAGO" (não automático com atraso)
    if (dataPagamento) {
      // Se o status do banco indica "Pago com Atraso", manter; caso contrário, "PAGO"
      return statusBanco === 'Pago com Atraso' ? 'PAGO_COM_ATRASO' : 'PAGO';
    }
    
    const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    // Status para "Vence hoje" (para boletos que venceram 1 dia antes)
    if (diasAteVencimento === -1) {
      return 'VENCE_HOJE';
    }
    
    return hoje > vencimento && diasAteVencimento < -1 ? 'VENCIDO' : 'AGUARDANDO';
  }, []);

  const loadParcelas = useCallback(async () => {
    try {
      setLoading(true);
      const stored = localStorage.getItem('parcelas');
      if (stored) {
        const parcelasCarregadas = JSON.parse(stored);
        // Recalcular status baseado na data atual
        const parcelasAtualizadas = parcelasCarregadas.map((p: Parcela) => ({
          ...p,
          status: calculateParcelaStatus(p.dataVencimento, p.dataPagamento)
        }));
        setParcelas(parcelasAtualizadas);
      }
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateParcelaStatus]);

  const criarBoletoComParcelas = useCallback(async (boletoParcelas: NovoBoletoParcelas) => {
    try {
      setLoading(true);
      
      const boletoId = crypto.randomUUID();
      const novasParcelas: Parcela[] = [];
      
      // Buscar obra se necessário
      let obra = undefined;
      if (boletoParcelas.obraId) {
        const obrasStored = localStorage.getItem('obras');
        if (obrasStored) {
          const obras = JSON.parse(obrasStored);
          const obraEncontrada = obras.find((o: any) => o.id === boletoParcelas.obraId);
          if (obraEncontrada) {
            obra = {
              codigo: obraEncontrada.codigo,
              nome: obraEncontrada.nome,
              endereco: obraEncontrada.endereco,
              cidade: obraEncontrada.cidade,
              estado: obraEncontrada.estado
            };
          }
        }
      }
      
      // Criar parcelas
      for (let i = 1; i <= boletoParcelas.quantidadeParcelas; i++) {
        const dataVencimento = new Date(boletoParcelas.dataVencimentoPrimeira);
        dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));
        
        const parcela: Parcela = {
          id: crypto.randomUUID(),
          boletoId,
          fornecedorId: boletoParcelas.fornecedorId,
          obraId: boletoParcelas.obraId,
          numeroParcela: i,
          totalParcelas: boletoParcelas.quantidadeParcelas,
          valor: boletoParcelas.valorParcela,
          dataVencimento: dataVencimento.toISOString().split('T')[0],
          status: calculateParcelaStatus(dataVencimento.toISOString().split('T')[0]),
          obra,
          boletoObservacoes: boletoParcelas.observacoes,
          createdAt: new Date().toISOString()
        };
        
        novasParcelas.push(parcela);
      }
      
      setParcelas(prev => {
        const updated = [...novasParcelas, ...prev];
        localStorage.setItem('parcelas', JSON.stringify(updated));
        return updated;
      });
      
      toast({
        title: "Sucesso!",
        description: `Boleto criado com ${boletoParcelas.quantidadeParcelas} parcela(s)`,
      });
    } catch (error) {
      console.error('Erro ao criar boleto com parcelas:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar boleto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [calculateParcelaStatus, toast]);

  const updateParcelaPagamento = useCallback(async (parcelaId: string, dataPagamento: string) => {
    try {
      setParcelas(prev => {
        const updated = prev.map(parcela => {
          if (parcela.id === parcelaId) {
            return {
              ...parcela,
              dataPagamento,
              status: 'PAGO' as ParcelaStatus
            };
          }
          return parcela;
        });
        localStorage.setItem('parcelas', JSON.stringify(updated));
        return updated;
      });

      toast({
        title: "Sucesso",
        description: "Data de pagamento atualizada",
      });
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar pagamento",
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateParcelaVencimento = useCallback(async (parcelaId: string, novaData: string) => {
    try {
      setParcelas(prev => {
        const updated = prev.map(parcela => {
          if (parcela.id === parcelaId) {
            return {
              ...parcela,
              dataVencimento: novaData,
              status: calculateParcelaStatus(novaData, parcela.dataPagamento)
            };
          }
          return parcela;
        });
        localStorage.setItem('parcelas', JSON.stringify(updated));
        return updated;
      });

      toast({
        title: "Sucesso",
        description: "Data de vencimento atualizada",
      });
    } catch (error) {
      console.error('Erro ao atualizar vencimento:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar vencimento",
        variant: "destructive"
      });
    }
  }, [calculateParcelaStatus, toast]);

  const updateParcelaValor = useCallback(async (parcelaId: string, novoValor: number) => {
    try {
      setParcelas(prev => {
        const updated = prev.map(parcela => {
          if (parcela.id === parcelaId) {
            return {
              ...parcela,
              valor: novoValor
            };
          }
          return parcela;
        });
        localStorage.setItem('parcelas', JSON.stringify(updated));
        return updated;
      });

      toast({
        title: "Sucesso",
        description: "Valor da parcela atualizado",
      });
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar valor",
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateParcelaStatus = useCallback(async (parcelaId: string, novoStatus: ParcelaStatus) => {
    try {
      setParcelas(prev => {
        const updated = prev.map(parcela => {
          if (parcela.id === parcelaId) {
            return {
              ...parcela,
              status: novoStatus
            };
          }
          return parcela;
        });
        localStorage.setItem('parcelas', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao atualizar status",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteParcela = useCallback(async (parcelaId: string) => {
    try {
      setParcelas(prev => {
        const updated = prev.filter(parcela => parcela.id !== parcelaId);
        localStorage.setItem('parcelas', JSON.stringify(updated));
        return updated;
      });
      
      toast({
        title: "Sucesso",
        description: "Parcela deletada",
      });
    } catch (error) {
      console.error('Erro ao deletar parcela:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao deletar parcela",
        variant: "destructive"
      });
    }
  }, [toast]);

  const getParcelasByFornecedor = useCallback((fornecedorId: string): Parcela[] => {
    return parcelas.filter(p => p.fornecedorId === fornecedorId);
  }, [parcelas]);

  // Carregar parcelas ao inicializar
  useEffect(() => {
    loadParcelas();
  }, [loadParcelas]);

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

// Executa atualização automática diária, agendada para a meia-noite
useEffect(() => {
  // Atualiza status imediatamente ao carregar
  updateAllParcelasStatus();

  let timeoutId: number;
  const scheduleNextRun = () => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0); // próxima meia-noite
    const msUntilNext = next.getTime() - now.getTime();

    timeoutId = window.setTimeout(() => {
      updateAllParcelasStatus();
      scheduleNextRun(); // reagenda para o próximo dia
    }, msUntilNext);
  };

  scheduleNextRun();

  return () => clearTimeout(timeoutId);
}, [updateAllParcelasStatus]);

  const contextValue = useMemo(() => ({ 
    parcelas, 
    loading,
    criarBoletoComParcelas, 
    updateParcelaPagamento,
    updateParcelaVencimento,
    updateParcelaValor,
    updateParcelaStatus,
    deleteParcela,
    getParcelasByFornecedor,
    loadParcelas
  }), [
    parcelas, 
    loading,
    criarBoletoComParcelas, 
    updateParcelaPagamento,
    updateParcelaVencimento,
    updateParcelaValor,
    updateParcelaStatus,
    deleteParcela,
    getParcelasByFornecedor,
    loadParcelas
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