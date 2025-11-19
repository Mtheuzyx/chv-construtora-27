import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useBoletos } from '@/contexts/BoletoContext';
import { toast } from '@/hooks/use-toast';
import { BoletoFormData } from '@/types/boleto';

const formSchema = z.object({
  nomeCliente: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos'),
  cidade: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres'),
  formaPagamento: z.string().min(1, 'Selecione uma forma de pagamento'),
  dataPagamento: z.string().optional(),
  dataVencimento: z.string().min(1, 'Data de vencimento é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  parcelas: z.string().min(1, 'Número de parcelas é obrigatório'),
  parcelaAtual: z.string().min(1, 'Parcela atual é obrigatória'),
  observacoes: z.string().optional()
});

export default function BoletoForm() {
  const { addBoleto } = useBoletos();
  
  const form = useForm<BoletoFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCliente: '',
      cpf: '',
      cidade: '',
      formaPagamento: '',
      dataPagamento: '',
      dataVencimento: '',
      valor: '',
      parcelas: '1',
      parcelaAtual: '1',
      observacoes: ''
    }
  });

  const valorTotal = form.watch('valor');
  const quantidadeParcelas = form.watch('parcelas');
  
  const valorParcela = React.useMemo(() => {
    const valor = parseFloat(valorTotal || '0');
    const parcelas = parseInt(quantidadeParcelas || '1');
    return parcelas > 0 ? (valor / parcelas).toFixed(2) : '0.00';
  }, [valorTotal, quantidadeParcelas]);


  const onSubmit = (data: BoletoFormData) => {
    addBoleto(data);
    form.reset();
    toast({
      title: "Boleto cadastrado!",
      description: "O boleto foi adicionado com sucesso ao sistema.",
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">Cadastro de Boletos</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="nomeCliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite a cidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="formaPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="boleto">Boleto Bancário</SelectItem>
                        <SelectItem value="cartao-credito">Cartão de Crédito</SelectItem>
                        <SelectItem value="cartao-debito">Cartão de Débito</SelectItem>
                        <SelectItem value="transferencia">Transferência Bancária</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="dataVencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Pagamento (opcional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Total do Boleto</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0,00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade de Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="md:col-span-1">
                <Label className="text-sm font-medium">Valor da Parcela</Label>
                <div className="h-10 px-3 py-2 border border-input bg-muted rounded-md flex items-center text-sm text-muted-foreground">
                  R$ {valorParcela}
                </div>
              </div>

              <FormField
                control={form.control}
                name="parcelaAtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcela Atual</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max={quantidadeParcelas} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Digite observações adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full md:w-auto">
              Cadastrar Boleto
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}