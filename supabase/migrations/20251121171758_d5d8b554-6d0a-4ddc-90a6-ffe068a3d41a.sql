-- Criar bucket de storage para arquivos das parcelas
INSERT INTO storage.buckets (id, name, public)
VALUES ('parcela-anexos', 'parcela-anexos', true)
ON CONFLICT (id) DO NOTHING;

-- Criar tabela para registrar os anexos das parcelas
CREATE TABLE IF NOT EXISTS public.parcela_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parcela_id UUID NOT NULL REFERENCES public.parcelas(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by TEXT
);

-- Enable RLS
ALTER TABLE public.parcela_anexos ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para visualização pública dos anexos
CREATE POLICY "Todos podem visualizar anexos"
ON public.parcela_anexos
FOR SELECT
USING (true);

CREATE POLICY "Todos podem criar anexos"
ON public.parcela_anexos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Todos podem deletar anexos"
ON public.parcela_anexos
FOR DELETE
USING (true);

-- Criar políticas de storage para o bucket
CREATE POLICY "Arquivos são publicamente acessíveis"
ON storage.objects
FOR SELECT
USING (bucket_id = 'parcela-anexos');

CREATE POLICY "Qualquer um pode fazer upload de arquivos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'parcela-anexos');

CREATE POLICY "Qualquer um pode deletar arquivos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'parcela-anexos');