-- DelaySpend: agregar soporte para gastos ficticios (mascaras) y subcategorias
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_fictitious BOOLEAN DEFAULT FALSE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS subcategory TEXT;

