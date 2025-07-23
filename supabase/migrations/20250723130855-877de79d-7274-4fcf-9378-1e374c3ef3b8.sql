-- Primeiro vamos criar o trigger para gerar parcelas automaticamente
CREATE OR REPLACE FUNCTION public.gerar_parcelas_automaticamente()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir parcelas baseadas no boleto criado
  INSERT INTO public.parcelas (
    boleto_id,
    numero_parcela,
    valor_parcela,
    vencimento,
    status_pagamento
  )
  SELECT 
    NEW.id,
    generate_series(1, NEW.quantidade_parcelas),
    NEW.valor_total / NEW.quantidade_parcelas,
    NEW.vencimento_primeira + (interval '1 month' * (generate_series(1, NEW.quantidade_parcelas) - 1)),
    'Pendente'
  ;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
CREATE TRIGGER trigger_gerar_parcelas
  AFTER INSERT ON public.boletos
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_parcelas_automaticamente();