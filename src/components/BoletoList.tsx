import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useObras } from '@/contexts/ObraContext';
import { useParcelas } from '@/contexts/ParcelaContext';
import { VirtualizedTable } from '@/components/VirtualizedTable';

interface BoletoRow {
  id: string;
  fornecedor_id: string;
  forma_pagamento: string;
  valor_total: number;
  quantidade_parcelas: number;
  vencimento_primeira: string;
  observacoes?: string;
  obra_id?: string | null;
  obras?: {
    codigo: string;
    numero_unico: string;
    nome: string;
    endereco?: string;
    responsavel?: string;
  } | null;
}

export function BoletoList() {
  const { obras } = useObras();
  const { parcelas, loading } = useParcelas();
  const [obraFilter, setObraFilter] = useState<string>('TODAS');
  const [search, setSearch] = useState('');

  // Agrupar parcelas por boleto para criar a lista de boletos
  const boletos = useMemo(() => {
    const boletosMap = new Map<string, BoletoRow>();
    
    parcelas.forEach(parcela => {
      if (!boletosMap.has(parcela.boletoId)) {
        boletosMap.set(parcela.boletoId, {
          id: parcela.boletoId,
          fornecedor_id: parcela.fornecedorId,
          forma_pagamento: 'Boleto',
          valor_total: parcela.valor * parcela.totalParcelas,
          quantidade_parcelas: parcela.totalParcelas,
          vencimento_primeira: parcela.dataVencimento,
          observacoes: parcela.boletoObservacoes,
          obra_id: parcela.obraId || null,
          obras: parcela.obra ? {
            codigo: parcela.obra.codigo,
            numero_unico: parcela.obra.codigo,
            nome: parcela.obra.nome,
            endereco: parcela.obra.endereco,
            responsavel: undefined
          } : null
        });
      }
    });
    
    return Array.from(boletosMap.values());
  }, [parcelas]);

  const filtered = useMemo(() => {
    return boletos.filter((b) => {
      const byObra = obraFilter === 'TODAS' || b.obra_id === obraFilter;
      const byText = search
        ? [b.observacoes || '', b.obras?.nome || '', b.obras?.endereco || '', b.obras?.codigo || '', b.obras?.numero_unico || '']
            .join(' ').toLowerCase().includes(search.toLowerCase())
        : true;
      return byObra && byText;
    });
  }, [boletos, obraFilter, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Boletos cadastrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm">Filtrar por obra</label>
            <Select value={obraFilter} onValueChange={setObraFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as obras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as obras</SelectItem>
                {obras.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.codigo} - {o.nome}{o.endereco ? ` - ${o.endereco}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm">Busca (obra, endereço, observações)</label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Digite para buscar..." />
          </div>
        </div>

<div className="rounded-md border overflow-auto" style={{ maxHeight: '60vh' }}>
  {filtered.length > 50 ? (
    <VirtualizedTable
      data={filtered}
      rowHeight={56}
      containerHeight={Math.min(window.innerHeight * 0.6, 700)}
      keyExtractor={(b) => b.id}
      headers={
        <TableRow>
          <TableHead className="sticky top-0 bg-background">Número da Obra</TableHead>
          <TableHead className="sticky top-0 bg-background">Nome / Endereço</TableHead>
          <TableHead className="sticky top-0 bg-background">Responsável</TableHead>
          <TableHead className="sticky top-0 bg-background">Forma</TableHead>
          <TableHead className="sticky top-0 bg-background">Parcelas</TableHead>
          <TableHead className="sticky top-0 bg-background">Venc. 1ª</TableHead>
        </TableRow>
      }
      renderRow={(b) => (
        <>
          <TableCell>{b.obras?.codigo || '-'}</TableCell>
          <TableCell>
            <div className="font-medium">{b.obras?.nome || '-'}</div>
            <div className="text-xs text-muted-foreground">{b.obras?.endereco || '-'}</div>
          </TableCell>
          <TableCell>{b.obras?.responsavel || '-'}</TableCell>
          <TableCell>{b.forma_pagamento}</TableCell>
          <TableCell>{b.quantidade_parcelas}</TableCell>
          <TableCell>{new Date(b.vencimento_primeira + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
        </>
      )}
    />
  ) : (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="sticky top-0 bg-background">Número da Obra</TableHead>
          <TableHead className="sticky top-0 bg-background">Nome / Endereço</TableHead>
          <TableHead className="sticky top-0 bg-background">Responsável</TableHead>
          <TableHead className="sticky top-0 bg-background">Forma</TableHead>
          <TableHead className="sticky top-0 bg-background">Parcelas</TableHead>
          <TableHead className="sticky top-0 bg-background">Venc. 1ª</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow><TableCell colSpan={6}>Carregando...</TableCell></TableRow>
        ) : filtered.length === 0 ? (
          <TableRow><TableCell colSpan={6}>Nenhum boleto encontrado.</TableCell></TableRow>
        ) : (
          filtered.map((b) => (
            <TableRow key={b.id}>
              <TableCell>{b.obras?.codigo || '-'}</TableCell>
              <TableCell>
                <div className="font-medium">{b.obras?.nome || '-'}</div>
                <div className="text-xs text-muted-foreground">{b.obras?.endereco || '-'}</div>
              </TableCell>
              <TableCell>{b.obras?.responsavel || '-'}</TableCell>
              <TableCell>{b.forma_pagamento}</TableCell>
              <TableCell>{b.quantidade_parcelas}</TableCell>
              <TableCell>{new Date(b.vencimento_primeira + 'T00:00:00').toLocaleDateString('pt-BR')}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )}
</div>
      </CardContent>
    </Card>
  );
}
