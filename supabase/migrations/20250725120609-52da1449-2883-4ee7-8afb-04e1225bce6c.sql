-- Primeiro vamos verificar se o trigger existe e criar se necessário
DROP TRIGGER IF EXISTS trigger_gerar_parcelas ON public.boletos;

-- Criar trigger para gerar parcelas automaticamente quando um boleto é inserido
CREATE TRIGGER trigger_gerar_parcelas
  AFTER INSERT ON public.boletos
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_parcelas_automaticamente();