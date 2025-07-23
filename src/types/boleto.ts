export interface Boleto {
  id: string;
  nomeCliente: string;
  cpf: string;
  cidade: string;
  formaPagamento: string;
  dataPagamento?: string;
  dataVencimento: string;
  valor: number;
  parcelas: number;
  valorParcela: number;
  parcelaAtual: number;
  observacoes?: string;
  status: BoletoStatus;
  createdAt: string;
}

export type BoletoStatus = 
  | 'PAGO'
  | 'PAGO_COM_ATRASO'
  | 'VENCIDO'
  | 'AGUARDANDO_PAGAMENTO'
  | 'PRESTES_A_VENCER';

export interface BoletoFormData {
  nomeCliente: string;
  cpf: string;
  cidade: string;
  formaPagamento: string;
  dataPagamento?: string;
  dataVencimento: string;
  valor: string;
  parcelas: string;
  parcelaAtual: string;
  observacoes?: string;
}