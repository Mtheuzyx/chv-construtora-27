import { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useParcelas } from '@/contexts/ParcelaContext';
import { useFornecedores } from '@/contexts/FornecedorContext';
import { TrendingUp, Users, FileText, CreditCard, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';

export function Dashboard() {
  const { parcelas, loading } = useParcelas();
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

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton type="filters" count={1} />
        <LoadingSkeleton type="cards" count={4} />
        <LoadingSkeleton type="cards" count={3} />
        <LoadingSkeleton type="cards" count={3} />
        <LoadingSkeleton type="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filtros por Período */}
      <Card className="hover-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
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
        <Card className="hover-lift animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  {estatisticas.totalFornecedores}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Total de Fornecedores
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  {estatisticas.totalBoletos}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Boletos Cadastrados
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  {estatisticas.totalParcelas}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  Parcelas Cadastradas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {estatisticas.percentualPago.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Taxa de Pagamento
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Valores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover-lift animate-slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  {formatCurrency(estatisticas.valorTotalPrevisto)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Total Previsto
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {formatCurrency(estatisticas.valorPago)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Já Pago
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  {formatCurrency(estatisticas.valorEmAtraso)}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Em Atraso
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status das Parcelas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover-lift animate-slide-up">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                {estatisticas.parcelasAguardando}
              </div>
              <Badge variant="secondary" className="mt-2 hover-lift">Aguardando</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {estatisticas.parcelasPagas}
              </div>
              <Badge variant="default" className="mt-2 hover-lift">Pagas</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                {estatisticas.parcelasVencidas}
              </div>
              <Badge variant="destructive" className="mt-2 hover-lift">Vencidas</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Fornecedores */}
      <Card className="hover-glow animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Top 5 Fornecedores por Valor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topFornecedores.map((fornecedor, index) => (
              <div key={fornecedor.id} className="flex items-center justify-between p-4 border rounded-lg hover-lift fast-transition animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="hover-lift">#{index + 1}</Badge>
                  <div>
                    <div className="font-medium">{fornecedor.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {fornecedor.cpfCnpj} - {fornecedor.quantidadeParcelas} parcelas
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    {formatCurrency(fornecedor.valorTotal)}
                  </div>
                  <Badge variant={fornecedor.tipo === 'Fornecedor' ? 'secondary' : 'outline'} className="hover-lift">
                    {fornecedor.tipo}
                  </Badge>
                </div>
              </div>
            ))}
            {topFornecedores.length === 0 && (
              <div className="text-center text-muted-foreground py-12 animate-fade-in">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhum fornecedor encontrado</p>
                <p className="text-sm">Ajuste os filtros para visualizar os dados</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
