import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useObras } from '@/contexts/ObraContext';

export function ObraForm() {
  const { addObra, obras } = useObras();
  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    responsavel: '',
    telefone: '',
    proprietario: '',
    data_inicio: '',
    status: '',
    tipo: '',
    outros_dados: '',
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addObra(form as any);
    setForm({
      nome: '', endereco: '', responsavel: '', telefone: '', proprietario: '', data_inicio: '', status: '', tipo: '', outros_dados: ''
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Obras</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Obra</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone de Contato</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Proprietário</Label>
                <Input value={form.proprietario} onChange={(e) => setForm({ ...form, proprietario: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status da Obra</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                    <SelectItem value="Pausada">Pausada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo da Obra</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Construção">Construção</SelectItem>
                    <SelectItem value="Reforma">Reforma</SelectItem>
                    <SelectItem value="Lote">Lote</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Outros Dados Relevantes</Label>
                <Textarea value={form.outros_dados} onChange={(e) => setForm({ ...form, outros_dados: e.target.value })} rows={3} />
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto">Salvar Obra</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Obras Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {obras.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma obra cadastrada ainda.</p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Código</th>
                    <th className="text-left p-2">Número Único</th>
                    <th className="text-left p-2">Nome</th>
                    <th className="text-left p-2">Endereço</th>
                    <th className="text-left p-2">Responsável</th>
                    <th className="text-left p-2">Telefone</th>
                  </tr>
                </thead>
                <tbody>
                  {obras.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="p-2">{o.codigo}</td>
                      <td className="p-2">{o.numero_unico}</td>
                      <td className="p-2">{o.nome}</td>
                      <td className="p-2">{o.endereco}</td>
                      <td className="p-2">{o.responsavel}</td>
                      <td className="p-2">{o.telefone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
