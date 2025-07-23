-- Create fornecedores table
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE NOT NULL,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create boletos table
CREATE TABLE public.boletos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  forma_pagamento TEXT NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  quantidade_parcelas INTEGER NOT NULL DEFAULT 1,
  vencimento_primeira DATE NOT NULL,
  observacoes TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parcelas table
CREATE TABLE public.parcelas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  boleto_id UUID NOT NULL REFERENCES public.boletos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor_parcela DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'Pendente' CHECK (status_pagamento IN ('Pendente', 'Pago', 'Atrasado')),
  data_pagamento DATE,
  observacoes TEXT
);

-- Enable Row Level Security
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a company internal system)
CREATE POLICY "Allow all operations on fornecedores" ON public.fornecedores FOR ALL USING (true);
CREATE POLICY "Allow all operations on boletos" ON public.boletos FOR ALL USING (true);
CREATE POLICY "Allow all operations on parcelas" ON public.parcelas FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_fornecedores_cpf_cnpj ON public.fornecedores(cpf_cnpj);
CREATE INDEX idx_fornecedores_nome ON public.fornecedores(nome);
CREATE INDEX idx_boletos_fornecedor_id ON public.boletos(fornecedor_id);
CREATE INDEX idx_boletos_vencimento_primeira ON public.boletos(vencimento_primeira);
CREATE INDEX idx_parcelas_boleto_id ON public.parcelas(boleto_id);
CREATE INDEX idx_parcelas_status_pagamento ON public.parcelas(status_pagamento);
CREATE INDEX idx_parcelas_vencimento ON public.parcelas(vencimento);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_cadastro = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic generation of parcelas when boleto is created
CREATE OR REPLACE FUNCTION public.generate_parcelas()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate parcelas when boleto is inserted
CREATE TRIGGER trigger_generate_parcelas
  AFTER INSERT ON public.boletos
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_parcelas();