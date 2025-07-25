
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FornecedorProvider } from '@/contexts/FornecedorContext';
import { ParcelaProvider } from '@/contexts/ParcelaContext';
import { Users, FileText, CreditCard, BarChart3 } from 'lucide-react';

// Import components directly
import { FornecedorForm } from '@/components/FornecedorForm';
import { BoletoFormNovo } from '@/components/BoletoFormNovo';
import { ControlePagamentosOtimizado as ControlePagamentos } from '@/components/ControlePagamentosOtimizado';
import { Dashboard } from '@/components/Dashboard';

const Index = () => {
  return (
    <FornecedorProvider>
      <ParcelaProvider>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
          <div className="container mx-auto py-4 px-2 sm:py-8 sm:px-4">
            {/* Header - Mobile optimized */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-4">
                <img 
                  src="/lovable-uploads/71b5037e-d7c0-47ef-9502-49352cb7a124.png" 
                  alt="CHV Construtora Logo" 
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
                <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent text-center">
                  CHV CONSTRUTORA
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Sistema de Controle de Boletos e Pagamentos
              </p>
            </div>

            <Tabs defaultValue="fornecedores" className="w-full">
              {/* Mobile-first tabs layout */}
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 sm:mb-8 h-auto bg-card border animate-fade-in">
                <TabsTrigger 
                  value="fornecedores" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Cadastro de</span>
                  <span>Fornecedores</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="boletos" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Cadastro de</span>
                  <span>Boletos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="pagamentos" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Controle de</span>
                  <span>Pagamentos</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dashboard" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span>Dashboard</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fornecedores" className="space-y-6 animate-fade-in">
                <FornecedorForm />
              </TabsContent>

              <TabsContent value="boletos" className="space-y-6 animate-fade-in">
                <BoletoFormNovo />
              </TabsContent>

              <TabsContent value="pagamentos" className="space-y-6 animate-fade-in">
                <ControlePagamentos />
              </TabsContent>

              <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
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
