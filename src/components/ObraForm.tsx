import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useObras } from '@/contexts/ObraContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function ObraForm() {
  const { addObra, obras, updateObra, deleteObra, loading } = useObras();
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

  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    endereco: '',
    responsavel: '',
    telefone: '',
    proprietario: '',
    data_inicio: '',
    status: '',
    tipo: '',
    outros_dados: ''
  });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

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
                    <th className="text-left p-2 w-32">Ações</th>
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
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditing(o);
                              setEditForm({
                                nome: o.nome || '',
                                endereco: o.endereco || '',
                                responsavel: o.responsavel || '',
                                telefone: o.telefone || '',
                                proprietario: o.proprietario || '',
                                data_inicio: (o.data_inicio as any) || '',
                                status: o.status || '',
                                tipo: o.tipo || '',
                                outros_dados: o.outros_dados || ''
                              });
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteTarget(o)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editar Obra */}
      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Obra</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Obra</Label>
              <Input value={editForm.nome} onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={editForm.responsavel} onChange={(e) => setEditForm({ ...editForm, responsavel: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={editForm.telefone} onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Proprietário</Label>
              <Input value={editForm.proprietario} onChange={(e) => setEditForm({ ...editForm, proprietario: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input value={editForm.endereco} onChange={(e) => setEditForm({ ...editForm, endereco: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" value={editForm.data_inicio} onChange={(e) => setEditForm({ ...editForm, data_inicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
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
              <Label>Tipo</Label>
              <Select value={editForm.tipo} onValueChange={(v) => setEditForm({ ...editForm, tipo: v })}>
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
              <Label>Outros Dados</Label>
              <Textarea rows={3} value={editForm.outros_dados} onChange={(e) => setEditForm({ ...editForm, outros_dados: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button
              onClick={async () => { if (editing) { await updateObra(editing.id, editForm as any); setEditing(null); } }}
              disabled={loading}
            >
              Salvar alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Excluir Obra */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir obra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Tem certeza que deseja excluir a obra "{deleteTarget?.nome}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { if (deleteTarget) { await deleteObra(deleteTarget.id); setDeleteTarget(null); } }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

