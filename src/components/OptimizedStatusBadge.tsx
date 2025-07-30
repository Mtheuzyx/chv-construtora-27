import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ParcelaStatus } from '@/types/parcela';
import { CheckCircle, Clock, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: ParcelaStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  AGUARDANDO: {
    variant: 'secondary' as const,
    text: 'Aguardando',
    className: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-300 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:text-yellow-200',
    icon: Clock
  },
  VENCE_HOJE: {
    variant: 'default' as const,
    text: 'Vence Hoje',
    className: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-300 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-200',
    icon: AlertTriangle
  },
  VENCIDO: {
    variant: 'destructive' as const,
    text: 'Vencido',
    className: 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-300 dark:from-red-900/20 dark:to-red-800/20 dark:text-red-200',
    icon: XCircle
  },
  PAGO: {
    variant: 'default' as const,
    text: 'Pago',
    className: 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-300 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-200',
    icon: CheckCircle
  },
  PAGO_COM_ATRASO: {
    variant: 'secondary' as const,
    text: 'Pago c/ Atraso',
    className: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-800 border-orange-300 dark:from-orange-900/20 dark:to-orange-800/20 dark:text-orange-200',
    icon: AlertCircle
  }
} as const;

export const OptimizedStatusBadge = memo(({ status, showIcon = false, size = 'md' }: StatusBadgeProps) => {
  const config = statusConfig[status] || statusConfig.AGUARDANDO;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  };

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${sizeClasses[size]} fast-transition hover:scale-105 font-medium flex items-center gap-1`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.text}
    </Badge>
  );
});

OptimizedStatusBadge.displayName = 'OptimizedStatusBadge';