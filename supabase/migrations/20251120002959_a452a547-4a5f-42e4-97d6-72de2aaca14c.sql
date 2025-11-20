-- Remover constraint antiga
ALTER TABLE fornecedores DROP CONSTRAINT IF EXISTS fornecedores_tipo_check;

-- Adicionar nova constraint que aceita Cliente e Fornecedor
ALTER TABLE fornecedores ADD CONSTRAINT fornecedores_tipo_check 
CHECK (tipo IN ('Cliente', 'Fornecedor'));

-- Fazer o mesmo para obras se houver constraint
ALTER TABLE obras DROP CONSTRAINT IF EXISTS obras_tipo_check;