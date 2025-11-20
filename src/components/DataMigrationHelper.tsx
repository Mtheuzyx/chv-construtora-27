import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function DataMigrationHelper() {
  const [hasMigrated, setHasMigrated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const check = localStorage.getItem('data_migrated_to_supabase');
    setHasMigrated(check === 'true');
    setIsChecking(false);
  }, []);

  const migrateData = async () => {
    try {
      toast({ title: 'Iniciando migração...', description: 'Por favor, aguarde.' });

      // Migrar Obras
      const obrasLS = localStorage.getItem('obras');
      if (obrasLS) {
        const obras = JSON.parse(obrasLS);
        for (const obra of obras) {
          const { error } = await supabase.from('obras').insert([{
            id: obra.id,
            codigo: obra.codigo,
            nome: obra.nome,
            endereco: obra.endereco,
            cidade: obra.cidade,
            estado: obra.estado,
            ativa: obra.ativa ?? true
          }]);
          if (error && !error.message.includes('duplicate')) {
            console.error('Erro ao inserir obra:', error);
          }
        }
      }

      // Migrar Fornecedores
      const fornLS = localStorage.getItem('fornecedores');
      if (fornLS) {
        const fornecedores = JSON.parse(fornLS);
        for (const forn of fornecedores) {
          const { error } = await supabase.from('fornecedores').insert([{
            id: forn.id,
            nome: forn.nome,
            cpf_cnpj: forn.cpfCnpj,
            email: forn.email || null,
            telefone: forn.telefone || null,
            endereco: forn.endereco || null,
            tipo: forn.tipo || 'Fornecedor'
          }]);
          if (error && !error.message.includes('duplicate')) {
            console.error('Erro ao inserir fornecedor:', error);
          }
        }
      }

      // Migrar Parcelas (e criar boletos correspondentes)
      const parcelasLS = localStorage.getItem('parcelas');
      if (parcelasLS) {
        const parcelas = JSON.parse(parcelasLS);
        const boletoIds = new Set(parcelas.map((p: any) => p.boletoId));

        for (const boletoId of boletoIds) {
          const parcelasDoBoleto = parcelas.filter((p: any) => p.boletoId === boletoId);
          if (parcelasDoBoleto.length > 0) {
            const primeira = parcelasDoBoleto[0];
            
            // Criar boleto
            const { error: boletoError } = await supabase.from('boletos').insert([{
              id: String(boletoId),
              fornecedor_id: String(primeira.fornecedorId),
              obra_id: primeira.obraId ? String(primeira.obraId) : null,
              valor_total: parcelasDoBoleto.reduce((sum: number, p: any) => sum + p.valor, 0),
              quantidade_parcelas: parcelasDoBoleto.length,
              vencimento_primeira: String(parcelasDoBoleto[0].dataVencimento),
              forma_pagamento: 'Boleto',
              observacoes: primeira.boletoObservacoes || null
            }]);

            if (boletoError && !boletoError.message.includes('duplicate')) {
              console.error('Erro ao inserir boleto:', boletoError);
            }

            // Criar parcelas
            for (const parcela of parcelasDoBoleto) {
              const { error: parcelaError } = await supabase.from('parcelas').insert([{
                id: String(parcela.id),
                boleto_id: String(boletoId),
                numero_parcela: Number(parcela.numeroParcela),
                valor: Number(parcela.valor),
                vencimento: String(parcela.dataVencimento),
                pagamento: parcela.dataPagamento ? String(parcela.dataPagamento) : null,
                status: String(parcela.status || 'pendente')
              }]);

              if (parcelaError && !parcelaError.message.includes('duplicate')) {
                console.error('Erro ao inserir parcela:', parcelaError);
              }
            }
          }
        }
      }

      localStorage.setItem('data_migrated_to_supabase', 'true');
      setHasMigrated(true);
      toast({ title: 'Migração concluída!', description: 'Todos os dados foram migrados com sucesso.' });
    } catch (error) {
      console.error('Erro na migração:', error);
      toast({ title: 'Erro', description: 'Erro ao migrar dados. Verifique o console.', variant: 'destructive' });
    }
  };

  if (isChecking) return null;
  if (hasMigrated) return null;

  const hasAnyData = localStorage.getItem('obras') || 
                     localStorage.getItem('fornecedores') || 
                     localStorage.getItem('parcelas');

  if (!hasAnyData) {
    localStorage.setItem('data_migrated_to_supabase', 'true');
    return null;
  }

  return (
    <Card className="mb-4 border-primary">
      <CardHeader>
        <CardTitle>Migração de Dados</CardTitle>
        <CardDescription>
          Detectamos dados salvos localmente. Clique no botão abaixo para migrar seus dados para a nuvem e sincronizá-los entre dispositivos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={migrateData}>Migrar Dados para a Nuvem</Button>
      </CardContent>
    </Card>
  );
}
