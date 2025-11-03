-- Corrigir função update_parcela_status com search_path
CREATE OR REPLACE FUNCTION public.update_parcela_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pagamento IS NOT NULL THEN
    NEW.status := 'pago';
  ELSIF NEW.vencimento < CURRENT_DATE THEN
    NEW.status := 'vencido';
  ELSE
    NEW.status := 'pendente';
  END IF;
  RETURN NEW;
END;
$$;

-- Corrigir função create_parcelas_for_boleto com search_path
CREATE OR REPLACE FUNCTION public.create_parcelas_for_boleto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valor_parcela DECIMAL(10,2);
  v_vencimento DATE;
  i INTEGER;
BEGIN
  v_valor_parcela := NEW.valor_total / NEW.quantidade_parcelas;
  
  FOR i IN 1..NEW.quantidade_parcelas LOOP
    v_vencimento := NEW.vencimento_primeira + (i - 1) * INTERVAL '1 month';
    
    INSERT INTO public.parcelas (
      boleto_id,
      numero_parcela,
      valor,
      vencimento
    ) VALUES (
      NEW.id,
      i,
      v_valor_parcela,
      v_vencimento
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Corrigir função update_updated_at_column com search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;