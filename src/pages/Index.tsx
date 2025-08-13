
import React, { Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FornecedorProvider } from '@/contexts/FornecedorContext';
import { ParcelaProvider } from '@/contexts/ParcelaContext';
import { ObraProvider } from '@/contexts/ObraContext';
import { Users, FileText, CreditCard, BarChart3, Building2 } from 'lucide-react';

import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const FornecedorForm = lazy(() => import('@/components/FornecedorForm').then(m => ({ default: m.FornecedorForm })));
const BoletoFormNovo = lazy(() => import('@/components/BoletoFormNovo').then(m => ({ default: m.BoletoFormNovo })));
const ObraForm = lazy(() => import('@/components/ObraForm').then(m => ({ default: m.ObraForm })));
// BoletoList removido para manter layout original
const ControlePagamentos = lazy(() => import('@/components/ControlePagamentosOtimizadoV2').then(m => ({ default: m.ControlePagamentosOtimizadoV2 })));
const Dashboard = lazy(() => import('@/components/Dashboard').then(m => ({ default: m.Dashboard })));


const Index = () => {
  return (
    <ObraProvider>
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
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6 sm:mb-8 h-auto bg-card border animate-fade-in">
                <TabsTrigger 
                  value="fornecedores" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Cadastro de</span>
                  <span>Fornecedores</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="obras" 
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 hover:scale-105"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Cadastro de</span>
                  <span>Obras</span>
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
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="cards" count={2} />}>
      <FornecedorForm />
    </Suspense>
  </ErrorBoundary>
</TabsContent>

<TabsContent value="obras" className="space-y-6 animate-fade-in">
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="cards" count={2} />}>
      <ObraForm />
    </Suspense>
  </ErrorBoundary>
</TabsContent>

<TabsContent value="boletos" className="space-y-6 animate-fade-in">
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="filters" count={1} />}>
        <BoletoFormNovo />
    </Suspense>
  </ErrorBoundary>
</TabsContent>

<TabsContent value="pagamentos" className="space-y-6 animate-fade-in">
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="table" count={8} />}>
      <ControlePagamentos />
    </Suspense>
  </ErrorBoundary>
</TabsContent>

<TabsContent value="dashboard" className="space-y-6 animate-fade-in">
  <ErrorBoundary>
    <Suspense fallback={<LoadingSkeleton type="cards" count={4} />}>
      <Dashboard />
    </Suspense>
  </ErrorBoundary>
</TabsContent>
            </Tabs>
          </div>
        </div>
      </ParcelaProvider>
    </FornecedorProvider>
  </ObraProvider>
  );
};

export default Index;
