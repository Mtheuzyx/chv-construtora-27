
import React, { useState, useMemo } from 'react';
import { useBoletos } from '@/contexts/BoletoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate, getStatusLabel, getStatusColor } from '@/utils/boletoUtils';
import EditPaymentDate from '@/components/EditPaymentDate';
import { Search } from 'lucide-react';

export default function BoletoTable() {
  const { boletos } = useBoletos();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  const filteredBoletos = useMemo(() => {
    return boletos.filter(boleto => {
      const matchesSearch = boleto.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           boleto.cpf.includes(searchTerm) ||
                           boleto.cidade.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || boleto.status === statusFilter;
      const matchesCity = cityFilter === 'all' || boleto.cidade === cityFilter;
      const matchesPayment = paymentFilter === 'all' || boleto.formaPagamento === paymentFilter;

      return matchesSearch && matchesStatus && matchesCity && matchesPayment;
    });
  }, [boletos, searchTerm, statusFilter, cityFilter, paymentFilter]);

  const uniqueCities = [...new Set(boletos.map(b => b.cidade))];
  const uniquePayments = [...new Set(boletos.map(b => b.formaPagamento))];

  return (
    <Card className="max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Controle de Boletos</CardTitle>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="PAGO">Pago</SelectItem>
              <SelectItem value="PAGO_COM_ATRASO">Pago com Atraso</SelectItem>
              <SelectItem value="VENCIDO">Vencido</SelectItem>
              <SelectItem value="PRESTES_A_VENCER">Prestes a Vencer</SelectItem>
              <SelectItem value="AGUARDANDO_PAGAMENTO">Aguardando Pagamento</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Cidades</SelectItem>
              {uniqueCities.map(city => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Formas</SelectItem>
              {uniquePayments.map(payment => (
                <SelectItem key={payment} value={payment}>{payment}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Forma de Pagamento</TableHead>
                <TableHead>Data Vencimento</TableHead>
                <TableHead>Data Pagamento</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead className="text-center">Parcela Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                <TableHead className="w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBoletos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    {boletos.length === 0 ? 'Nenhum boleto cadastrado ainda.' : 'Nenhum boleto encontrado com os filtros aplicados.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBoletos.map((boleto) => (
                  <TableRow key={boleto.id}>
                    <TableCell className="font-medium">{boleto.nomeCliente}</TableCell>
                    <TableCell>{boleto.cpf}</TableCell>
                    <TableCell>{boleto.cidade}</TableCell>
                    <TableCell className="capitalize">{boleto.formaPagamento}</TableCell>
                    <TableCell>{formatDate(boleto.dataVencimento)}</TableCell>
                    <TableCell>{boleto.dataPagamento ? formatDate(boleto.dataPagamento) : '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{formatCurrency(boleto.valor)}</div>
                        <div className="text-xs text-muted-foreground">
                          {boleto.parcelas}x de {formatCurrency(boleto.valorParcela)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="bg-accent/50 border-accent font-medium">
                        Parcela {boleto.parcelaAtual}/{boleto.parcelas}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(boleto.status, boleto.dataVencimento)} variant="secondary">
                        {getStatusLabel(boleto.status, boleto.dataVencimento)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {boleto.observacoes ?? ''}
                    </TableCell>
                    <TableCell>
                      <EditPaymentDate boleto={boleto} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          Mostrando {filteredBoletos.length} de {boletos.length} boletos
        </div>
      </CardContent>
    </Card>
  );
}
