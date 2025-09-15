-- Database setup for Boleto Control System
-- Run these commands in your Supabase SQL Editor

-- Create fornecedores table
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  tipo TEXT CHECK (tipo IN ('Fornecedor', 'Cliente')) DEFAULT 'Fornecedor',
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create obras table
CREATE TABLE IF NOT EXISTS obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE,
  numero_unico TEXT UNIQUE,
  nome TEXT NOT NULL,
  endereco TEXT,
  responsavel TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create boletos table
CREATE TABLE IF NOT EXISTS boletos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE CASCADE,
  obra_id UUID REFERENCES obras(id) ON DELETE SET NULL,
  forma_pagamento TEXT NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL,
  quantidade_parcelas INTEGER NOT NULL DEFAULT 1,
  vencimento_primeira DATE NOT NULL,
  observacoes TEXT,
  data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create parcelas table
CREATE TABLE IF NOT EXISTS parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boleto_id UUID REFERENCES boletos(id) ON DELETE CASCADE,
  numero_parcela INTEGER NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  vencimento DATE NOT NULL,
  pagamento DATE,
  status TEXT CHECK (status IN ('AGUARDANDO', 'PAGO', 'PAGO_COM_ATRASO', 'VENCIDO', 'VENCE_HOJE')) DEFAULT 'AGUARDANDO',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boletos_fornecedor_id ON boletos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_boletos_obra_id ON boletos(obra_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_boleto_id ON parcelas(boleto_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON parcelas(vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas(status);
CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo ON fornecedores(tipo);

-- Enable Row Level Security
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable all access for fornecedores" ON fornecedores FOR ALL USING (true);
CREATE POLICY "Enable all access for obras" ON obras FOR ALL USING (true);
CREATE POLICY "Enable all access for boletos" ON boletos FOR ALL USING (true);
CREATE POLICY "Enable all access for parcelas" ON parcelas FOR ALL USING (true);

-- Function to automatically update parcela status
CREATE OR REPLACE FUNCTION update_parcela_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pagamento IS NOT NULL THEN
    IF NEW.pagamento <= NEW.vencimento THEN
      NEW.status = 'PAGO';
    ELSE
      NEW.status = 'PAGO_COM_ATRASO';
    END IF;
  ELSE
    IF NEW.vencimento = CURRENT_DATE THEN
      NEW.status = 'VENCE_HOJE';
    ELSIF NEW.vencimento < CURRENT_DATE THEN
      NEW.status = 'VENCIDO';
    ELSE
      NEW.status = 'AGUARDANDO';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status updates
CREATE TRIGGER trigger_update_parcela_status
  BEFORE INSERT OR UPDATE ON parcelas
  FOR EACH ROW
  EXECUTE FUNCTION update_parcela_status();

-- Function to create parcelas when boleto is created
CREATE OR REPLACE FUNCTION create_parcelas_for_boleto()
RETURNS TRIGGER AS $$
DECLARE
  i INTEGER;
  parcela_valor DECIMAL(10,2);
  parcela_vencimento DATE;
BEGIN
  parcela_valor = NEW.valor_total / NEW.quantidade_parcelas;
  
  FOR i IN 1..NEW.quantidade_parcelas LOOP
    parcela_vencimento = NEW.vencimento_primeira + INTERVAL '1 month' * (i - 1);
    
    INSERT INTO parcelas (
      boleto_id,
      numero_parcela,
      valor,
      vencimento,
      status
    ) VALUES (
      NEW.id,
      i,
      parcela_valor,
      parcela_vencimento,
      CASE 
        WHEN parcela_vencimento = CURRENT_DATE THEN 'VENCE_HOJE'
        WHEN parcela_vencimento < CURRENT_DATE THEN 'VENCIDO'
        ELSE 'AGUARDANDO'
      END
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic parcela creation
CREATE TRIGGER trigger_create_parcelas_for_boleto
  AFTER INSERT ON boletos
  FOR EACH ROW
  EXECUTE FUNCTION create_parcelas_for_boleto();