-- DelaySpend: agregar columnas para cuotas y etiquetas en la tabla expenses
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS installment_group_id TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS installment_number INTEGER;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS installment_total INTEGER;
