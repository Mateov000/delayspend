-- DelaySpend: agregar soporte para gastos fijos / recurrentes
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
