-- DelaySpend: agregar soporte para naturaleza de gasto (cotidiano, fijo, eventual)
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS nature TEXT DEFAULT 'daily';
