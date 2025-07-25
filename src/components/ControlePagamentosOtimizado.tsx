import React, { useState, useMemo, useCallback, memo } from 'react';
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
import { Filter, Edit, Trash2, Info } from 'lucide-react';
import { ParcelaStatus } from '@/types/parcela';
import { useToast } from '@/hooks/use-toast';
import { CalendarFilter } from '@/components/CalendarFilter';
import { formatCurrency } from '@/utils/formatters';
import { useScreenSize } from '@/hooks/useScreenSize';
import { MobileTable } from '@/components/MobileTable';
import { VirtualizedTable } from '@/components/VirtualizedTable';

const StatusBadge = memo(({ status }: { status: ParcelaStatus }) => {
  const config = {
    AGUARDANDO: { variant: 'secondary' as const, text: 'Aguardando', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    VENCE_HOJE: { variant: 'default' as const, text: 'Vence Hoje', className: 'bg-blue-100 text-blue-800 border-blue-300' },
    VENCIDO: { variant: 'destructive' as const, text: 'Vencido', className: 'bg-red-100 text-red-800 border-red-300' },
    PAGO: { variant: 'default' as const, text: 'Pago', className: 'bg-green-100 text-green-800 border-green-300' },
    PAGO_COM_ATRASO: { variant: 'secondary' as const, text: 'Pago c/ Atraso', className: 'bg-orange-100 text-orange-800 border-orange-300' }
  };

  const statusInfo = config[status] || config.AGUARDANDO;
  
  return (
    <Badge variant={statusInfo.variant} className={statusInfo.className}>
      {statusInfo.text}
    </Badge>
  );
});

StatusBadge.displayName = 'StatusBadge';

export function ControlePagamentosOtimizado() {
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

  const getFornecedorNome = useCallback((fornecedorId: string) => {
    const fornecedor = fornecedores.find(f => f.id === fornecedorId);
    return fornecedor ? fornecedor.nome : 'Fornecedor não encontrado';
  }, [fornecedores]);

  const parcelasFiltradas = useMemo(() => {
    return parcelas.filter(parcela => {
      // Filtro por status
      if (filtros.status !== 'TODOS' && parcela.status !== filtros.status) {
        return false;
      }

      // Filtro por fornecedor
      if (filtros.fornecedor !== 'TODOS' && parcela.fornecedorId !== filtros.fornecedor) {
        return false;
      }

      // Filtro por data
      if (filtros.startDate || filtros.endDate) {
        const dataComparacao = filtros.dateType === 'vencimento' 
          ? new Date(parcela.dataVencimento + 'T00:00:00')
          : parcela.dataPagamento 
            ? new Date(parcela.dataPagamento + 'T00:00:00')
            : null;

        if (!dataComparacao && filtros.dateType === 'pagamento') {
          return false;
        }

        if (filtros.startDate && dataComparacao && dataComparacao < filtros.startDate) {
          return false;
        }

        if (filtros.endDate && dataComparacao && dataComparacao > filtros.endDate) {
          return false;
        }
      }

      return true;
    });
  }, [parcelas, filtros, getFornecedorNome]);

  // Calcula resumo de valores otimizado
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

  const fornecedorOptions: AutocompleteOption[] = useMemo(() => {
    const uniqueFornecedores = Array.from(
      new Set(parcelas.map(p => p.fornecedorId))
    ).map(fornecedorId => {
      const fornecedor = fornecedores.find(f => f.id === fornecedorId);
      return fornecedor;
    }).filter(Boolean);

    console.log('Fornecedores únicos encontrados:', uniqueFornecedores.map(f => f?.nome));
    console.log('Total de parcelas:', parcelas.length);
    console.log('Total de fornecedores cadastrados:', fornecedores.length);

    const options = [
      { value: 'TODOS', label: 'Todos os fornecedores' },
      ...uniqueFornecedores.map(f => ({ 
        value: f!.id, 
        label: f!.nome,
        description: `ID: ${f!.id.slice(0, 8)}...`
      }))
    ];

    console.log('Opções geradas:', options);
    return options;
  }, [parcelas, fornecedores]);

  return (
    <div className="space-y-6">
      {/* Resumo de Indicadores */}
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

      {/* Info sobre Parcelas */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <Info className="h-4 w-4" />
            <span className="text-sm font-medium">
              Cada linha representa uma parcela individual. Boletos com múltiplas parcelas aparecem em várias linhas.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Card de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Parcelas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <CardContent>
          {parcelasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma parcela encontrada com os filtros aplicados.
            </div>
          ) : isMobile ? (
            <MobileTable 
              data={parcelasFiltradas}
              onEdit={abrirEdicao}
              onDelete={(item: any) => handleDeleteParcela(item.id, getFornecedorNome(item.fornecedorId), item.numeroParcela)}
              getStatusBadge={(status: ParcelaStatus) => <StatusBadge status={status} />}
              getFornecedorNome={getFornecedorNome}
              type="parcelas"
            />
          ) : parcelasFiltradas.length > 100 ? (
            <VirtualizedTable
              data={parcelasFiltradas}
              rowHeight={60}
              containerHeight={600}
              keyExtractor={(item) => item.id}
              headers={
                <TableRow>
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
                    <Badge variant="secondary" className="text-xs">
                      {parcela.numeroParcela}ª de {parcela.totalParcelas}
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
                  <TableCell>
                    {parcela.observacoes ? (
                      <span className="text-sm text-muted-foreground">
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
                </>
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Fornecedor</TableHead>
                    <TableHead className="w-24">Parcela</TableHead>
                    <TableHead className="w-20">Valor</TableHead>
                    <TableHead className="w-28">Vencimento</TableHead>
                    <TableHead className="w-28">Pagamento</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead className="w-32">Observações</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelasFiltradas.map((parcela) => (
                    <TableRow key={parcela.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {getFornecedorNome(parcela.fornecedorId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {parcela.numeroParcela}ª de {parcela.totalParcelas}
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
                      <TableCell>
                        {parcela.observacoes ? (
                          <span className="text-sm text-muted-foreground">
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
    </div>
  );
}