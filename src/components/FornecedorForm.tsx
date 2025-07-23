
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFornecedores } from '@/contexts/FornecedorContext';
import { FornecedorFormData } from '@/types/fornecedor';
import { useToast } from '@/hooks/use-toast';
import { EditFornecedorForm } from '@/components/EditFornecedorForm';
import { Search, ChevronDown, Edit, Trash2 } from 'lucide-react';

export function FornecedorForm() {
  const { addFornecedor, fornecedores, searchFornecedor, deleteFornecedor } = useFornecedores();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FornecedorFormData>({
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    tipo: 'Fornecedor'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredFornecedores = searchTerm.length >= 2 ? searchFornecedor(searchTerm) : fornecedores;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cpfCnpj) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e CPF/CNPJ são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    addFornecedor(formData);
    
    setFormData({
      nome: '',
      cpfCnpj: '',
      email: '',
      telefone: '',
      endereco: '',
      tipo: 'Fornecedor'
    });

    toast({
      title: "Sucesso!",
      description: "Fornecedor cadastrado com sucesso",
    });
  };

  const handleDelete = (fornecedorId: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o fornecedor "${nome}"?`)) {
      deleteFornecedor(fornecedorId);
      toast({
        title: "Fornecedor excluído!",
        description: `${nome} foi removido com sucesso.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Cadastro de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome / Razão Social *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite o nome completo ou razão social"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF / CNPJ *</Label>
                <Input
                  id="cpfCnpj"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Textarea
                id="endereco"
                value={formData.endereco}
                onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Endereço completo"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full">
              Cadastrar Fornecedor
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <Collapsible open={isListOpen} onOpenChange={setIsListOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>Fornecedores Cadastrados ({fornecedores.length})</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isListOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4">
              {fornecedores.length > 0 && (
                <div className="space-y-2">
                  <Label>Buscar fornecedor</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-10"
                      placeholder="Digite pelo menos 2 caracteres para buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {searchTerm.length > 0 && searchTerm.length < 2 && (
                    <div className="text-sm text-muted-foreground">
                      Digite pelo menos 2 caracteres para buscar fornecedores.
                    </div>
                  )}
                </div>
              )}

              {fornecedores.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum fornecedor cadastrado ainda.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredFornecedores.map(fornecedor => (
                    <div key={fornecedor.id} className="space-y-2">
                      {editingId === fornecedor.id ? (
                        <EditFornecedorForm 
                          fornecedor={fornecedor}
                          onCancel={() => setEditingId(null)}
                        />
                      ) : (
                        <div className="border rounded-lg p-3 bg-background">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{fornecedor.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                {fornecedor.cpfCnpj} - {fornecedor.tipo}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {fornecedor.email} {fornecedor.telefone && `- ${fornecedor.telefone}`}
                              </div>
                              {fornecedor.endereco && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {fornecedor.endereco}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setEditingId(fornecedor.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDelete(fornecedor.id, fornecedor.nome)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {searchTerm.length >= 2 && filteredFornecedores.length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      Nenhum fornecedor encontrado com "{searchTerm}".
                    </div>
                  )}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}
