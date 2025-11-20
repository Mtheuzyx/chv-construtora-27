import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Parcela, ParcelaStatus, NovoBoletoParcelas } from '@/types/parcela';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ParcelaContextType {
  parcelas: Parcela[];
  loading: boolean;
  criarBoletoComParcelas: (boletoParcelas: NovoBoletoParcelas) => Promise<void>;
  updateParcelaPagamento: (parcelaId: string, dataPagamento: string) => Promise<void>;
  updateParcelaVencimento: (parcelaId: string, novaData: string) => Promise<void>;
  updateParcelaValor: (parcelaId: string, novoValor: number) => Promise<void>;
  updateParcelaStatus: (parcelaId: string, novoStatus: ParcelaStatus) => Promise<void>;
  updateParcelaObra: (parcelaId: string, obraId: string | null) => Promise<void>;
  updateParcelaObservacoes: (parcelaId: string, observacoes: string) => Promise<void>;
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
    
    if (dataPagamento) {
      return statusBanco === 'Pago com Atraso' ? 'PAGO_COM_ATRASO' : 'PAGO';
    }
    
    const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diasAteVencimento === -1) {
      return 'VENCE_HOJE';
    }
    
    return hoje > vencimento && diasAteVencimento < -1 ? 'VENCIDO' : 'AGUARDANDO';
  }, []);

  const loadParcelas = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando parcelas do banco...');
      
      const { data: parcelasData, error: parcelasError } = await supabase
        .from('parcelas')
        .select(`
          *,
          boleto:boletos!fk_parcelas_boleto(
            fornecedor_id,
            obra_id,
            observacoes,
            quantidade_parcelas
          )
        `)
        .order('vencimento', { ascending: true });

      console.log('📊 Parcelas recebidas:', { data: parcelasData, error: parcelasError, count: parcelasData?.length });

      if (parcelasError) {
        console.error('❌ Erro ao carregar parcelas:', parcelasError);
        throw parcelasError;
      }

      // Se não há parcelas, apenas retornar array vazio
      if (!parcelasData || parcelasData.length === 0) {
        console.log('ℹ️ Nenhuma parcela encontrada no banco');
        setParcelas([]);
        return;
      }

      const { data: obrasData } = await supabase.from('obras').select('*');
      const obrasMap = new Map((obrasData || []).map(o => [o.id, o]));

      const parcelasMapeadas: Parcela[] = (parcelasData || []).map(p => {
        const boleto = Array.isArray(p.boleto) ? p.boleto[0] : p.boleto;
        const obraId = boleto?.obra_id;
        const obraData = obraId ? obrasMap.get(obraId) : null;

        return {
          id: p.id,
          boletoId: p.boleto_id,
          fornecedorId: boleto?.fornecedor_id || '',
          obraId: obraId || null,
          numeroParcela: p.numero_parcela,
          totalParcelas: boleto?.quantidade_parcelas || 1,
          valor: Number(p.valor),
          dataVencimento: p.vencimento,
          dataPagamento: p.pagamento || undefined,
          status: calculateParcelaStatus(p.vencimento, p.pagamento || undefined, p.status),
          obra: obraData ? {
            codigo: obraData.codigo,
            nome: obraData.nome,
            endereco: obraData.endereco || undefined,
            cidade: obraData.cidade || undefined,
            estado: obraData.estado || undefined
          } : undefined,
          boletoObservacoes: boleto?.observacoes || undefined,
          observacoes: undefined,
          createdAt: p.created_at || new Date().toISOString()
        };
      });

      console.log('✅ Parcelas carregadas:', parcelasMapeadas.length, 'itens');
      setParcelas(parcelasMapeadas);
    } catch (error) {
      console.error('❌ Erro crítico ao carregar parcelas:', error);
      // Não mostrar toast de erro se for apenas porque não há dados
      setParcelas([]);
    } finally {
      setLoading(false);
    }
  }, [calculateParcelaStatus]);

  const criarBoletoComParcelas = useCallback(async (boletoParcelas: NovoBoletoParcelas) => {
    try {
      setLoading(true);
      console.log('🔵 Criando boleto com parcelas:', boletoParcelas);
      
      const boletoId = crypto.randomUUID();

      const { error: boletoError } = await supabase.from('boletos').insert([{
        id: boletoId,
        fornecedor_id: boletoParcelas.fornecedorId,
        obra_id: boletoParcelas.obraId || null,
        valor_total: boletoParcelas.valorParcela * boletoParcelas.quantidadeParcelas,
        quantidade_parcelas: boletoParcelas.quantidadeParcelas,
        vencimento_primeira: boletoParcelas.dataVencimentoPrimeira,
        forma_pagamento: 'Boleto',
        observacoes: boletoParcelas.observacoes || null
      }]);

      console.log('📊 Resultado inserção boleto:', { boletoError });

      if (boletoError) {
        console.error('❌ Erro ao inserir boleto:', boletoError);
        throw boletoError;
      }

      const parcelasParaInserir = [];
      for (let i = 1; i <= boletoParcelas.quantidadeParcelas; i++) {
        const dataVencimento = new Date(boletoParcelas.dataVencimentoPrimeira);
        dataVencimento.setDate(dataVencimento.getDate() + (30 * (i - 1)));
        
        parcelasParaInserir.push({
          boleto_id: boletoId,
          numero_parcela: i,
          valor: boletoParcelas.valorParcela,
          vencimento: dataVencimento.toISOString().split('T')[0],
          status: calculateParcelaStatus(dataVencimento.toISOString().split('T')[0])
        });
      }

      const { error: parcelasError } = await supabase.from('parcelas').insert(parcelasParaInserir);
      if (parcelasError) throw parcelasError;

      await loadParcelas();
      
      toast({
        title: "Sucesso!",
        description: `Boleto criado com ${boletoParcelas.quantidadeParcelas} parcela(s)`,
      });
    } catch (error) {
      console.error('Erro ao criar boleto com parcelas:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar boleto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [calculateParcelaStatus, loadParcelas, toast]);

  const updateParcelaPagamento = useCallback(async (parcelaId: string, dataPagamento: string) => {
    try {
      const { error } = await supabase
        .from('parcelas')
        .update({ 
          pagamento: dataPagamento,
          status: 'pago'
        })
        .eq('id', parcelaId);

      if (error) throw error;

      await loadParcelas();
      toast({
        title: "Sucesso",
        description: "Data de pagamento atualizada",
      });
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar pagamento",
        variant: "destructive"
      });
    }
  }, [loadParcelas, toast]);

  const updateParcelaVencimento = useCallback(async (parcelaId: string, novaData: string) => {
    try {
      const { error } = await supabase
        .from('parcelas')
        .update({ vencimento: novaData })
        .eq('id', parcelaId);

      if (error) throw error;

      await loadParcelas();
      toast({
        title: "Sucesso",
        description: "Data de vencimento atualizada",
      });
    } catch (error) {
      console.error('Erro ao atualizar vencimento:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar vencimento",
        variant: "destructive"
      });
    }
  }, [loadParcelas, toast]);

  const updateParcelaValor = useCallback(async (parcelaId: string, novoValor: number) => {
    try {
      const { error } = await supabase
        .from('parcelas')
        .update({ valor: novoValor })
        .eq('id', parcelaId);

      if (error) throw error;

      await loadParcelas();
      toast({
        title: "Sucesso",
        description: "Valor da parcela atualizado",
      });
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar valor",
        variant: "destructive"
      });
    }
  }, [loadParcelas, toast]);

  const updateParcelaStatus = useCallback(async (parcelaId: string, novoStatus: ParcelaStatus) => {
    try {
      console.log('📝 Atualizando status:', { parcelaId, novoStatus });
      
      const { error } = await supabase
        .from('parcelas')
        .update({ status: novoStatus })
        .eq('id', parcelaId);

      if (error) throw error;

      await loadParcelas();
      console.log('✅ Status atualizado no banco');
      
      toast({
        title: "Sucesso",
        description: "Status atualizado com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status",
        variant: "destructive"
      });
    }
  }, [loadParcelas, toast]);

  const updateParcelaObra = useCallback(async (parcelaId: string, obraId: string | null) => {
    try {
      const { data: parcelaData, error: parcelaError } = await supabase
        .from('parcelas')
        .select('boleto_id')
        .eq('id', parcelaId)
        .single();

      if (parcelaError) throw parcelaError;

      const { error: boletoError } = await supabase
        .from('boletos')
        .update({ obra_id: obraId })
        .eq('id', parcelaData.boleto_id);

      if (boletoError) throw boletoError;

      await loadParcelas();
      toast({
        title: "Sucesso",
        description: "Obra da parcela atualizada",
      });
    } catch (error) {
      console.error('Erro ao atualizar obra:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar obra",
        variant: "destructive"
      });
    }
  }, [loadParcelas, toast]);

  const updateParcelaObservacoes = useCallback(async (parcelaId: string, observacoes: string) => {
    try {
      const { data: parcelaData, error: parcelaError } = await supabase
        .from('parcelas')
        .select('boleto_id')
        .eq('id', parcelaId)
        .single();

      if (parcelaError) throw parcelaError;

      const { error: boletoError } = await supabase
        .from('boletos')
        .update({ observacoes })
        .eq('id', parcelaData.boleto_id);

      if (boletoError) throw boletoError;

      await loadParcelas();
      toast({
        title: "Sucesso",
        description: "Observações atualizadas",
      });
    } catch (error) {
      console.error('Erro ao atualizar observações:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar observações",
        variant: "destructive"
      });
    }
  }, [loadParcelas, toast]);

  const deleteParcela = useCallback(async (parcelaId: string) => {
    try {
      const { error } = await supabase
        .from('parcelas')
        .delete()
        .eq('id', parcelaId);

      if (error) throw error;

      await loadParcelas();
      toast({
        title: "Sucesso",
        description: "Parcela excluída",
      });
    } catch (error) {
      console.error('Erro ao deletar parcela:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir parcela",
        variant: "destructive"
      });
    }
  }, [loadParcelas, toast]);

  const getParcelasByFornecedor = useCallback((fornecedorId: string): Parcela[] => {
    return parcelas.filter(p => p.fornecedorId === fornecedorId);
  }, [parcelas]);

  useEffect(() => {
    loadParcelas();
  }, [loadParcelas]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParcelas(prev => prev.map(p => ({
        ...p,
        status: calculateParcelaStatus(p.dataVencimento, p.dataPagamento)
      })));
    }, 60000);

    return () => clearInterval(interval);
  }, [calculateParcelaStatus]);

  const value = useMemo(() => ({
    parcelas,
    loading,
    criarBoletoComParcelas,
    updateParcelaPagamento,
    updateParcelaVencimento,
    updateParcelaValor,
    updateParcelaStatus,
    updateParcelaObra,
    updateParcelaObservacoes,
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
    updateParcelaObra,
    updateParcelaObservacoes,
    deleteParcela,
    getParcelasByFornecedor,
    loadParcelas
  ]);

  return <ParcelaContext.Provider value={value}>{children}</ParcelaContext.Provider>;
}

export function useParcelas() {
  const ctx = useContext(ParcelaContext);
  if (!ctx) throw new Error('useParcelas must be used within a ParcelaProvider');
  return ctx;
}
