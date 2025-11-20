-- Remover trigger de criação automática de parcelas, para evitar duplicidade
DROP TRIGGER IF EXISTS trigger_create_parcelas_for_boleto ON public.boletos;