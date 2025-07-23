import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useBoletos } from '@/contexts/BoletoContext';
import { toast } from '@/hooks/use-toast';
import { Calendar, Edit } from 'lucide-react';
import { Boleto } from '@/types/boleto';

interface EditPaymentDateProps {
  boleto: Boleto;
}

export default function EditPaymentDate({ boleto }: EditPaymentDateProps) {
  const [open, setOpen] = useState(false);
  const [dataPagamento, setDataPagamento] = useState(boleto.dataPagamento || '');
  const { updateBoletoPayment } = useBoletos();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dataPagamento) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma data de pagamento.",
        variant: "destructive"
      });
      return;
    }

    updateBoletoPayment(boleto.id, dataPagamento);
    setOpen(false);
    
    toast({
      title: "Data de pagamento atualizada!",
      description: `Pagamento de ${boleto.nomeCliente} foi registrado para ${new Date(dataPagamento).toLocaleDateString('pt-BR')}.`,
    });
  };

  const handleRemovePayment = () => {
    updateBoletoPayment(boleto.id, '');
    setDataPagamento('');
    setOpen(false);
    
    toast({
      title: "Data de pagamento removida!",
      description: `Pagamento de ${boleto.nomeCliente} foi removido.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Registrar Pagamento
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input 
              id="cliente"
              value={boleto.nomeCliente}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="valor">Valor do Boleto</Label>
            <Input 
              id="valor"
              value={new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(boleto.valor)}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vencimento">Data de Vencimento</Label>
            <Input 
              id="vencimento"
              value={new Date(boleto.dataVencimento).toLocaleDateString('pt-BR')}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pagamento">Data de Pagamento</Label>
            <Input 
              id="pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              placeholder="Selecione a data do pagamento"
            />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              Registrar Pagamento
            </Button>
            {boleto.dataPagamento && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleRemovePayment}
                className="flex-1"
              >
                Remover Pagamento
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}