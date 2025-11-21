import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useObras } from '@/contexts/ObraContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFormPersistence } from '@/hooks/useFormPersistence';

export function ObraForm() {
  const { addObra, obras, updateObra, deleteObra, loading } = useObras();
  const [form, setForm, clearSavedData] = useFormPersistence(
    'obra-form-draft',
    {
      nome: '',
      codigo: '',
      endereco: '',
      cidade: '',
      estado: '',
    }
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addObra(form as any);
    clearSavedData();
  };

  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: ''
  });
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cadastro de Obras</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigo">Código</Label>
                <Input id="codigo" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="nome">Nome da Obra</Label>
                <Input id="nome" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} required />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input id="estado" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} maxLength={2} />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar Obra'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Obras Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p>Carregando...</p>}
          {!loading && obras.length === 0 && <p>Nenhuma obra cadastrada ainda.</p>}
          {!loading && obras.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Nome</th>
                    <th className="p-2 text-left">Endereço</th>
                    <th className="p-2 text-left">Cidade</th>
                    <th className="p-2 text-left">Estado</th>
                    <th className="p-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {obras.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="p-2">{o.codigo}</td>
                      <td className="p-2">{o.nome}</td>
                      <td className="p-2">{o.endereco}</td>
                      <td className="p-2">{o.cidade}</td>
                      <td className="p-2">{o.estado}</td>
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
                                cidade: o.cidade || '',
                                estado: o.estado || ''
                              });
                            }}
                          >
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(o)}>
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

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Obra</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await updateObra(editing.id, editForm);
              setEditing(null);
            }}
            className="space-y-4"
          >
            <div>
              <Label>Nome</Label>
              <Input value={editForm.nome} onChange={e => setEditForm({ ...editForm, nome: e.target.value })} required />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={editForm.endereco} onChange={e => setEditForm({ ...editForm, endereco: e.target.value })} />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={editForm.cidade} onChange={e => setEditForm({ ...editForm, cidade: e.target.value })} />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={editForm.estado} onChange={e => setEditForm({ ...editForm, estado: e.target.value })} maxLength={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a obra "{deleteTarget?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await deleteObra(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
