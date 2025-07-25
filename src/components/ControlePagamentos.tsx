import { useState, useMemo, useCallback } from 'react';
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
import { Filter, Edit, Trash2 } from 'lucide-react';
import { ParcelaStatus } from '@/types/parcela';
import { useToast } from '@/hooks/use-toast';
import { CalendarFilter } from '@/components/CalendarFilter';
import { formatCurrency } from '@/utils/formatters';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MobileTable } from '@/components/MobileTable';

export function ControlePagamentos() {
  const { isMobile } = useScreenSize();
  const {
    parcelas,
    updateParcelaPagamento,
    updateParcelaVencimento,
    updateParcelaValor,
    updateParcelaStatus,
    deleteParcela
  } = useParcelas();
  const { fornecedores } = useFornecedores();
  const { toast } = useToast();

  const [filtros, setFiltros] = useState({
    status: 'TODOS',
    fornecedor: 'TODOS',
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

  const getStatusBadge = useCallback((status: ParcelaStatus) => {
    const statusConfig = {
      AGUARDANDO: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
        label: 'Aguardando'
      },
      PAGO: {
        className: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
        label: 'Pago'
      },
      PAGO_COM_ATRASO: {
        className: 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200',
        label: 'Pago c/ Atraso'
      },
      VENCIDO: {
        className: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
        label: 'Vencido'
      },
      VENCE_HOJE: {
        className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200',
        label: 'Vence Hoje'
      }
    };
    const config = statusConfig[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  }, []);

  // Memoiza mapeamento de fornecedores para evitar buscas repetitivas
  const fornecedorMap = useMemo(() => {
    const map = new Map();
    fornecedores.forEach(f => map.set(f.id, f.nome));
    return map;
  }, [fornecedores]);

  // Opções para o autocomplete de fornecedores
  const fornecedorOptions = useMemo<AutocompleteOption[]>(() => [
    { value: 'TODOS', label: 'Todos os fornecedores' },
    ...fornecedores.map(fornecedor => ({
      value: fornecedor.id,
      label: fornecedor.nome,
      description: `${fornecedor.cpfCnpj} - ${fornecedor.tipo}`
    }))
  ], [fornecedores]);

  const getFornecedorNome = useCallback((fornecedorId: string) => {
    return fornecedorMap.get(fornecedorId) || 'Não encontrado';
  }, [fornecedorMap]);

  const parcelasFiltradas = useMemo(() => {
    return parcelas.filter(parcela => {
      if (filtros.status !== 'TODOS' && parcela.status !== filtros.status) return false;
      if (filtros.fornecedor !== 'TODOS' && parcela.fornecedorId !== filtros.fornecedor) return false;
      
      // Filtro por data otimizado
      if (filtros.startDate || filtros.endDate) {
        const dataVencimento = new Date(parcela.dataVencimento + 'T00:00:00');
        
        if (filtros.startDate) {
          const startDateNormalized = new Date(filtros.startDate);
          startDateNormalized.setHours(0, 0, 0, 0);
          if (dataVencimento < startDateNormalized) return false;
        }
        
        if (filtros.endDate) {
          const endDateNormalized = new Date(filtros.endDate);
          endDateNormalized.setHours(23, 59, 59, 999);
          if (dataVencimento > endDateNormalized) return false;
        }
      }
      
      return true;
    });
  }, [parcelas, filtros]);

  // Calcula resumo de forma otimizada
  const resumoValores = useMemo(() => {
    let valorTotalPrevisto = 0;
    let valorJaPago = 0;
    let valorEmAtraso = 0;
    let valorVenceHoje = 0;

    for (const parcela of parcelas) {
      valorTotalPrevisto += parcela.valor;
      
      switch (parcela.status) {
        case 'PAGO':
        case 'PAGO_COM_ATRASO':
          valorJaPago += parcela.valor;
          break;
        case 'VENCIDO':
          valorEmAtraso += parcela.valor;
          break;
        case 'VENCE_HOJE':
          valorVenceHoje += parcela.valor;
          break;
      }
    }

    return {
      valorTotalPrevisto,
      valorJaPago,
      valorEmAtraso,
      valorVenceHoje
    };
  }, [parcelas]);

  const abrirEdicao = (parcela: any) => {
    setEditandoParcela(parcela.id);
    setDadosEdicao({
      dataVencimento: parcela.dataVencimento,
      dataPagamento: parcela.dataPagamento || '',
      valor: parcela.valor,
      status: parcela.status
    });
  };

  const salvarEdicao = async () => {
    if (!editandoParcela) return;
    
    try {
      // Atualizar vencimento
      await updateParcelaVencimento(editandoParcela, dadosEdicao.dataVencimento);
      
      // Atualizar valor
      await updateParcelaValor(editandoParcela, dadosEdicao.valor);
      
      // Atualizar pagamento ou status
      if (dadosEdicao.dataPagamento) {
        await updateParcelaPagamento(editandoParcela, dadosEdicao.dataPagamento);
      } else {
        await updateParcelaStatus(editandoParcela, dadosEdicao.status);
      }
      
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
  };

  const handleDeleteParcela = (parcelaId: string, fornecedorNome: string, numeroParcela: number) => {
    if (window.confirm(`Tem certeza que deseja excluir a parcela ${numeroParcela} do fornecedor ${fornecedorNome}?`)) {
      deleteParcela(parcelaId);
      toast({
        title: "Parcela excluída!",
        description: "A parcela foi removida com sucesso."
      });
    }
  };

  const handleCalendarFilter = (calendarFilters: {
    startDate?: Date;
    endDate?: Date;
    dateType: 'vencimento' | 'pagamento';
  }) => {
    setFiltros(prev => ({
      ...prev,
      ...calendarFilters
    }));
  };

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(resumoValores.valorTotalPrevisto)}
            </div>
            <div className="text-sm text-muted-foreground">Total Previsto</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(resumoValores.valorJaPago)}
            </div>
            <div className="text-sm text-muted-foreground">Já Pago</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(resumoValores.valorEmAtraso)}
            </div>
            <div className="text-sm text-muted-foreground">Em Atraso</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(resumoValores.valorVenceHoje)}
            </div>
            <div className="text-sm text-muted-foreground">Vence Hoje</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={filtros.status} onValueChange={value => setFiltros(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="PAGO_COM_ATRASO">Pago c/ Atraso</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="VENCE_HOJE">Vence Hoje</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fornecedor</Label>
              <Autocomplete
                options={fornecedorOptions}
                value={filtros.fornecedor}
                onValueChange={value => setFiltros(prev => ({ ...prev, fornecedor: value }))}
                placeholder="Buscar fornecedor..."
                searchPlaceholder="Digite o nome do fornecedor..."
                emptyText="Nenhum fornecedor encontrado"
                clearable={filtros.fornecedor !== 'TODOS'}
              />
            </div>
          </div>

          <CalendarFilter onFilterChange={handleCalendarFilter} />
        </CardContent>
      </Card>

      {/* Tabela de Parcelas - Responsiva */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Parcelas ({parcelasFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isMobile ? (
            // Mobile Layout
            <MobileTable
              data={parcelasFiltradas.map(parcela => ({
                ...parcela,
                fornecedorNome: getFornecedorNome(parcela.fornecedorId)
              }))}
              onEdit={abrirEdicao}
              onDelete={(item) => handleDeleteParcela(item.id, item.fornecedorNome, item.numeroParcela)}
              getStatusBadge={getStatusBadge}
              type="parcelas"
            />
          ) : (
            // Desktop Layout
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data Pagamento</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelasFiltradas.map(parcela => (
                    <TableRow key={parcela.id}>
                      <TableCell className="font-medium">
                        {getFornecedorNome(parcela.fornecedorId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {parcela.numeroParcela}/{parcela.totalParcelas}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(parcela.valor)}</TableCell>
                      <TableCell>
                        {new Date(parcela.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(parcela.status)}
                      </TableCell>
                      <TableCell>
                        {parcela.dataPagamento ? new Date(parcela.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR') : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {parcela.observacoes ? (
                          <span className="text-sm text-muted-foreground max-w-xs truncate" title={parcela.observacoes}>
                            {parcela.observacoes}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => abrirEdicao(parcela)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
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
                                  <Input value={getFornecedorNome(parcela.fornecedorId)} disabled className="bg-muted" />
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
                                  <Input type="date" value={dadosEdicao.dataVencimento} onChange={e => setDadosEdicao(prev => ({ ...prev, dataVencimento: e.target.value }))} />
                                </div>

                                <div>
                                  <Label>Data de Pagamento</Label>
                                  <Input type="date" value={dadosEdicao.dataPagamento} onChange={e => setDadosEdicao(prev => ({ ...prev, dataPagamento: e.target.value }))} />
                                </div>

                                <div>
                                  <Label>Status</Label>
                                  <Select 
                                    value={dadosEdicao.status} 
                                    onValueChange={value => setDadosEdicao(prev => ({ ...prev, status: value as ParcelaStatus }))}
                                    disabled={!dadosEdicao.dataPagamento}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {dadosEdicao.dataPagamento ? (
                                        <>
                                          <SelectItem value="PAGO">Pago</SelectItem>
                                          <SelectItem value="PAGO_COM_ATRASO">Pago c/ Atraso</SelectItem>
                                        </>
                                      ) : (
                                        <>
                                          <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                                          <SelectItem value="VENCIDO">Vencido</SelectItem>
                                          <SelectItem value="VENCE_HOJE">Vence Hoje</SelectItem>
                                        </>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  {!dadosEdicao.dataPagamento && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Status é atualizado automaticamente. Para alterar manualmente, registre o pagamento primeiro.
                                    </p>
                                  )}
                                </div>

                                <div className="flex gap-2 pt-2">
                                  <Button onClick={salvarEdicao} className="flex-1">
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
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição para Mobile */}
      {isMobile && editandoParcela && (
        <Dialog open={!!editandoParcela} onOpenChange={() => setEditandoParcela(null)}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                  value={parcelasFiltradas.find(p => p.id === editandoParcela) 
                    ? getFornecedorNome(parcelasFiltradas.find(p => p.id === editandoParcela)!.fornecedorId) 
                    : ''} 
                  disabled 
                  className="bg-muted" 
                />
              </div>

              <div>
                <Label>Valor</Label>
                <Input 
                  value={parcelasFiltradas.find(p => p.id === editandoParcela) 
                    ? formatCurrency(parcelasFiltradas.find(p => p.id === editandoParcela)!.valor) 
                    : ''} 
                  disabled 
                  className="bg-muted" 
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
              </div>

              <div>
                <Label>Status</Label>
                <Select 
                  value={dadosEdicao.status} 
                  onValueChange={value => setDadosEdicao(prev => ({ ...prev, status: value as ParcelaStatus }))}
                  disabled={!dadosEdicao.dataPagamento}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dadosEdicao.dataPagamento ? (
                      <>
                        <SelectItem value="PAGO">Pago</SelectItem>
                        <SelectItem value="PAGO_COM_ATRASO">Pago c/ Atraso</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                        <SelectItem value="VENCIDO">Vencido</SelectItem>
                        <SelectItem value="VENCE_HOJE">Vence Hoje</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {!dadosEdicao.dataPagamento && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Status é atualizado automaticamente. Para alterar manualmente, registre o pagamento primeiro.
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={salvarEdicao} className="flex-1">
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
