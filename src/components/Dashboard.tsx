import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useParcelas } from '@/contexts/ParcelaContext';
import { useFornecedores } from '@/contexts/FornecedorContext';
import { TrendingUp, Users, FileText, CreditCard, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';

export function Dashboard() {
  const { parcelas } = useParcelas();
  const { fornecedores } = useFornecedores();
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: ''
  });

  const handleFiltroChange = useCallback((field: string, value: string) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  }, []);

  const dadosFiltrados = useMemo(() => {
    if (!filtros.dataInicio && !filtros.dataFim) return parcelas;
    
    return parcelas.filter(p => {
      const dataVencimento = p.dataVencimento;
      
      if (filtros.dataInicio && dataVencimento < filtros.dataInicio) return false;
      if (filtros.dataFim && dataVencimento > filtros.dataFim) return false;
      
      return true;
    });
  }, [parcelas, filtros.dataInicio, filtros.dataFim]);

  const estatisticas = useMemo(() => {
    const totalFornecedores = fornecedores.length;
    
    // Calcula boletos únicos usando Set para performance
    const boletosUnicos = new Set(dadosFiltrados.map(p => p.boletoId));
    const totalBoletos = boletosUnicos.size;
    
    const totalParcelas = dadosFiltrados.length;
    
    // Calcula valores de forma otimizada
    let valorTotalPrevisto = 0;
    let valorPago = 0;
    let valorEmAtraso = 0;
    let parcelasAguardando = 0;
    let parcelasPagas = 0;
    let parcelasVencidas = 0;
    
    for (const parcela of dadosFiltrados) {
      valorTotalPrevisto += parcela.valor;
      
      switch (parcela.status) {
        case 'PAGO':
        case 'PAGO_COM_ATRASO':
          valorPago += parcela.valor;
          parcelasPagas++;
          break;
        case 'VENCIDO':
          valorEmAtraso += parcela.valor;
          parcelasVencidas++;
          break;
        case 'AGUARDANDO':
        case 'VENCE_HOJE':
          parcelasAguardando++;
          break;
      }
    }

    return {
      totalFornecedores,
      totalBoletos,
      totalParcelas,
      valorTotalPrevisto,
      valorPago,
      valorEmAtraso,
      parcelasAguardando,
      parcelasPagas,
      parcelasVencidas,
      percentualPago: valorTotalPrevisto > 0 ? (valorPago / valorTotalPrevisto) * 100 : 0
    };
  }, [fornecedores.length, dadosFiltrados]);

  const topFornecedores = useMemo(() => {
    // Usa Map para melhor performance ao agrupar por fornecedor
    const fornecedorStatsMap = new Map();
    
    for (const parcela of dadosFiltrados) {
      const fornecedor = fornecedores.find(f => f.id === parcela.fornecedorId);
      if (!fornecedor) continue;
      
      const existing = fornecedorStatsMap.get(parcela.fornecedorId);
      if (existing) {
        existing.valorTotal += parcela.valor;
        existing.quantidadeParcelas++;
      } else {
        fornecedorStatsMap.set(parcela.fornecedorId, {
          ...fornecedor,
          valorTotal: parcela.valor,
          quantidadeParcelas: 1
        });
      }
    }
    
    return Array.from(fornecedorStatsMap.values())
      .filter(f => f.valorTotal > 0)
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5);
  }, [fornecedores, dadosFiltrados]);

  return (
    <div className="space-y-6">
      {/* Filtros por Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Filtros por Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => handleFiltroChange('dataInicio', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => handleFiltroChange('dataFim', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {estatisticas.totalFornecedores}
                </div>
                <div className="text-sm text-muted-foreground">Total de Fornecedores</div>
              </div>
              <Users className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-scale">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {estatisticas.totalBoletos}
                </div>
                <div className="text-sm text-muted-foreground">Boletos Cadastrados</div>
              </div>
              <FileText className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {estatisticas.totalParcelas}
                </div>
                <div className="text-sm text-muted-foreground">Parcelas Cadastradas</div>
              </div>
              <CreditCard className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-primary">
                  {estatisticas.percentualPago.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Taxa de Pagamento</div>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Valores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  R$ {estatisticas.valorTotalPrevisto.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Previsto</div>
              </div>
              <DollarSign className="h-8 w-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  R$ {estatisticas.valorPago.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Já Pago</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  R$ {estatisticas.valorEmAtraso.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Em Atraso</div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Parcelas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {estatisticas.parcelasAguardando}
              </div>
              <Badge variant="secondary" className="mt-2">Aguardando</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {estatisticas.parcelasPagas}
              </div>
              <Badge variant="default" className="mt-2">Pagas</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {estatisticas.parcelasVencidas}
              </div>
              <Badge variant="destructive" className="mt-2">Vencidas</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Fornecedores por Valor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topFornecedores.map((fornecedor, index) => (
              <div key={fornecedor.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{fornecedor.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {fornecedor.cpfCnpj} - {fornecedor.quantidadeParcelas} parcelas
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">
                    R$ {fornecedor.valorTotal.toFixed(2)}
                  </div>
                  <Badge variant={fornecedor.tipo === 'Fornecedor' ? 'secondary' : 'outline'}>
                    {fornecedor.tipo}
                  </Badge>
                </div>
              </div>
            ))}
            {topFornecedores.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Nenhum fornecedor encontrado no período selecionado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
