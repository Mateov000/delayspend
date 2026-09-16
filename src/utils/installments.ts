import { Expense, ExpenseInput } from '../store/types';
import { generateId } from './id';

/**
 * Dado un gasto real con cuotas, genera los N-1 registros de cuotas futuras como 'delayed'.
 * La primera cuota (type='real') ya viene en el input original — aquí solo se generan las restantes.
 *
 * @param baseExpense El gasto real (cuota 1) ya creado
 * @param input El input original del formulario
 * @param now ISO 8601 timestamp de creación
 */
export function generateFutureInstallments(
  baseExpense: Expense,
  input: ExpenseInput,
  now: string
): Expense[] {
  const total = input.installmentTotal;
  if (!total || total < 2 || !baseExpense.installmentGroupId) return [];

  const futureInstallments: Expense[] = [];
  const baseDate = new Date(`${baseExpense.date}T00:00:00`);

  for (let i = 2; i <= total; i++) {
    // Calcular fecha: mismo día del mes, N meses después
    const installmentDate = new Date(baseDate);
    installmentDate.setMonth(baseDate.getMonth() + (i - 1));
    // Ajustar si el día no existe en el mes destino (ej: 31 de enero → 28 de febrero)
    if (installmentDate.getDate() !== baseDate.getDate()) {
      installmentDate.setDate(0); // último día del mes anterior
    }
    const dateStr = installmentDate.toISOString().split('T')[0]!;

    futureInstallments.push({
      id: generateId(),
      type: 'delayed',
      amount: baseExpense.amount, // Mismo monto por cuota
      description: baseExpense.description,
      categoryId: baseExpense.categoryId,
      date: dateStr,
      transferredAt: null,
      createdAt: now,
      updatedAt: now,
      periodId: null, // Se asignará al período correspondiente cuando llegue
      tags: baseExpense.tags,
      installmentGroupId: baseExpense.installmentGroupId,
      installmentNumber: i,
      installmentTotal: total,
    });
  }

  return futureInstallments;
}

