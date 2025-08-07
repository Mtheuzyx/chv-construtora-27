-- Secure function search_path settings

-- obras_set_defaults
CREATE OR REPLACE FUNCTION public.obras_set_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := lpad(nextval('public.obra_seq')::text, 3, '0');
  END IF;

  IF NEW.numero_unico IS NULL OR NEW.numero_unico = '' THEN
    NEW.numero_unico := NEW.codigo;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.data_cadastro = now();
  RETURN NEW;
END;
$$;

-- generate_parcelas
CREATE OR REPLACE FUNCTION public.generate_parcelas()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  i INTEGER;
  parcela_valor DECIMAL(10,2);
  parcela_vencimento DATE;
BEGIN
  parcela_valor := NEW.valor_total / NEW.quantidade_parcelas;
  FOR i IN 1..NEW.quantidade_parcelas LOOP
    parcela_vencimento := NEW.vencimento_primeira + INTERVAL '1 month' * (i - 1);
    INSERT INTO public.parcelas (
      boleto_id,
      numero_parcela,
      valor_parcela,
      vencimento,
      status_pagamento
    ) VALUES (
      NEW.id,
      i,
      parcela_valor,
      parcela_vencimento,
      'Pendente'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

-- gerar_parcelas_automaticamente
CREATE OR REPLACE FUNCTION public.gerar_parcelas_automaticamente()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    i INTEGER;
    data_vencimento DATE;
    valor_individual NUMERIC;
BEGIN
    IF EXISTS (SELECT 1 FROM public.parcelas WHERE boleto_id = NEW.id) THEN
        RETURN NEW;
    END IF;
    valor_individual := NEW.valor_total / NEW.quantidade_parcelas;
    FOR i IN 1..NEW.quantidade_parcelas LOOP
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
$$;