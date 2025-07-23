
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarFilterProps {
  onFilterChange: (filters: {
    startDate?: Date;
    endDate?: Date;
    dateType: 'vencimento' | 'pagamento';
  }) => void;
}

export function CalendarFilter({ onFilterChange }: CalendarFilterProps) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dateType, setDateType] = useState<'vencimento' | 'pagamento'>('vencimento');

  useEffect(() => {
    onFilterChange({
      startDate,
      endDate,
      dateType
    });
  }, [startDate, endDate, dateType, onFilterChange]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Tipo de Data</Label>
          <Select value={dateType} onValueChange={(value: 'vencimento' | 'pagamento') => {
            setDateType(value);
          }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vencimento">Data de Vencimento</SelectItem>
              <SelectItem value="pagamento">Data de Pagamento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label>Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd/MM/yyyy") : "Selecionar data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {(startDate || endDate) && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Filtros ativos: {startDate && `De ${format(startDate, "dd/MM/yyyy")}`} {endDate && `Até ${format(endDate, "dd/MM/yyyy")}`}
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
