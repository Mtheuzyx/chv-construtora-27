-- Criar tabela de fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('fisica', 'juridica')),
  telefone TEXT,
  email TEXT,
  endereco TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de obras
CREATE TABLE IF NOT EXISTS public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de boletos
CREATE TABLE IF NOT EXISTS public.boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE CASCADE NOT NULL,
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE NOT NULL,
  forma_pagamento TEXT NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  quantidade_parcelas INTEGER NOT NULL DEFAULT 1,
  vencimento_primeira DATE NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de parcelas
CREATE TABLE IF NOT EXISTS public.parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boleto_id UUID REFERENCES public.boletos(id) ON DELETE CASCADE NOT NULL,
  numero_parcela INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_boletos_fornecedor ON public.boletos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_boletos_obra ON public.boletos(obra_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_boleto ON public.parcelas(boleto_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON public.parcelas(vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON public.parcelas(status);

-- Habilitar RLS
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;

-- Criar políticas (acesso público para desenvolvimento)
CREATE POLICY "Permitir acesso total a fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a obras" ON public.obras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a boletos" ON public.boletos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acesso total a parcelas" ON public.parcelas FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar status da parcela
CREATE OR REPLACE FUNCTION public.update_parcela_status()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Trigger para atualizar status automaticamente
CREATE TRIGGER trigger_update_parcela_status
  BEFORE INSERT OR UPDATE ON public.parcelas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_parcela_status();

-- Função para criar parcelas automaticamente
CREATE OR REPLACE FUNCTION public.create_parcelas_for_boleto()
RETURNS TRIGGER
LANGUAGE plpgsql
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

-- Trigger para criar parcelas automaticamente
CREATE TRIGGER trigger_create_parcelas_for_boleto
  AFTER INSERT ON public.boletos
  FOR EACH ROW
  EXECUTE FUNCTION public.create_parcelas_for_boleto();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_obras_updated_at BEFORE UPDATE ON public.obras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_boletos_updated_at BEFORE UPDATE ON public.boletos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parcelas_updated_at BEFORE UPDATE ON public.parcelas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();