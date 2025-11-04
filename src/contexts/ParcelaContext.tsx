import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Parcela, ParcelaStatus, NovoBoletoParcelas } from '@/types/parcela';
import { supabase } from '@/integrations/supabase/client';
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
      console.log('🔄 Iniciando carregamento de parcelas...');
      
      // Buscar parcelas e boletos com join
      const { data: parcelasData, error } = await supabase
        .from('parcelas')
        .select(`
          *,
          boletos!inner(
            fornecedor_id,
            forma_pagamento,
            observacoes,
            quantidade_parcelas,
            obra_id,
            obras(
              codigo,
              nome,
              endereco,
              cidade,
              estado
            )
          )
        `)
        .order('vencimento', { ascending: true });

      console.log('📊 Dados brutos do Supabase:', parcelasData);
      console.log('❌ Erro do Supabase:', error);

      if (error) {
        console.error('Erro ao carregar parcelas:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar parcelas do banco de dados",
          variant: "destructive"
        });
        return;
      }

      const parcelasFormatadas: Parcela[] = (parcelasData as any)?.map((p: any) => ({
        id: p.id,
        boletoId: p.boleto_id,
        fornecedorId: p.boletos.fornecedor_id,
        obraId: p.boletos.obra_id,
        numeroParcela: p.numero_parcela,
        totalParcelas: p.boletos.quantidade_parcelas,
        valor: Number(p.valor),
        dataVencimento: p.vencimento,
        dataPagamento: p.pagamento || undefined,
        status: calculateParcelaStatus(p.vencimento, p.pagamento, p.status),
        observacoes: (() => { const existing = p.observacoes || p.boletos.observacoes; const o = p.boletos?.obras; const obraInfo = o ? [o.codigo, o.nome, o.endereco, o.cidade, o.estado].filter(Boolean).join(' - ') : ''; return obraInfo ? `${existing ? `${existing} | ` : ''}Obra: ${obraInfo}` : existing; })(),
        obra: p.boletos?.obras ? {
          codigo: p.boletos.obras.codigo,
          nome: p.boletos.obras.nome,
          endereco: p.boletos.obras.endereco,
          cidade: p.boletos.obras.cidade,
          estado: p.boletos.obras.estado,
        } : undefined,
        boletoObservacoes: p.boletos?.observacoes || undefined,
        createdAt: new Date().toISOString()
      })) || [];
      console.log('✅ Parcelas formatadas:', parcelasFormatadas);
      console.log('📈 Total de parcelas carregadas:', parcelasFormatadas.length);

      setParcelas(parcelasFormatadas);
    } catch (error) {
      console.error('Erro ao carregar parcelas:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [calculateParcelaStatus, toast]);

  const criarBoletoComParcelas = useCallback(async (boletoParcelas: NovoBoletoParcelas) => {
    try {
      setLoading(true);
      
      // Primeiro criar o boleto
      const valorTotal = boletoParcelas.valorParcela * boletoParcelas.quantidadeParcelas;
      const { data: boletoData, error: boletoError } = await supabase
        .from('boletos')
        .insert({
          fornecedor_id: boletoParcelas.fornecedorId,
          forma_pagamento: boletoParcelas.formaPagamento,
          valor_total: valorTotal,
          quantidade_parcelas: boletoParcelas.quantidadeParcelas,
          vencimento_primeira: boletoParcelas.dataVencimentoPrimeira,
          observacoes: boletoParcelas.observacoes,
          obra_id: boletoParcelas.obraId ?? null
        })
        .select()
        .single();

      if (boletoError) {
        console.error('Erro ao criar boleto:', boletoError);
        toast({
          title: "Erro",
          description: "Erro ao salvar boleto no banco de dados",
          variant: "destructive"
        });
        return;
      }

      // As parcelas são criadas automaticamente via trigger
      // Recarregar parcelas para mostrar os novos dados
      await loadParcelas();
      
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
  }, [loadParcelas, toast]);

  const updateParcelaPagamento = useCallback(async (parcelaId: string, dataPagamento: string) => {
    try {
      const { error } = await (supabase as any)
        .from('parcelas')
        .update({ 
          pagamento: dataPagamento,
          status: 'pago'
        })
        .eq('id', parcelaId);

      if (error) {
        console.error('Erro ao atualizar pagamento:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar data de pagamento",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local - sempre definir como PAGO quando data é informada
      setParcelas(prev => prev.map(parcela => {
        if (parcela.id === parcelaId) {
          return {
            ...parcela,
            dataPagamento,
            status: 'PAGO'
          };
        }
        return parcela;
      }));

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
  }, [calculateParcelaStatus, toast]);

  const updateParcelaVencimento = useCallback(async (parcelaId: string, novaData: string) => {
    try {
      const { error } = await supabase
        .from('parcelas')
        .update({ vencimento: novaData })
        .eq('id', parcelaId);

      if (error) {
        console.error('Erro ao atualizar vencimento:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar data de vencimento",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local
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
      const { error } = await (supabase as any)
        .from('parcelas')
        .update({ valor: novoValor })
        .eq('id', parcelaId);

      if (error) {
        console.error('Erro ao atualizar valor:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar valor da parcela",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local
      setParcelas(prev => prev.map(parcela => {
        if (parcela.id === parcelaId) {
          return {
            ...parcela,
            valor: novoValor
          };
        }
        return parcela;
      }));

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
      const statusMapping = {
        'AGUARDANDO': 'pendente',
        'PAGO': 'pago',
        'PAGO_COM_ATRASO': 'pago',
        'VENCIDO': 'vencido',
        'VENCE_HOJE': 'pendente'
      };

      const { error } = await (supabase as any)
        .from('parcelas')
        .update({ status: statusMapping[novoStatus] })
        .eq('id', parcelaId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar status da parcela",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local
      setParcelas(prev => prev.map(parcela => {
        if (parcela.id === parcelaId) {
          return {
            ...parcela,
            status: novoStatus
          };
        }
        return parcela;
      }));
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
      const { error } = await supabase
        .from('parcelas')
        .delete()
        .eq('id', parcelaId);

      if (error) {
        console.error('Erro ao deletar parcela:', error);
        toast({
          title: "Erro",
          description: "Erro ao deletar parcela",
          variant: "destructive"
        });
        return;
      }

      // Atualizar estado local
      setParcelas(prev => prev.filter(parcela => parcela.id !== parcelaId));
      
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