-- Adicionar foreign keys para garantir integridade referencial

-- Foreign key de boletos para fornecedores
ALTER TABLE boletos 
ADD CONSTRAINT fk_boletos_fornecedor 
FOREIGN KEY (fornecedor_id) 
REFERENCES fornecedores(id) 
ON DELETE CASCADE;

-- Foreign key de boletos para obras (opcional)
ALTER TABLE boletos 
ADD CONSTRAINT fk_boletos_obra 
FOREIGN KEY (obra_id) 
REFERENCES obras(id) 
ON DELETE SET NULL;

-- Foreign key de parcelas para boletos
ALTER TABLE parcelas 
ADD CONSTRAINT fk_parcelas_boleto 
FOREIGN KEY (boleto_id) 
REFERENCES boletos(id) 
ON DELETE CASCADE;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_boletos_fornecedor_id ON boletos(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_boletos_obra_id ON boletos(obra_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_boleto_id ON parcelas(boleto_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_vencimento ON parcelas(vencimento);
CREATE INDEX IF NOT EXISTS idx_parcelas_status ON parcelas(status);