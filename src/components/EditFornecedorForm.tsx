
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFornecedores } from '@/contexts/FornecedorContext';
import { Fornecedor, FornecedorFormData } from '@/types/fornecedor';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface EditFornecedorFormProps {
  fornecedor: Fornecedor;
  onCancel: () => void;
}

export function EditFornecedorForm({ fornecedor, onCancel }: EditFornecedorFormProps) {
  const { editFornecedor } = useFornecedores();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FornecedorFormData>({
    nome: fornecedor.nome,
    cpfCnpj: fornecedor.cpfCnpj,
    email: fornecedor.email,
    telefone: fornecedor.telefone,
    endereco: fornecedor.endereco,
    tipo: fornecedor.tipo
  });

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

    editFornecedor(fornecedor.id, formData);
    
    toast({
      title: "Sucesso!",
      description: "Fornecedor atualizado com sucesso",
    });
    
    onCancel();
  };

  return (
    <div className="border rounded-lg p-4 bg-muted/20">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">Editando: {fornecedor.nome}</h4>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome / Razão Social *</Label>
            <Input
              id="edit-nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Digite o nome completo ou razão social"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-cpfCnpj">CPF / CNPJ *</Label>
            <Input
              id="edit-cpfCnpj"
              value={formData.cpfCnpj}
              onChange={(e) => setFormData(prev => ({ ...prev, cpfCnpj: e.target.value }))}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-email">E-mail</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-telefone">Telefone</Label>
            <Input
              id="edit-telefone"
              value={formData.telefone}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-9999"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-endereco">Endereço</Label>
          <Textarea
            id="edit-endereco"
            value={formData.endereco}
            onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
            placeholder="Endereço completo"
            rows={3}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" size="sm">
            Salvar Alterações
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
