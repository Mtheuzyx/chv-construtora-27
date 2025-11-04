export interface ObraInfo {
  codigo?: string;
  nome?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

export interface Parcela {
  id: string;
  boletoId: string;
  fornecedorId: string;
  obraId?: string | null;
  numeroParcela: number;
  totalParcelas: number;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: ParcelaStatus;
  observacoes?: string;
  obra?: ObraInfo;
  boletoObservacoes?: string;
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
  valorParcela: number;  // Mudança: valor por parcela ao invés de valor total
  quantidadeParcelas: number;
  dataVencimentoPrimeira: string;
  observacoes?: string;
  obraId?: string | null;
}
