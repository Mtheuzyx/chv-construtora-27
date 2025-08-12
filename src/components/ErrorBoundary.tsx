import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

type Props = { children: React.ReactNode };

type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Erro capturado pelo ErrorBoundary:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="my-4 border-destructive">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium">Ocorreu um erro ao carregar esta seção.</p>
                <p className="text-sm text-muted-foreground">Tente novamente. Se persistir, recarregue a página.</p>
                <button
                  onClick={this.handleRetry}
                  className="mt-3 inline-flex items-center rounded-md border px-3 py-1.5 text-sm fast-transition hover-lift"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
