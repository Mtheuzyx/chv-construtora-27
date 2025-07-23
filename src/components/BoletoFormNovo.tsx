
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFornecedores } from '@/contexts/FornecedorContext';
import { useParcelas } from '@/contexts/ParcelaContext';
import { useToast } from '@/hooks/use-toast';
import { Search, X } from 'lucide-react';
import { formatDocument, formatPhone, cleanDocument } from '@/utils/formatters';

export function BoletoFormNovo() {
  const { fornecedores } = useFornecedores();
  const { criarBoletoComParcelas } = useParcelas();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFornecedor, setSelectedFornecedor] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    formaPagamento: '',
    valorParcela: '',
    quantidadeParcelas: '1',
    dataVencimentoPrimeira: '',
    observacoes: ''
  });

  // Função otimizada para buscar fornecedores com filtro dinâmico usando useMemo
  const buscarFornecedores = useCallback((termo: string) => {
    if (!termo || termo.trim().length === 0) return [];
    
    const termoLower = termo.toLowerCase().trim();
    const termoLimpo = cleanDocument(termo);
    
    return fornecedores.filter(f => {
      // Busca insensível a maiúsculas/minúsculas no nome
      const nomeMatch = f.nome.toLowerCase().includes(termoLower);
      
      // Busca no CPF/CNPJ (com e sem formatação)
      const documentoMatch = f.cpfCnpj.toLowerCase().includes(termoLower) || 
                            cleanDocument(f.cpfCnpj).includes(termoLimpo);
      
      // Busca no email (insensível a maiúsculas/minúsculas)
      const emailMatch = f.email.toLowerCase().includes(termoLower);
      
      // Busca no telefone
      const telefoneMatch = f.telefone && (
        f.telefone.includes(termo) || 
        f.telefone.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
      );
      
      return nomeMatch || documentoMatch || emailMatch || telefoneMatch;
    })
    .sort((a, b) => {
      // Prioriza matches no início do nome
      const aStartsWithName = a.nome.toLowerCase().startsWith(termoLower);
      const bStartsWithName = b.nome.toLowerCase().startsWith(termoLower);
      
      if (aStartsWithName && !bStartsWithName) return -1;
      if (!aStartsWithName && bStartsWithName) return 1;
      
      // Depois ordena alfabeticamente
      return a.nome.localeCompare(b.nome);
    })
    .slice(0, 8); // Limita a 8 resultados para melhor usabilidade
  }, [fornecedores]);

  const fornecedoresFiltrados = useMemo(() => buscarFornecedores(searchTerm), [searchTerm, buscarFornecedores]);
  const fornecedorSelecionado = useMemo(() => fornecedores.find(f => f.id === selectedFornecedor), [fornecedores, selectedFornecedor]);

  // Efeito para controlar o fechamento do dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsInputFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    // Limpa a seleção se o valor for diferente do fornecedor selecionado
    if (selectedFornecedor && value !== fornecedorSelecionado?.nome) {
      setSelectedFornecedor('');
    }
    
    // Mostra dropdown apenas se há texto digitado
    if (value.length > 0) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSelectFornecedor = (fornecedor: any) => {
    setSelectedFornecedor(fornecedor.id);
    setSearchTerm(fornecedor.nome);
    setShowDropdown(false);
    setIsInputFocused(false);
    
    // Remove o foco do input após seleção
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleInputFocus = () => {
    setIsInputFocused(true);
    
    // Só mostra dropdown se há texto digitado
    if (searchTerm.length > 0 && fornecedoresFiltrados.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedFornecedor('');
    setShowDropdown(false);
    setIsInputFocused(false);
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFornecedor) {
      toast({
        title: "Fornecedor obrigatório",
        description: "É necessário selecionar um fornecedor cadastrado",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.formaPagamento || !formData.valorParcela || !formData.dataVencimentoPrimeira) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    criarBoletoComParcelas({
      fornecedorId: selectedFornecedor,
      formaPagamento: formData.formaPagamento,
      valorParcela: parseFloat(formData.valorParcela),
      quantidadeParcelas: parseInt(formData.quantidadeParcelas),
      dataVencimentoPrimeira: formData.dataVencimentoPrimeira,
      observacoes: formData.observacoes
    });
    
    // Reset do formulário
    setSelectedFornecedor('');
    setSearchTerm('');
    setShowDropdown(false);
    setIsInputFocused(false);
    setFormData({
      formaPagamento: '',
      valorParcela: '',
      quantidadeParcelas: '1',
      dataVencimentoPrimeira: '',
      observacoes: ''
    });

    toast({
      title: "Sucesso!",
      description: `Boleto criado com ${formData.quantidadeParcelas} parcela(s)`,
    });
  };

  const valorTotal = formData.valorParcela && formData.quantidadeParcelas 
    ? (parseFloat(formData.valorParcela) * parseInt(formData.quantidadeParcelas)).toFixed(2)
    : '0,00';

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Cadastro de Boletos</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campo de Busca de Fornecedor Otimizado */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Buscar Fornecedor (Nome, CPF ou CNPJ) *
            </Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  className="pl-10 pr-10 h-11"
                  placeholder="Digite nome, CPF, CNPJ ou email para buscar..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={handleInputFocus}
                  autoComplete="off"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {/* Dropdown de Resultados */}
              {showDropdown && searchTerm.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 max-h-64 overflow-y-auto border rounded-md bg-popover shadow-lg z-50 mt-1"
                >
                  {fornecedoresFiltrados.length > 0 ? (
                    fornecedoresFiltrados.map((fornecedor, index) => (
                      <button
                        key={fornecedor.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-accent border-b last:border-b-0 transition-colors focus:bg-accent focus:outline-none"
                        onClick={() => handleSelectFornecedor(fornecedor)}
                      >
                        <div className="font-medium text-foreground">{fornecedor.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDocument(fornecedor.cpfCnpj)} - {fornecedor.tipo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {fornecedor.email} {fornecedor.telefone && `- ${formatPhone(fornecedor.telefone)}`}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-3 text-center text-sm text-muted-foreground bg-muted">
                      Nenhum fornecedor encontrado para "{searchTerm}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fornecedor Selecionado */}
            {fornecedorSelecionado && (
              <div className="p-3 bg-accent rounded-md border">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{fornecedorSelecionado.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDocument(fornecedorSelecionado.cpfCnpj)} - {fornecedorSelecionado.tipo}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Resto do Formulário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="formaPagamento">Forma de Pagamento *</Label>
              <Select value={formData.formaPagamento} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, formaPagamento: value }))
              }>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="TED">TED</SelectItem>
                  <SelectItem value="DOC">DOC</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Depósito">Depósito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valorParcela">Valor por Parcela (R$) *</Label>
              <Input
                id="valorParcela"
                type="number"
                step="0.01"
                className="h-11"
                value={formData.valorParcela}
                onChange={(e) => setFormData(prev => ({ ...prev, valorParcela: e.target.value }))}
                placeholder="0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidadeParcelas">Quantidade de Parcelas *</Label>
              <Select value={formData.quantidadeParcelas} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, quantidadeParcelas: value }))
              }>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataVencimentoPrimeira">Vencimento 1ª Parcela *</Label>
              <Input
                id="dataVencimentoPrimeira"
                type="date"
                className="h-11"
                value={formData.dataVencimentoPrimeira}
                onChange={(e) => setFormData(prev => ({ ...prev, dataVencimentoPrimeira: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Digite observações sobre este boleto (opcional)..."
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Resumo das Parcelas */}
          {formData.valorParcela && formData.quantidadeParcelas && (
            <div className="p-4 bg-accent rounded-md border">
              <div className="text-sm font-medium text-center">
                Resumo: {formData.quantidadeParcelas}x de R$ {formData.valorParcela} = Total: R$ {valorTotal}
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 text-base font-medium" 
            disabled={!selectedFornecedor}
          >
            Criar Boleto com Parcelas
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
