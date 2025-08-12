import React, { useState, useMemo, useCallback, memo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Autocomplete, AutocompleteOption } from '@/components/ui/autocomplete';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useParcelas } from '@/contexts/ParcelaContext';
import { useFornecedores } from '@/contexts/FornecedorContext';
import { useObras } from '@/contexts/ObraContext';
import { Filter, Edit, Trash2, Info, TrendingUp, DollarSign, AlertCircle, CheckCircle, Flag } from 'lucide-react';
import { ParcelaStatus } from '@/types/parcela';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MobileTable } from '@/components/MobileTable';
import { VirtualizedTable } from '@/components/VirtualizedTable';
import { OptimizedStatusBadge } from '@/components/OptimizedStatusBadge';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { CompactTable } from '@/components/CompactTable';

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
    status: '' as ParcelaStatus
  });
  const [detalhesParcela, setDetalhesParcela] = useState<any | null>(null);

  const getFornecedorNome = useCallback((fornecedorId: string) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    return fornecedor ? fornecedor.nome : 'Fornecedor não encontrado';
  }, [fornecedores]);

const parcelasFiltradas = useMemo(() => {
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

  return filtradas;
}, [parcelas, filtros]);

  const resumoValores = useMemo(() => {
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
  }, [parcelas]);

  const fornecedorOptions: AutocompleteOption[] = useMemo(() => {
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
  }, [parcelas, fornecedores]);

  const obraOptions: AutocompleteOption[] = useMemo(() => {
    if (!obras?.length) return [{ value: 'TODAS', label: 'Todas as obras' }];

    return [
      { value: 'TODAS', label: 'Todas as obras' },
      ...obras.map(o => ({
        value: o.id,
        label: `${o.codigo || o.numero_unico || o.id.slice(0, 8)} - ${o.nome}`,
        description: [o.endereco, o.responsavel ? `Resp: ${o.responsavel}` : ''].filter(Boolean).join(' • ')
      }))
    ];
  }, [obras]);

  const abrirEdicao = useCallback((parcela: any) => {
    setEditandoParcela(parcela.id);
    setDadosEdicao({
      dataVencimento: parcela.dataVencimento,
      dataPagamento: parcela.dataPagamento || '',
      valor: parcela.valor,
      status: parcela.status
    });
  }, []);

  const salvarEdicao = useCallback(async () => {
    if (!editandoParcela) return;
    
    try {
      await Promise.all([
        updateParcelaVencimento(editandoParcela, dadosEdicao.dataVencimento),
        updateParcelaValor(editandoParcela, dadosEdicao.valor),
        dadosEdicao.dataPagamento 
          ? updateParcelaPagamento(editandoParcela, dadosEdicao.dataPagamento)
          : updateParcelaStatus(editandoParcela, dadosEdicao.status)
      ]);
      
      setEditandoParcela(null);
      setDadosEdicao({ dataVencimento: '', dataPagamento: '', valor: 0, status: '' as ParcelaStatus });
      
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
  }, [editandoParcela, dadosEdicao, updateParcelaVencimento, updateParcelaValor, updateParcelaPagamento, updateParcelaStatus, toast]);

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

      {/* Tabela de Parcelas */}
      <Card className="animate-slide-up hover-glow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Parcelas ({parcelasFiltradas.length})
            </span>
            <Badge variant="outline" className="hover-lift">
              Total: {formatCurrency(parcelasFiltradas.reduce((sum, p) => sum + p.valor, 0))}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
          ) : parcelasFiltradas.length > 50 ? (
            <div className="scroll-container" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <VirtualizedTable
                data={parcelasFiltradas}
                rowHeight={48}
                containerHeight={Math.min(800, window.innerHeight - 300)}
                keyExtractor={(item) => item.id}
                headers={
                  <TableRow className="sticky top-0 bg-background z-10">
                    <TableHead className="w-32">Fornecedor</TableHead>
                    <TableHead className="w-24">Parcela</TableHead>
                    <TableHead className="w-20">Valor</TableHead>
                    <TableHead className="w-28">Vencimento</TableHead>
                    <TableHead className="w-28">Pagamento</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Observações</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                }
                renderRow={(parcela) => (
                  <>
                    <TableCell className="font-medium">
                      {getFornecedorNome(parcela.fornecedorId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs hover-lift" title={`Parcela ${parcela.numeroParcela} de ${parcela.totalParcelas}`}>
                        Parcela {parcela.numeroParcela}/{parcela.totalParcelas}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(parcela.valor)}
                    </TableCell>
                    <TableCell>
                      {new Date(parcela.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {parcela.dataPagamento ? 
                        new Date(parcela.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR') : 
                        <span className="text-muted-foreground">-</span>
                      }
                    </TableCell>
                    <TableCell>
                      <OptimizedStatusBadge status={parcela.status} showIcon />
                    </TableCell>
                    <TableCell>
                      {(parcela.observacoes || parcela.boletoObservacoes) ? (
                        <Button size="sm" variant="outline" className="hover-lift text-xs" onClick={() => setDetalhesParcela(parcela)}>
                          <Flag className="h-3 w-3 mr-1" /> Observações
                        </Button>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={() => abrirEdicao(parcela)} className="hover-lift">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md animate-scale-in">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Edit className="h-5 w-5" />
                                Editar Parcela
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Fornecedor</Label>
                                <Input value={getFornecedorNome(parcela.fornecedorId)} disabled className="bg-muted" />
                              </div>

                              <div>
                                <Label>Valor da Parcela</Label>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  value={dadosEdicao.valor} 
                                  onChange={(e) => setDadosEdicao(prev => ({ ...prev, valor: Number(e.target.value) }))}
                                  className="fast-transition"
                                />
                              </div>

                              <div>
                                <Label>Data de Vencimento</Label>
                                <Input 
                                  type="date" 
                                  value={dadosEdicao.dataVencimento} 
                                  onChange={(e) => setDadosEdicao(prev => ({ ...prev, dataVencimento: e.target.value }))}
                                  className="fast-transition"
                                />
                              </div>

                              <div>
                                <Label>Data de Pagamento</Label>
                                <Input 
                                  type="date" 
                                  value={dadosEdicao.dataPagamento} 
                                  onChange={(e) => setDadosEdicao(prev => ({ ...prev, dataPagamento: e.target.value }))}
                                  className="fast-transition"
                                />
                              </div>

                              {!dadosEdicao.dataPagamento && (
                                <div>
                                  <Label>Status</Label>
                                  <Select value={dadosEdicao.status} onValueChange={(value) => setDadosEdicao(prev => ({ ...prev, status: value as ParcelaStatus }))}>
                                    <SelectTrigger className="fast-transition">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                                      <SelectItem value="VENCE_HOJE">Vence Hoje</SelectItem>
                                      <SelectItem value="VENCIDO">Vencido</SelectItem>
                                      <SelectItem value="PAGO">Pago</SelectItem>
                                      <SelectItem value="PAGO_COM_ATRASO">Pago c/ Atraso</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              <div className="flex gap-2 pt-4">
                                <Button onClick={salvarEdicao} className="flex-1 hover-lift">
                                  Salvar Alterações
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteParcela(parcela.id, getFornecedorNome(parcela.fornecedorId), parcela.numeroParcela)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover-lift"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              />
            </div>
          ) : (
            <div className="scroll-container" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              <CompactTable
                data={parcelasFiltradas}
                getFornecedorNome={getFornecedorNome}
                abrirEdicao={abrirEdicao}
                handleDeleteParcela={handleDeleteParcela}
                dadosEdicao={dadosEdicao}
                setDadosEdicao={setDadosEdicao}
                salvarEdicao={salvarEdicao}
                onViewDetails={(p: any) => setDetalhesParcela(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detalhesParcela} onOpenChange={(open) => { if (!open) setDetalhesParcela(null); }}>
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
            {(detalhesParcela?.observacoes || detalhesParcela?.boletoObservacoes) && (
              <div className="rounded-md border p-3">
                <div className="font-semibold mb-1">Observações</div>
                <div className="text-muted-foreground whitespace-pre-wrap">
                  {detalhesParcela.observacoes || detalhesParcela.boletoObservacoes}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}