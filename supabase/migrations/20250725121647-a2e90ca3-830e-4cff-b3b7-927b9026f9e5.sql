-- Remover parcelas duplicadas, mantendo apenas uma de cada
DELETE FROM parcelas p1 
USING parcelas p2 
WHERE p1.id > p2.id 
  AND p1.boleto_id = p2.boleto_id 
  AND p1.numero_parcela = p2.numero_parcela;

-- Atualizar o trigger para evitar criação de parcelas duplicadas
DROP TRIGGER IF EXISTS trigger_gerar_parcelas ON public.boletos;

-- Criar função atualizada que verifica se já existem parcelas antes de criar
CREATE OR REPLACE FUNCTION public.gerar_parcelas_automaticamente()
RETURNS TRIGGER AS $$
DECLARE
    i INTEGER;
    data_vencimento DATE;
    valor_individual NUMERIC;
BEGIN
    -- Verificar se já existem parcelas para este boleto
    IF EXISTS (SELECT 1 FROM public.parcelas WHERE boleto_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- Calcular valor individual da parcela
    valor_individual := NEW.valor_total / NEW.quantidade_parcelas;
    
    -- Gerar parcelas
    FOR i IN 1..NEW.quantidade_parcelas LOOP
        -- Calcular data de vencimento para cada parcela
        data_vencimento := NEW.vencimento_primeira + INTERVAL '1 month' * (i - 1);
        
        INSERT INTO public.parcelas (
            boleto_id,
            numero_parcela,
            vencimento,
            valor_parcela,
            status_pagamento
        ) VALUES (
            NEW.id,
            i,
            data_vencimento,
            valor_individual,
            'Pendente'
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
CREATE TRIGGER trigger_gerar_parcelas
  AFTER INSERT ON public.boletos
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_parcelas_automaticamente();