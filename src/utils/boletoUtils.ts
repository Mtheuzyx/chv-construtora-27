import { Boleto, BoletoStatus } from '@/types/boleto';

export function calculateBoletoStatus(
  dataVencimento: string,
  dataPagamento?: string
): BoletoStatus {
  const hoje = new Date();
  const vencimento = new Date(dataVencimento);
  
  // Se tem data de pagamento
  if (dataPagamento) {
    const pagamento = new Date(dataPagamento);
    return pagamento <= vencimento ? 'PAGO' : 'PAGO_COM_ATRASO';
  }
  
  // Se não tem data de pagamento
  if (vencimento < hoje) {
    return 'VENCIDO';
  }
  
  // Calcula dias até o vencimento
  const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diasAteVencimento <= 7) {
    return 'PRESTES_A_VENCER';
  }
  
  return 'AGUARDANDO_PAGAMENTO';
}

export function getStatusLabel(status: BoletoStatus, dataVencimento?: string): string {
  if (status === 'PRESTES_A_VENCER' && dataVencimento) {
    const hoje = new Date();
    const vencimento = new Date(dataVencimento);
    const diasAteVencimento = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return `Faltam ${diasAteVencimento} dias`;
  }
  
  const statusLabels: Record<BoletoStatus, string> = {
    PAGO: 'PAGO',
    PAGO_COM_ATRASO: 'PAGO COM ATRASO',
    VENCIDO: 'VENCIDO',
    AGUARDANDO_PAGAMENTO: 'AGUARDANDO PAGAMENTO',
    PRESTES_A_VENCER: 'PRESTES A VENCER'
  };
  
  return statusLabels[status];
}

export function getStatusColor(status: BoletoStatus): string {
  const statusColors: Record<BoletoStatus, string> = {
    PAGO: 'text-success bg-success/10',
    PAGO_COM_ATRASO: 'text-warning bg-warning/10',
    VENCIDO: 'text-destructive bg-destructive/10',
    AGUARDANDO_PAGAMENTO: 'text-info bg-info/10',
    PRESTES_A_VENCER: 'text-warning bg-warning/10'
  };
  
  return statusColors[status];
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}