import React, { useState, useMemo, useCallback, memo, Suspense, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useParcelas } from '@/contexts/ParcelaContext';
import { useFornecedores } from '@/contexts/FornecedorContext';
import { useObras } from '@/contexts/ObraContext';
import { Filter, Edit, Trash2, Info, TrendingUp, DollarSign, AlertCircle, CheckCircle, Flag, FileDown, FileSpreadsheet } from 'lucide-react';
import { ParcelaStatus } from '@/types/parcela';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MobileTable } from '@/components/MobileTable';
import { VirtualizedTable } from '@/components/VirtualizedTable';
import { OptimizedStatusBadge } from '@/components/OptimizedStatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { CompactTable } from '@/components/CompactTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Memoized summary card component
const SummaryCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  className = "",
  gradient = "",
  trend
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  className?: string;
  gradient?: string;
  trend?: string;
}) => (
  <Card className={`hover-lift animate-slide-up ${className}`}>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${gradient ? `bg-gradient-to-r ${gradient} bg-clip-text text-transparent` : ''}`}>
            {value}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Icon className="h-4 w-4" />
            {title}
          </div>
          {trend && (
            <div className="text-xs text-muted-foreground mt-1">
              {trend}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
));

SummaryCard.displayName = 'SummaryCard';

// Memoized filter component
const FilterSection = memo(({ 
  filtros, 
  setFiltros, 
  fornecedorOptions,
  obraOptions
}: {
  filtros: any;
  setFiltros: (fn: (prev: any) => any) => void;
  fornecedorOptions: AutocompleteOption[];
  obraOptions: AutocompleteOption[];
}) => (
  <Card className="animate-slide-up hover-glow">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-lg">
        <Filter className="h-5 w-5 text-primary" />
        Filtros de Parcelas
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <Select value={filtros.status} onValueChange={value => setFiltros(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="fast-transition hover:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os status</SelectItem>
              <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
              <SelectItem value="VENCE_HOJE">Vence Hoje</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="PAGO_COM_ATRASO">Pago c/ Atraso</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Fornecedor</Label>
          <Autocomplete
            options={fornecedorOptions}
            value={filtros.fornecedor}
            onValueChange={value => setFiltros(prev => ({ ...prev, fornecedor: value }))}
            placeholder="Selecione um fornecedor"
            searchPlaceholder="Buscar fornecedor..."
            clearable
            className="fast-transition"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Obra</Label>
          <Autocomplete
            options={obraOptions}
            value={filtros.obra}
            onValueChange={value => setFiltros(prev => ({ ...prev, obra: value || 'TODAS' }))}
            placeholder="Selecione uma obra"
            searchPlaceholder="Buscar obra..."
            clearable
            className="fast-transition"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Tipo de Data</Label>
          <Select value={filtros.dateType} onValueChange={value => setFiltros(prev => ({ ...prev, dateType: value as 'vencimento' | 'pagamento' }))}>
            <SelectTrigger className="fast-transition hover:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vencimento">Data de Vencimento</SelectItem>
              <SelectItem value="pagamento">Data de Pagamento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Data Início</Label>
          <Input
            type="date"
            value={filtros.startDate ? filtros.startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
            className="fast-transition hover:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Data Fim</Label>
          <Input
            type="date"
            value={filtros.endDate ? filtros.endDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setFiltros(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
            className="fast-transition hover:border-primary"
          />
        </div>
      </div>
    </CardContent>
  </Card>
));

FilterSection.displayName = 'FilterSection';

export function ControlePagamentosOtimizadoV2() {
  const { isMobile } = useScreenSize();
  const {
    parcelas,
    loading,
    updateParcelaPagamento,
    updateParcelaVencimento,
    updateParcelaValor,
    updateParcelaStatus,
    updateParcelaObra,
    updateParcelaObservacoes,
    deleteParcela
  } = useParcelas();
  const { fornecedores } = useFornecedores();
  const { obras } = useObras();
  const { toast } = useToast();

  const [filtros, setFiltros] = useState({
    status: 'TODOS',
    fornecedor: 'TODOS',
    obra: 'TODAS',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    dateType: 'vencimento' as 'vencimento' | 'pagamento'
  });
  const [editandoParcela, setEditandoParcela] = useState<string | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState({
    dataVencimento: '',
    dataPagamento: '',
    valor: 0,
    status: '' as ParcelaStatus,
    obraId: null as string | null
  });
  const [detalhesParcela, setDetalhesParcela] = useState<any | null>(null);
  const [editandoObservacoes, setEditandoObservacoes] = useState(false);
  const [observacoesEditadas, setObservacoesEditadas] = useState('');
  // Removendo tableHeight e tableContainerRef, pois a tabela se expandirá com o conteúdo
  // const [tableHeight, setTableHeight] = useState(600);
  // const tableContainerRef = useRef<HTMLDivElement>(null);

  // Removendo o useEffect do ResizeObserver, pois a altura não será mais fixa
  // useEffect(() => {
  //   if (!tableContainerRef.current) return;
  //
  //   const resizeObserver = new ResizeObserver(entries => {
  //     const observedHeight = entries[0].contentRect.height;
  //     setTableHeight(Math.max(400, observedHeight));
  //   });
  //
  //   resizeObserver.observe(tableContainerRef.current);
  //
  //   return () => {
  //     resizeObserver.disconnect();
  //   };
  // }, []);

  const getFornecedorNome = useCallback((fornecedorId: string) => {
    try {
      const fornecedor = fornecedores.find(f => f.id === fornecedorId);
      const nome = fornecedor ? fornecedor.nome : 'Fornecedor não encontrado';
      return nome;
    } catch (error) {
      console.error('❌ Erro ao buscar nome do fornecedor:', error);
      return 'Erro ao carregar';
    }
  }, [fornecedores]);

const parcelasFiltradas = useMemo(() => {
  try {
    if (!parcelas?.length) return [];

    const filtradas = parcelas.filter(parcela => {
      if (filtros.status !== 'TODOS' && parcela.status !== filtros.status) return false;
      if (filtros.fornecedor !== 'TODOS' && parcela.fornecedorId !== filtros.fornecedor) return false;
      if (filtros.obra !== 'TODAS' && parcela.obraId !== filtros.obra) return false;

      if (filtros.startDate || filtros.endDate) {
        const dataComparacao = filtros.dateType === 'vencimento' 
          ? new Date(parcela.dataVencimento + 'T00:00:00')
          : parcela.dataPagamento 
            ? new Date(parcela.dataPagamento + 'T00:00:00')
            : null;

        if (!dataComparacao && filtros.dateType === 'pagamento') return false;
        if (filtros.startDate && dataComparacao && dataComparacao < filtros.startDate) return false;
        if (filtros.endDate && dataComparacao && dataComparacao > filtros.endDate) return false;
      }

      return true;
    });

    // Ordenar por data de vencimento (mais próximas primeiro)
    return filtradas.sort((a, b) => {
      const dateA = new Date(a.dataVencimento + 'T00:00:00');
      const dateB = new Date(b.dataVencimento + 'T00:00:00');
      return dateA.getTime() - dateB.getTime();
    });
  } catch (error) {
    console.error('Erro ao filtrar parcelas:', error);
    return [];
  }
}, [parcelas, filtros]);

  const resumoValores = useMemo(() => {
    try {
      if (!parcelas?.length) return { valorTotalPrevisto: 0, valorJaPago: 0, valorEmAtraso: 0, valorVenceHoje: 0 };

      return parcelas.reduce((acc, parcela) => {
        acc.valorTotalPrevisto += parcela.valor;
        
        switch (parcela.status) {
          case 'PAGO':
          case 'PAGO_COM_ATRASO':
            acc.valorJaPago += parcela.valor;
            break;
          case 'VENCIDO':
            acc.valorEmAtraso += parcela.valor;
            break;
          case 'VENCE_HOJE':
            acc.valorVenceHoje += parcela.valor;
            break;
        }
        return acc;
      }, {
        valorTotalPrevisto: 0,
        valorJaPago: 0,
        valorEmAtraso: 0,
        valorVenceHoje: 0
      });
    } catch (error) {
      console.error('Erro ao calcular resumo:', error);
      return { valorTotalPrevisto: 0, valorJaPago: 0, valorEmAtraso: 0, valorVenceHoje: 0 };
    }
  }, [parcelas]);

  const fornecedorOptions: AutocompleteOption[] = useMemo(() => {
    try {
      if (!parcelas?.length || !fornecedores?.length) return [{ value: 'TODOS', label: 'Todos os fornecedores' }];

      const uniqueFornecedores = Array.from(
        new Set(parcelas.map(p => p.fornecedorId))
      ).map(fornecedorId => {
        const fornecedor = fornecedores.find(f => f.id === fornecedorId);
        return fornecedor;
      }).filter(Boolean);

      return [
        { value: 'TODOS', label: 'Todos os fornecedores' },
        ...uniqueFornecedores.map(f => ({ 
          value: f!.id, 
          label: f!.nome,
          description: `ID: ${f!.id.slice(0, 8)}...`
        }))
      ];
    } catch (error) {
      console.error('Erro ao gerar opções de fornecedores:', error);
      return [{ value: 'TODOS', label: 'Todos os fornecedores' }];
    }
  }, [parcelas, fornecedores]);

  const obraOptions: AutocompleteOption[] = useMemo(() => {
    try {
      if (!obras?.length) return [{ value: 'TODAS', label: 'Todas as obras' }];

      return [
        { value: 'TODAS', label: 'Todas as obras' },
        ...obras.map(o => ({
          value: o.id,
          label: `${o.codigo || o.id.slice(0, 8)} - ${o.nome}`,
          description: [o.endereco, o.cidade, o.estado].filter(Boolean).join(' • ')
        }))
      ];
    } catch (error) {
      console.error('Erro ao gerar opções de obras:', error);
      return [{ value: 'TODAS', label: 'Todas as obras' }];
    }
  }, [obras]);

  const abrirEdicao = useCallback((parcela: any) => {
    try {
      setEditandoParcela(parcela.id);
      setDadosEdicao({
        dataVencimento: parcela.dataVencimento,
        dataPagamento: parcela.dataPagamento || '',
        valor: parcela.valor,
        status: parcela.status,
        obraId: parcela.obraId || null
      });
    } catch (error) {
      console.error('Erro ao abrir edição:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir edição da parcela",
        variant: "destructive"
      });
    }
  }, [toast]);

  const salvarEdicao = useCallback(async () => {
    if (!editandoParcela) return;
    
    try {
      const updates = [
        updateParcelaVencimento(editandoParcela, dadosEdicao.dataVencimento),
        updateParcelaValor(editandoParcela, dadosEdicao.valor),
        updateParcelaObra(editandoParcela, dadosEdicao.obraId),
        dadosEdicao.dataPagamento 
          ? updateParcelaPagamento(editandoParcela, dadosEdicao.dataPagamento)
          : updateParcelaStatus(editandoParcela, dadosEdicao.status)
      ];
      
      await Promise.all(updates);
      
      setEditandoParcela(null);
      setDadosEdicao({ dataVencimento: '', dataPagamento: '', valor: 0, status: '' as ParcelaStatus, obraId: null });
      
      toast({
        title: "Sucesso",
        description: "Parcela atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      toast({
        title: "Erro", 
        description: "Erro ao salvar alterações",
        variant: "destructive"
      });
    }
  }, [editandoParcela, dadosEdicao, updateParcelaVencimento, updateParcelaValor, updateParcelaObra, updateParcelaPagamento, updateParcelaStatus, toast]);

  const handleDeleteParcela = useCallback(async (parcelaId: string, fornecedorNome: string, numeroParcela: number) => {
    if (window.confirm(`Tem certeza que deseja excluir a ${numeroParcela}ª parcela de ${fornecedorNome}?`)) {
      try {
        await deleteParcela(parcelaId);
        toast({
          title: "Parcela excluída",
          description: `${numeroParcela}ª parcela de ${fornecedorNome} foi excluída`,
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir parcela",
          variant: "destructive"
        });
      }
    }
  }, [deleteParcela, toast]);

  const exportarParaPDF = useCallback(() => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(16);
      doc.text('Relatório de Boletos - CHV Construtora', 14, 20);
      
      // Data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 28);
      
      // Preparar dados para a tabela
      const dados = parcelasFiltradas.map(parcela => {
        const fornecedor = fornecedores.find(f => f.id === parcela.fornecedorId);
        const obra = obras.find(o => o.id === parcela.obraId);
        
        return [
          fornecedor?.nome || 'N/A',
          obra?.nome || 'Sem obra',
          `${parcela.numeroParcela}/${parcela.totalParcelas}`,
          formatCurrency(parcela.valor),
          new Date(parcela.dataVencimento).toLocaleDateString('pt-BR'),
          parcela.dataPagamento ? new Date(parcela.dataPagamento).toLocaleDateString('pt-BR') : '-',
          parcela.status,
          parcela.observacoes || '-'
        ];
      });
      
      // Criar tabela
      autoTable(doc, {
        head: [['Fornecedor', 'Obra', 'Parcela', 'Valor', 'Vencimento', 'Pagamento', 'Status', 'Obs.']],
        body: dados,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });
      
      // Salvar
      doc.save(`relatorio-boletos-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: `${parcelasFiltradas.length} registros exportados`,
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o relatório",
        variant: "destructive"
      });
    }
  }, [parcelasFiltradas, fornecedores, obras, toast]);

  const exportarParaExcel = useCallback(() => {
    try {
      // Preparar dados para o Excel
      const dados = parcelasFiltradas.map(parcela => {
        const fornecedor = fornecedores.find(f => f.id === parcela.fornecedorId);
        const obra = obras.find(o => o.id === parcela.obraId);
        
        return {
          'Fornecedor': fornecedor?.nome || 'N/A',
          'CPF/CNPJ': fornecedor?.cpfCnpj || 'N/A',
          'Obra': obra?.nome || 'Sem obra',
          'Código Obra': obra?.codigo || '-',
          'Parcela': `${parcela.numeroParcela}/${parcela.totalParcelas}`,
          'Valor': parcela.valor,
          'Data Vencimento': new Date(parcela.dataVencimento).toLocaleDateString('pt-BR'),
          'Data Pagamento': parcela.dataPagamento ? new Date(parcela.dataPagamento).toLocaleDateString('pt-BR') : '-',
          'Status': parcela.status,
          'Observações': parcela.observacoes || '-'
        };
      });
      
      // Criar workbook e worksheet
      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Boletos');
      
      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 }, // Fornecedor
        { wch: 18 }, // CPF/CNPJ
        { wch: 25 }, // Obra
        { wch: 12 }, // Código Obra
        { wch: 10 }, // Parcela
        { wch: 12 }, // Valor
        { wch: 15 }, // Data Vencimento
        { wch: 15 }, // Data Pagamento
        { wch: 18 }, // Status
        { wch: 30 }, // Observações
      ];
      ws['!cols'] = colWidths;
      
      // Salvar
      XLSX.writeFile(wb, `relatorio-boletos-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast({
        title: "Excel gerado com sucesso!",
        description: `${parcelasFiltradas.length} registros exportados`,
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: "Erro ao gerar Excel",
        description: "Ocorreu um erro ao gerar o relatório",
        variant: "destructive"
      });
    }
  }, [parcelasFiltradas, fornecedores, obras, toast]);

  // Tratamento de erro para evitar tela branca
  if (!parcelas && !loading) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
              <p className="text-muted-foreground mb-4">
                Não foi possível carregar as parcelas. Verifique sua conexão e tente novamente.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Recarregar página
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="cards" count={4} />
        <LoadingSkeleton type="filters" count={1} />
        <LoadingSkeleton type="table" count={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* topContentRef e seus conteúdos anteriores não são mais necessários para o cálculo da tableHeight */}
      {/* Resumo de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          title="Total Previsto"
          value={formatCurrency(resumoValores.valorTotalPrevisto)}
          icon={TrendingUp}
          gradient="from-primary to-blue-600"
        />
        
        <SummaryCard 
          title="Já Pago"
          value={formatCurrency(resumoValores.valorJaPago)}
          icon={CheckCircle}
          gradient="from-green-600 to-emerald-600"
        />
        
        <SummaryCard 
          title="Em Atraso"
          value={formatCurrency(resumoValores.valorEmAtraso)}
          icon={AlertCircle}
          gradient="from-red-600 to-rose-600"
        />

        <SummaryCard 
          title="Vence Hoje"
          value={formatCurrency(resumoValores.valorVenceHoje)}
          icon={DollarSign}
          gradient="from-orange-600 to-amber-600"
        />
      </div>

      {/* Botões de Exportação */}
      <div className="flex flex-wrap gap-3 justify-end animate-slide-up">
        <Button 
          onClick={exportarParaPDF}
          variant="outline"
          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </Button>
        <Button 
          onClick={exportarParaExcel}
          variant="outline"
          className="gap-2 hover:bg-green-600 hover:text-white transition-all"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel
        </Button>
      </div>

      {/* Info sobre Parcelas */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-800 animate-slide-up">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">
              Cada linha representa uma parcela individual. Boletos com múltiplas parcelas aparecem em várias linhas.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Suspense fallback={<LoadingSkeleton type="filters" />}>
        <FilterSection 
          filtros={filtros}
          setFiltros={setFiltros}
          fornecedorOptions={fornecedorOptions}
          obraOptions={obraOptions}
        />
      </Suspense>
      {/* topContentRef div removido, pois a altura será calculada pelo container da tabela */}

      {/* Tabela de Parcelas */}
      <Card className="animate-slide-up hover-glow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Parcelas ({parcelasFiltradas.length})
            </span>
            <span className="inline-flex items-center rounded-full border border-input bg-background px-2.5 py-0.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground">
              Total: {formatCurrency(parcelasFiltradas.reduce((sum, p) => sum + (p as any).valor, 0))}
            </span>
          </CardTitle>
        </CardHeader>
        {/* Removendo ref e classes de overflow/padding para que a tabela se expanda naturalmente */}
        <CardContent> {/* Removendo p-0 e overflow-hidden para usar o padding padrão do CardContent */}
          {parcelasFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma parcela encontrada</p>
              <p className="text-sm">Ajuste os filtros para visualizar os dados</p>
            </div>
          ) : isMobile ? (
              <MobileTable
                data={parcelasFiltradas}
                onEdit={abrirEdicao}
                onDelete={(item: any) => handleDeleteParcela(item.id, getFornecedorNome(item.fornecedorId), item.numeroParcela)}
                onView={(item: any) => setDetalhesParcela(item)}
                getStatusBadge={(status: ParcelaStatus) => <OptimizedStatusBadge status={status} showIcon />}
                getFornecedorNome={getFornecedorNome}
                type="parcelas"
              />
          ) : (
            // Usando CompactTable para todos os casos de tabela não-móvel
            <CompactTable
              data={parcelasFiltradas}
              getFornecedorNome={getFornecedorNome}
              abrirEdicao={abrirEdicao}
              handleDeleteParcela={handleDeleteParcela}
              dadosEdicao={dadosEdicao}
              setDadosEdicao={setDadosEdicao}
              salvarEdicao={salvarEdicao}
              onViewDetails={(p: any) => setDetalhesParcela(p)}
              obras={obras}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detalhesParcela} onOpenChange={(open) => { 
        if (!open) {
          setDetalhesParcela(null);
          setEditandoObservacoes(false);
          setObservacoesEditadas('');
        }
      }}>
        <DialogContent className="sm:max-w-lg animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" /> Detalhes do Boleto
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {detalhesParcela?.obra && (
              <div className="rounded-md border p-3">
                <div className="font-semibold mb-1">Obra</div>
                <div><span className="text-muted-foreground">Código:</span> {detalhesParcela.obra.codigo || detalhesParcela.obra.numero_unico || '-'}</div>
                <div><span className="text-muted-foreground">Nome:</span> {detalhesParcela.obra.nome || '-'}</div>
                <div><span className="text-muted-foreground">Endereço:</span> {detalhesParcela.obra.endereco || '-'}</div>
                <div><span className="text-muted-foreground">Responsável:</span> {detalhesParcela.obra.responsavel || '-'}</div>
              </div>
            )}
            <div className="rounded-md border p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Observações</div>
                {!editandoObservacoes && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditandoObservacoes(true);
                      setObservacoesEditadas(detalhesParcela?.observacoes || detalhesParcela?.boletoObservacoes || '');
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              {editandoObservacoes ? (
                <div className="space-y-3">
                  <Textarea 
                    value={observacoesEditadas}
                    onChange={(e) => setObservacoesEditadas(e.target.value)}
                    placeholder="Digite as observações..."
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setEditandoObservacoes(false);
                        setObservacoesEditadas('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      size="sm"
                      onClick={async () => {
                        if (detalhesParcela?.id) {
                          await updateParcelaObservacoes(detalhesParcela.id, observacoesEditadas);
                          
                          // Atualizar o estado local com as novas observações
                          const parcelaAtualizada = parcelas.find(p => p.id === detalhesParcela.id);
                          if (parcelaAtualizada) {
                            setDetalhesParcela({
                              ...parcelaAtualizada,
                              observacoes: observacoesEditadas
                            });
                          }
                          
                          setEditandoObservacoes(false);
                          setObservacoesEditadas('');
                        }
                      }}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {detalhesParcela?.observacoes || detalhesParcela?.boletoObservacoes || 'Nenhuma observação cadastrada'}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}