import React, { memo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { OptimizedStatusBadge } from '@/components/OptimizedStatusBadge';
import { ParcelaStatus } from '@/types/parcela';

interface CompactTableProps {
  data: any[];
  getFornecedorNome: (id: string) => string;
  abrirEdicao: (parcela: any) => void;
  handleDeleteParcela: (id: string, nome: string, numero: number) => void;
  dadosEdicao: any;
  setDadosEdicao: (fn: (prev: any) => any) => void;
  salvarEdicao: () => void;
  onViewDetails: (parcela: any) => void;
}

export const CompactTable = memo(({ 
  data, 
  getFornecedorNome, 
  abrirEdicao, 
  handleDeleteParcela,
  dadosEdicao,
  setDadosEdicao,
  salvarEdicao,
  onViewDetails
}: CompactTableProps) => {
  // Função segura para formatar data
  const formatDate = useCallback((dateString: string) => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString + 'T00:00:00');
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return '-';
    }
  }, []);

  // Função segura para obter nome do fornecedor
  const getFornecedorNomeSafe = useCallback((fornecedorId: string) => {
    try {
      return getFornecedorNome(fornecedorId);
    } catch (error) {
      console.error('Erro ao buscar nome do fornecedor:', error);
      return 'Erro ao carregar';
    }
  }, [getFornecedorNome]);

  // Função segura para formatar valor
  const formatValorSafe = useCallback((valor: number) => {
    try {
      if (typeof valor !== 'number' || isNaN(valor)) return 'R$ 0,00';
      return formatCurrency(valor);
    } catch (error) {
      console.error('Erro ao formatar valor:', error);
      return 'R$ 0,00';
    }
  }, []);

  return (
    <div className="overflow-auto scroll-container">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
          <TableRow className="h-10">
            <TableHead className="w-40 text-xs p-2">Fornecedor</TableHead>
            <TableHead className="w-20 text-xs p-2">Parcela</TableHead>
            <TableHead className="w-24 text-xs p-2">Valor</TableHead>
            <TableHead className="w-28 text-xs p-2">Vencimento</TableHead>
            <TableHead className="w-28 text-xs p-2">Pagamento</TableHead>
            <TableHead className="w-24 text-xs p-2">Status</TableHead>
            <TableHead className="w-28 text-xs p-2">Observações</TableHead>
            <TableHead className="w-20 text-xs p-2">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((parcela, index) => {
            try {
              return (
                <TableRow key={parcela.id || index} className="hover:bg-muted/50 fast-transition h-10">
                  <TableCell className="font-medium text-xs p-2 truncate">
                    {getFornecedorNomeSafe(parcela.fornecedorId)}
                  </TableCell>
                  <TableCell className="p-2">
                    <span className="inline-flex items-center rounded-full bg-secondary px-1 py-0 h-5 text-xs font-medium text-secondary-foreground" title={`Parcela ${parcela.numeroParcela} de ${parcela.totalParcelas}`}>
                      Parcela {parcela.numeroParcela}/{parcela.totalParcelas}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-xs p-2">
                    {formatValorSafe(parcela.valor)}
                  </TableCell>
                  <TableCell className="text-xs p-2">
                    {formatDate(parcela.dataVencimento)}
                  </TableCell>
                  <TableCell className="text-xs p-2">
                    {formatDate(parcela.dataPagamento)}
                  </TableCell>
                  <TableCell className="p-2">
                    <OptimizedStatusBadge status={parcela.status} size="sm" />
                  </TableCell>
                  <TableCell className="p-2">
                    {(parcela.observacoes || parcela.boletoObservacoes) ? (
                      <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => onViewDetails(parcela)}>
                        Observações
                      </Button>
                    ) : null}
                  </TableCell>
                  <TableCell className="p-2">
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => abrirEdicao(parcela)} className="h-6 w-6 p-0">
                            <Edit className="h-3 w-3" />
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
                              <Input value={getFornecedorNomeSafe(parcela.fornecedorId)} disabled className="bg-muted" />
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
                        onClick={() => handleDeleteParcela(parcela.id, getFornecedorNomeSafe(parcela.fornecedorId), parcela.numeroParcela)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            } catch (error) {
              console.error('Erro ao renderizar linha da tabela:', error);
              return (
                <TableRow key={`error-${index}`} className="h-10">
                  <TableCell colSpan={8} className="text-center text-red-500 text-xs p-2">
                    Erro ao carregar dados desta linha
                  </TableCell>
                </TableRow>
              );
            }
          })}
        </TableBody>
      </Table>
    </div>
  );
});

CompactTable.displayName = 'CompactTable';