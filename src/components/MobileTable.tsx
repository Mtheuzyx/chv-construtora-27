import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/formatters';
import { Pencil, Trash2, Eye } from 'lucide-react';

interface MobileTableProps {
  data: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  getStatusBadge?: (status: string) => React.ReactNode;
  getFornecedorNome?: (fornecedorId: string) => string;
  type: 'parcelas' | 'fornecedores';
}

export const MobileTable: React.FC<MobileTableProps> = ({
  data,
  onEdit,
  onDelete,
  onView,
  getStatusBadge,
  getFornecedorNome,
  type
}) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum item encontrado
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {data.map((item) => (
        <Card key={item.id} className="p-4 hover-scale transition-all duration-200">
          <CardContent className="p-0">
            {type === 'parcelas' ? (
              <div className="space-y-3">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {getFornecedorNome ? getFornecedorNome(item.fornecedorId) : item.fornecedorNome}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {item.numeroParcela}ª de {item.totalParcelas}
                    </p>
                  </div>
                  {getStatusBadge && getStatusBadge(item.status)}
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Valor:</span>
                    <p className="font-medium">{formatCurrency(item.valor)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Vencimento:</span>
                    <p className="font-medium">{new Date(item.dataVencimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                {item.dataPagamento && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Pagamento:</span>
                    <p className="font-medium">{new Date(item.dataPagamento).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}

                {item.observacoes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Obs:</span>
                    <p className="text-xs mt-1">{item.observacoes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {onView && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(item)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(item)}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Fornecedor layout */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-sm">{item.nome}</h3>
                    <p className="text-xs text-muted-foreground">{item.cpfCnpj}</p>
                  </div>
                  <Badge variant="outline">{item.tipo}</Badge>
                </div>

                {item.email && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <p className="text-xs">{item.email}</p>
                  </div>
                )}

                {item.telefone && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Telefone:</span>
                    <p className="font-medium">{item.telefone}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {onView && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onView(item)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(item)}
                      className="flex-1"
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDelete(item)}
                      className="flex-1"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default memo(MobileTable);