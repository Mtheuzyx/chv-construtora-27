import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, FileJson, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useObras } from '@/contexts/ObraContext';
import { useParcelas } from '@/contexts/ParcelaContext';

interface BackupData {
  version: string;
  exportDate: string;
  data: {
    fornecedores: any[];
    obras: any[];
    parcelas: any[];
  };
}

export function DataMigration() {
  const { toast } = useToast();
  const { refresh: refreshObras } = useObras();
  const { loadParcelas } = useParcelas();
  
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<{ fornecedores: number; obras: number; parcelas: number } | null>(null);

  const handleExport = () => {
    setIsExporting(true);
    try {
      // Coletar dados do localStorage
      const fornecedores = JSON.parse(localStorage.getItem('fornecedores') || '[]');
      const obras = JSON.parse(localStorage.getItem('obras') || '[]');
      const parcelas = JSON.parse(localStorage.getItem('parcelas') || '[]');

      const backupData: BackupData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: {
          fornecedores,
          obras,
          parcelas
        }
      };

      // Criar arquivo para download
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `backup-chv-${date}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportação concluída!',
        description: `${fornecedores.length} fornecedores, ${obras.length} obras, ${parcelas.length} parcelas exportadas.`,
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro na exportação',
        description: 'Não foi possível exportar os dados.',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(0);
    setImportStats(null);

    try {
      const text = await file.text();
      const backupData: BackupData = JSON.parse(text);

      // Validar estrutura
      if (!backupData.version || !backupData.data) {
        throw new Error('Arquivo de backup inválido');
      }

      const { fornecedores, obras, parcelas } = backupData.data;
      let progress = 0;
      const totalSteps = 3;

      // Importar fornecedores
      if (fornecedores.length > 0) {
        const { error } = await supabase
          .from('fornecedores')
          .insert(fornecedores.map(f => ({
            id: f.id,
            nome: f.nome,
            cpf_cnpj: f.cpfCnpj,
            tipo: f.tipo,
            email: f.email,
            telefone: f.telefone,
            endereco: f.endereco
          })));
        
        if (error && !error.message.includes('duplicate')) throw error;
      }
      progress++;
      setImportProgress((progress / totalSteps) * 100);

      // Importar obras
      if (obras.length > 0) {
        const { error } = await supabase
          .from('obras')
          .insert(obras.map(o => ({
            id: o.id,
            codigo: o.codigo,
            nome: o.nome,
            endereco: o.endereco,
            cidade: o.cidade,
            estado: o.estado,
            ativa: o.ativa ?? true
          })));
        
        if (error && !error.message.includes('duplicate')) throw error;
      }
      progress++;
      setImportProgress((progress / totalSteps) * 100);

      // Importar parcelas
      if (parcelas.length > 0) {
        // Primeiro, criar boletos únicos
        const boletosMap = new Map();
        parcelas.forEach(p => {
          if (!boletosMap.has(p.boletoId)) {
            boletosMap.set(p.boletoId, {
              id: p.boletoId,
              fornecedor_id: p.fornecedorId,
              obra_id: p.obraId || null,
              forma_pagamento: 'Boleto',
              valor_total: p.valor * p.totalParcelas,
              quantidade_parcelas: p.totalParcelas,
              vencimento_primeira: p.dataVencimento,
              observacoes: p.boletoObservacoes
            });
          }
        });

        // Inserir boletos
        const boletos = Array.from(boletosMap.values());
        if (boletos.length > 0) {
          const { error: boletoError } = await supabase
            .from('boletos')
            .insert(boletos);
          
          if (boletoError && !boletoError.message.includes('duplicate')) throw boletoError;
        }

        // Inserir parcelas
        const { error: parcelaError } = await supabase
          .from('parcelas')
          .insert(parcelas.map(p => ({
            id: p.id,
            boleto_id: p.boletoId,
            numero_parcela: p.numeroParcela,
            valor: p.valor,
            vencimento: p.dataVencimento,
            pagamento: p.dataPagamento || null,
            status: p.status
          })));
        
        if (parcelaError && !parcelaError.message.includes('duplicate')) throw parcelaError;
      }
      progress++;
      setImportProgress((progress / totalSteps) * 100);

      // Atualizar contexts
      await Promise.all([
        refreshObras?.(),
        loadParcelas?.()
      ]);

      setImportStats({
        fornecedores: fornecedores.length,
        obras: obras.length,
        parcelas: parcelas.length
      });

      toast({
        title: 'Importação concluída!',
        description: `${fornecedores.length} fornecedores, ${obras.length} obras, ${parcelas.length} parcelas importadas.`,
      });

    } catch (error) {
      console.error('Erro ao importar:', error);
      toast({
        title: 'Erro na importação',
        description: error instanceof Error ? error.message : 'Não foi possível importar os dados.',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Esta ferramenta permite migrar dados do localStorage para o Lovable Cloud. 
          Use-a uma única vez por computador para sincronizar seus dados.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Exportação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              1. Exportar Dados
            </CardTitle>
            <CardDescription>
              Execute no computador que contém os dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Esta ação irá gerar um arquivo JSON com todos os fornecedores, obras e parcelas 
                armazenados localmente neste navegador.
              </p>
            </div>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="w-full"
            >
              {isExporting ? 'Exportando...' : 'Exportar Dados'}
              <FileJson className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Importação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              2. Importar Dados
            </CardTitle>
            <CardDescription>
              Execute no novo computador com o arquivo exportado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Selecione o arquivo JSON exportado do outro computador. 
                Os dados serão enviados para o Lovable Cloud.
              </p>
            </div>
            
            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-sm text-center text-muted-foreground">
                  Importando... {Math.round(importProgress)}%
                </p>
              </div>
            )}

            {importStats && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Importados: {importStats.fornecedores} fornecedores, {importStats.obras} obras, {importStats.parcelas} parcelas
                </AlertDescription>
              </Alert>
            )}

            <Button 
              className="w-full" 
              disabled={isImporting}
              onClick={() => document.getElementById('file-import')?.click()}
            >
              {isImporting ? 'Importando...' : 'Selecionar Arquivo'}
              <Upload className="ml-2 h-4 w-4" />
            </Button>
            <input
              id="file-import"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>No computador com dados:</strong> Clique em "Exportar Dados" para baixar um arquivo JSON
            </li>
            <li>
              <strong>Transfira o arquivo:</strong> Envie por email, USB, cloud storage, WhatsApp, etc.
            </li>
            <li>
              <strong>No novo computador:</strong> Clique em "Selecionar Arquivo" e escolha o JSON baixado
            </li>
            <li>
              <strong>Pronto!</strong> Seus dados agora estão no Lovable Cloud e sincronizarão automaticamente
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
