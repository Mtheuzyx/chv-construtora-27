export interface Fornecedor {
  id: string;
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  tipo: 'Fornecedor' | 'Cliente';
  createdAt: string;
}

export interface FornecedorFormData {
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  tipo: 'Fornecedor' | 'Cliente';
}