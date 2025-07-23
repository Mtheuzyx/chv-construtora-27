
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FornecedorProvider } from '@/contexts/FornecedorContext';
import { ParcelaProvider } from '@/contexts/ParcelaContext';
import { FornecedorForm } from '@/components/FornecedorForm';
import { BoletoFormNovo } from '@/components/BoletoFormNovo';
import { ControlePagamentos } from '@/components/ControlePagamentos';
import { Dashboard } from '@/components/Dashboard';
import { Users, FileText, CreditCard, BarChart3 } from 'lucide-react';

const Index = () => {
  return (
    <FornecedorProvider>
      <ParcelaProvider>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
          <div className="container mx-auto py-8 px-4">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <img 
                  src="/lovable-uploads/71b5037e-d7c0-47ef-9502-49352cb7a124.png" 
                  alt="CHV Construtora Logo" 
                  className="w-16 h-16 object-contain"
                />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  CHV CONSTRUTORA
                </h1>
              </div>
              <p className="text-muted-foreground">
                Sistema de Controle de Boletos e Pagamentos
              </p>
            </div>

            <Tabs defaultValue="fornecedores" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="fornecedores" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Cadastro de Fornecedores
                </TabsTrigger>
                <TabsTrigger value="boletos" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Cadastro de Boletos
                </TabsTrigger>
                <TabsTrigger value="pagamentos" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Controle de Pagamentos
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fornecedores" className="space-y-6">
                <FornecedorForm />
              </TabsContent>

              <TabsContent value="boletos" className="space-y-6">
                <BoletoFormNovo />
              </TabsContent>

              <TabsContent value="pagamentos" className="space-y-6">
                <ControlePagamentos />
              </TabsContent>

              <TabsContent value="dashboard" className="space-y-6">
                <Dashboard />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </ParcelaProvider>
    </FornecedorProvider>
  );
};

export default Index;
