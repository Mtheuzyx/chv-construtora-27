-- Desabilitar o trigger que duplica parcelas
DROP TRIGGER IF EXISTS trigger_create_parcelas ON boletos;

-- Remover parcelas duplicadas mantendo apenas a primeira
DELETE FROM parcelas
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY boleto_id, numero_parcela ORDER BY created_at) as rn
    FROM parcelas
  ) t
  WHERE t.rn > 1
);