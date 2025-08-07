-- Create obras table and integrate with boletos

-- 1) Sequence for sequential obra codes
CREATE SEQUENCE IF NOT EXISTS public.obra_seq START 1;

-- 2) Create obras table
CREATE TABLE IF NOT EXISTS public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE, -- formatted like 001, 002
  numero_unico TEXT UNIQUE, -- can mirror codigo
  nome TEXT NOT NULL,
  endereco TEXT,
  responsavel TEXT,
  telefone TEXT,
  proprietario TEXT,
  data_inicio DATE,
  status TEXT, -- e.g., Em andamento, Concluída, etc.
  tipo TEXT,   -- Construção, Reforma, Lote, Manutenção
  outros_dados TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Trigger function to set defaults (codigo, numero_unico) and maintain updated_at
CREATE OR REPLACE FUNCTION public.obras_set_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Set sequential codigo if not provided
  IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
    NEW.codigo := lpad(nextval('public.obra_seq')::text, 3, '0');
  END IF;

  -- Set numero_unico mirroring codigo if not provided
  IF NEW.numero_unico IS NULL OR NEW.numero_unico = '' THEN
    NEW.numero_unico := NEW.codigo;
  END IF;

  -- Maintain updated_at
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Triggers for before insert and before update
DROP TRIGGER IF EXISTS obras_defaults_before_insert ON public.obras;
CREATE TRIGGER obras_defaults_before_insert
BEFORE INSERT ON public.obras
FOR EACH ROW EXECUTE FUNCTION public.obras_set_defaults();

DROP TRIGGER IF EXISTS obras_updated_at_before_update ON public.obras;
CREATE TRIGGER obras_updated_at_before_update
BEFORE UPDATE ON public.obras
FOR EACH ROW EXECUTE FUNCTION public.obras_set_defaults();

-- 5) Enable RLS and open policies similar to other tables
ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'obras' AND policyname = 'Allow all operations on obras'
  ) THEN
    CREATE POLICY "Allow all operations on obras"
    ON public.obras
    FOR ALL
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 6) Link boletos to obras (nullable)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'boletos' AND column_name = 'obra_id'
  ) THEN
    ALTER TABLE public.boletos ADD COLUMN obra_id UUID NULL;
  END IF;
END $$;

-- Add FK and index (idempotent guards)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.boletos'::regclass
      AND confrelid = 'public.obras'::regclass
      AND conname = 'boletos_obra_id_fkey'
  ) THEN
    ALTER TABLE public.boletos
    ADD CONSTRAINT boletos_obra_id_fkey FOREIGN KEY (obra_id) REFERENCES public.obras(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_boletos_obra_id ON public.boletos(obra_id);
