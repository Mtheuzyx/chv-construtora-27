import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
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
import { Filter, Edit, Trash2, DollarSign, CheckCircle, AlertCircle, TrendingUp, Eye } from 'lucide-react';
import { ParcelaStatus } from '@/types/parcela';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/formatters';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MobileTable } from '@/components/MobileTable';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

// Componente de badge de status otimizado
const StatusBadge = memo(({ status }: { status: ParcelaStatus }) => {
  const configs = {
    AGUARDANDO: { 
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100', 
      label: 'Aguardando' 
    },
    PAGO: { 
      className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100', 
      label: 'Pago' 
    },
    PAGO_COM_ATRASO: { 
      className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', 
      label: 'Pago c/ Atraso' 
    },
    VENCIDO: { 
      className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', 
      label: 'Vencido' 
    },
    VENCE_HOJE: { 
      className: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', 
      label: 'Vence Hoje' 
    }
  };
  
  const config = configs[status];
  return (
    <Badge className={`${config.className} transition-colors duration-200`}>
      {config.label}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

// Componente de card de resumo otimizado
const SummaryCard = memo(({ 
  title, 
  value, 
  icon: Icon,
  colorClass
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  colorClass: string;
}) => (
  <Card className="hover:shadow-lg transition-all duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${colorClass}`}>
            {value}
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
));

SummaryCard.displayName = 'SummaryCard';

// Componente de tabela com scroll virtual otimizado
const VirtualScrollTable = memo(({ 
  parcelas, 
  getFornecedorNome, 
  onEdit, 
  onDelete 
}: {
  parcelas: any[];
  getFornecedorNome: (id: string) => string;
  onEdit: (parcela: any) => void;
  onDelete: (id: string, nome: string, numero: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  
  const ITEM_HEIGHT = 56; // Altura fixa de cada linha
  const OVERSCAN = 5; // Itens extras para renderizar fora da view

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const maxHeight = window.innerHeight - 400; // Altura da tela menos espaço para header/footer
        setContainerHeight(Math.min(maxHeight, 600));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT);
    const end = Math.min(parcelas.length, start + visibleCount + OVERSCAN * 2);
    
    return { start, end };
  }, [scrollTop, containerHeight, parcelas.length]);

  const visibleParcelas = useMemo(() => {
    return parcelas.slice(visibleRange.start, visibleRange.end);
  }, [parcelas, visibleRange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = parcelas.length * ITEM_HEIGHT;
  const offsetY = visibleRange.start * ITEM_HEIGHT;

  return (
    <div 
      ref={containerRef}
      className="overflow-auto border rounded-lg"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-20 shadow-sm">
            <TableRow>
              <TableHead className="w-[200px]">Fornecedor</TableHead>
              <TableHead className="w-[100px]">Parcela</TableHead>
              <TableHead className="w-[120px]">Valor</TableHead>
              <TableHead className="w-[120px]">Vencimento</TableHead>
              <TableHead className="w-[120px]">Pagamento</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[200px]">Observações</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleParcelas.map((parcela, index) => (
              <TableRow 
                key={parcela.id} 
                className="hover:bg-muted/50 transition-colors duration-150"
                style={{ height: ITEM_HEIGHT }}
              >
                <TableCell className="font-medium">
                  {getFornecedorNome(parcela.fornecedorId)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {parcela.numeroParcela}/{parcela.totalParcelas}
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
                  <StatusBadge status={parcela.status} />
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {parcela.observacoes || <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onEdit(parcela)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onDelete(parcela.id, getFornecedorNome(parcela.fornecedorId), parcela.numeroParcela)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});

VirtualScrollTable.displayName = 'VirtualScrollTable';

export function ControlePagamentosUltimate() {
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

  // Mapeamento de fornecedores otimizado
  const fornecedorMap = useMemo(() => {
    return new Map(fornecedores.map(f => [f.id, f.nome]));
  }, [fornecedores]);

  const getFornecedorNome = useCallback((fornecedorId: string) => {
    return fornecedorMap.get(fornecedorId) || 'Fornecedor não encontrado';
  }, [fornecedorMap]);

  // Filtragem otimizada das parcelas
  const parcelasFiltradas = useMemo(() => {
    if (!parcelas?.length) return [];

    return parcelas.filter(parcela => {
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
  }, [parcelas, filtros]);

  // Cálculo do resumo otimizado
  const resumoValores = useMemo(() => {
    if (!parcelas?.length) {
      return { valorTotalPrevisto: 0, valorJaPago: 0, valorEmAtraso: 0, valorVenceHoje: 0 };
    }

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

  // Opções para filtros
  const fornecedorOptions: AutocompleteOption[] = useMemo(() => {
    if (!parcelas?.length || !fornecedores?.length) {
      return [{ value: 'TODOS', label: 'Todos os fornecedores' }];
    }

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
        description: `CPF/CNPJ: ${f!.cpfCnpj}`
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
        description: o.endereco
      }))
    ];
  }, [obras]);

  // Funções de edição otimizadas
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
      // Executa as atualizações em paralelo para melhor performance
      const updates = [
        updateParcelaVencimento(editandoParcela, dadosEdicao.dataVencimento),
        updateParcelaValor(editandoParcela, dadosEdicao.valor)
      ];

      if (dadosEdicao.dataPagamento) {
        updates.push(updateParcelaPagamento(editandoParcela, dadosEdicao.dataPagamento));
      } else {
        updates.push(updateParcelaStatus(editandoParcela, dadosEdicao.status));
      }

      await Promise.all(updates);
      
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
          colorClass="text-primary"
        />
        
        <SummaryCard 
          title="Já Pago"
          value={formatCurrency(resumoValores.valorJaPago)}
          icon={CheckCircle}
          colorClass="text-green-600"
        />
        
        <SummaryCard 
          title="Em Atraso"
          value={formatCurrency(resumoValores.valorEmAtraso)}
          icon={AlertCircle}
          colorClass="text-red-600"
        />

        <SummaryCard 
          title="Vence Hoje"
          value={formatCurrency(resumoValores.valorVenceHoje)}
          icon={DollarSign}
          colorClass="text-orange-600"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filtros.status} onValueChange={value => setFiltros(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
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
              <Label>Fornecedor</Label>
              <Autocomplete
                options={fornecedorOptions}
                value={filtros.fornecedor}
                onValueChange={value => setFiltros(prev => ({ ...prev, fornecedor: value }))}
                placeholder="Selecione um fornecedor"
                searchPlaceholder="Buscar fornecedor..."
                clearable
              />
            </div>

            <div className="space-y-2">
              <Label>Obra</Label>
              <Autocomplete
                options={obraOptions}
                value={filtros.obra}
                onValueChange={value => setFiltros(prev => ({ ...prev, obra: value || 'TODAS' }))}
                placeholder="Selecione uma obra"
                searchPlaceholder="Buscar obra..."
                clearable
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Data</Label>
              <Select value={filtros.dateType} onValueChange={value => setFiltros(prev => ({ ...prev, dateType: value as 'vencimento' | 'pagamento' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vencimento">Data de Vencimento</SelectItem>
                  <SelectItem value="pagamento">Data de Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filtros.startDate ? filtros.startDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filtros.endDate ? filtros.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : undefined }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Parcelas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Parcelas ({parcelasFiltradas.length})</span>
            <Badge variant="outline">
              Total: {formatCurrency(parcelasFiltradas.reduce((sum, p) => sum + p.valor, 0))}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {parcelasFiltradas.length === 0 ? (
            <div className="text-center py-12 px-6 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma parcela encontrada</p>
              <p className="text-sm">Ajuste os filtros para visualizar os dados</p>
            </div>
          ) : isMobile ? (
            <div className="p-6">
              <MobileTable 
                data={parcelasFiltradas}
                onEdit={abrirEdicao}
                onDelete={(item: any) => handleDeleteParcela(item.id, getFornecedorNome(item.fornecedorId), item.numeroParcela)}
                getStatusBadge={(status: ParcelaStatus) => <StatusBadge status={status} />}
                getFornecedorNome={getFornecedorNome}
                type="parcelas"
              />
            </div>
          ) : (
            <VirtualScrollTable
              parcelas={parcelasFiltradas}
              getFornecedorNome={getFornecedorNome}
              onEdit={abrirEdicao}
              onDelete={handleDeleteParcela}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={!!editandoParcela} onOpenChange={(open) => !open && setEditandoParcela(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Parcela
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fornecedor</Label>
              <Input 
                value={editandoParcela ? getFornecedorNome(parcelas.find(p => p.id === editandoParcela)?.fornecedorId || '') : ''} 
                disabled 
                className="bg-muted" 
              />
            </div>

            <div>
              <Label>Valor da Parcela</Label>
              <Input 
                type="number" 
                step="0.01"
                value={dadosEdicao.valor} 
                onChange={e => setDadosEdicao(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <Label>Data de Vencimento</Label>
              <Input 
                type="date" 
                value={dadosEdicao.dataVencimento} 
                onChange={e => setDadosEdicao(prev => ({ ...prev, dataVencimento: e.target.value }))} 
              />
            </div>

            <div>
              <Label>Data de Pagamento</Label>
              <Input 
                type="date" 
                value={dadosEdicao.dataPagamento} 
                onChange={e => setDadosEdicao(prev => ({ ...prev, dataPagamento: e.target.value }))} 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ao definir a data de pagamento, o status será atualizado automaticamente
              </p>
            </div>

            {!dadosEdicao.dataPagamento && (
              <div>
                <Label>Status</Label>
                <Select 
                  value={dadosEdicao.status} 
                  onValueChange={value => setDadosEdicao(prev => ({ ...prev, status: value as ParcelaStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                    <SelectItem value="VENCIDO">Vencido</SelectItem>
                    <SelectItem value="VENCE_HOJE">Vence Hoje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={salvarEdicao} className="flex-1">
                Salvar Alterações
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditandoParcela(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}