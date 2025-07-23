
export interface Parcela {
  id: string;
  boletoId: string;
  fornecedorId: string;
  numeroParcela: number;
  totalParcelas: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: ParcelaStatus;
  observacoes?: string;
  createdAt: string;
}

export type ParcelaStatus = 
  | 'AGUARDANDO'
  | 'PAGO'
  | 'PAGO_COM_ATRASO'
  | 'VENCIDO'
  | 'VENCE_HOJE';

export interface NovoBoletoParcelas {
  fornecedorId: string;
  formaPagamento: string;
  valorTotal: number;
  quantidadeParcelas: number;
  dataVencimentoPrimeira: string;
  observacoes?: string;
}
