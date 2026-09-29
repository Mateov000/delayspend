import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ExpenseReminder,
  ReminderInput,
  ReminderRecurrenceType,
} from './types';
import { generateId } from '../utils/id';

export interface AdvanceResult {
  success: boolean;
  error?: string;
  willDeactivate?: boolean;
  newNextDate?: string | null;
  advancedCount?: number;
}

export interface ReminderState {
  reminders: ExpenseReminder[];
  addReminder: (input: ReminderInput) => ExpenseReminder;
  updateReminder: (id: string, input: Partial<ReminderInput>) => void;
  deleteReminder: (id: string) => void;
  toggleActive: (id: string) => void;
  markIgnored: (id: string) => void;
  markIncorporated: (id: string) => void;
  advanceReminder: (id: string, count: number) => AdvanceResult;
  fastForwardReminder: (id: string) => void;
  getDueReminders: (referenceDate?: string) => ExpenseReminder[];
}

const STORAGE_KEY = 'delayspend_reminders_v1';

function addDaysToDateStr(dateStr: string, days: number): string {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10) - 1;
  const d = parseInt(parts[2]!, 10);
  const date = new Date(y, m, d);
  date.setDate(date.getDate() + days);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  const nextD = String(date.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

function addMonthsToDateStr(dateStr: string, months: number): string {
  const parts = dateStr.split('-');
  const y = parseInt(parts[0]!, 10);
  const m = parseInt(parts[1]!, 10) - 1;
  const d = parseInt(parts[2]!, 10);
  const date = new Date(y, m, d);
  date.setMonth(date.getMonth() + months);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  const nextD = String(date.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

/**
 * Calcula la siguiente fecha del recordatorio siguiendo una cola estricta paso a paso (Opción C).
 * Avanza estrictamente desde currentDateStr (la fecha programada del ciclo actual),
 * de modo que si se acumulan varios ciclos, el usuario pueda procesar cada repetición
 * en orden secuencial sin que se salteen ciclos pasados.
 */
export function calculateNextReminderDate(
  currentDateStr: string,
  recurrenceType: ReminderRecurrenceType,
  intervalDays?: number
): string | null {
  if (recurrenceType === 'none') {
    return null;
  }

  if (recurrenceType === 'custom_days') {
    const days = Math.max(1, intervalDays || 1);
    return addDaysToDateStr(currentDateStr, days);
  }

  if (recurrenceType === 'weekly') {
    return addDaysToDateStr(currentDateStr, 7);
  }

  if (recurrenceType === 'monthly') {
    return addMonthsToDateStr(currentDateStr, 1);
  }

  return null;
}

/**
 * Calcula cuántas repeticiones restantes le quedan a un recordatorio según su condición de fin.
 * Devuelve null si no tiene límite ('never' con recurrencia).
 */
export function calculateRemainingOccurrences(
  reminder: ExpenseReminder
): number | null {
  if (reminder.recurrenceType === 'none') {
    return reminder.occurrencesCount >= 1 ? 0 : 1;
  }

  if (reminder.endCondition === 'after_occurrences') {
    const max = reminder.maxOccurrences || 0;
    return Math.max(0, max - reminder.occurrencesCount);
  }

  if (reminder.endCondition === 'after_date') {
    if (!reminder.endDate) return null;
    let count = 0;
    let curr: string | null = reminder.nextDate;
    while (curr && curr <= reminder.endDate && count < 1000) {
      count++;
      curr = calculateNextReminderDate(curr, reminder.recurrenceType, reminder.recurrenceIntervalDays);
    }
    return count;
  }

  return null;
}

/**
 * Simula adelantar Y pagos en un recordatorio y calcula la próxima fecha agendada
 * y si el recordatorio debe darse por finalizado.
 */
export function calculateAdvanceNextDate(
  reminder: ExpenseReminder,
  advanceCount: number
): { newNextDate: string | null; willDeactivate: boolean } {
  if (advanceCount <= 0) {
    return { newNextDate: reminder.nextDate, willDeactivate: false };
  }

  const remaining = calculateRemainingOccurrences(reminder);
  let willDeactivate = false;

  if (remaining !== null && advanceCount >= remaining) {
    willDeactivate = true;
  }

  let curr: string | null = reminder.nextDate;
  for (let i = 0; i < advanceCount; i++) {
    if (!curr) {
      willDeactivate = true;
      break;
    }
    curr = calculateNextReminderDate(curr, reminder.recurrenceType, reminder.recurrenceIntervalDays);
    if (!curr) {
      willDeactivate = true;
      break;
    }
  }

  return {
    newNextDate: curr,
    willDeactivate,
  };
}

/**
 * Calcula cuántas repeticiones vencidas / acumuladas existen hasta la fecha de referencia (hoy por defecto).
 * Si hay 1 sola fecha vencida, devuelve 1. Si pasaron 3 ciclos, devuelve 3.
 */
export function countPendingOccurrences(
  reminder: ExpenseReminder,
  referenceDateStr?: string
): number {
  const todayStr = referenceDateStr || new Date().toISOString().split('T')[0]!;
  if (!reminder.isActive || reminder.nextDate > todayStr) {
    return 0;
  }
  if (reminder.recurrenceType === 'none') {
    return 1;
  }

  let count = 0;
  let currentDate: string | null = reminder.nextDate;
  let simOccurrences = reminder.occurrencesCount;

  // Límite de seguridad contra loops infinitos
  while (currentDate && currentDate <= todayStr && count < 365) {
    count++;
    simOccurrences++;

    if (
      reminder.endCondition === 'after_date' &&
      reminder.endDate &&
      currentDate >= reminder.endDate
    ) {
      break;
    }
    if (
      reminder.endCondition === 'after_occurrences' &&
      reminder.maxOccurrences &&
      simOccurrences >= reminder.maxOccurrences
    ) {
      break;
    }

    currentDate = calculateNextReminderDate(
      currentDate,
      reminder.recurrenceType,
      reminder.recurrenceIntervalDays
    );
  }

  return Math.max(1, count);
}

function sanitizeReminder(raw: unknown): ExpenseReminder | null {
  if (!raw || typeof raw !== 'object') return null;
  const item = raw as Record<string, unknown>;

  if (typeof item.id !== 'string' || !item.id) return null;
  if (typeof item.title !== 'string') return null;

  const amount = Number(item.amount) || 0;
  const startDate =
    typeof item.startDate === 'string' && item.startDate
      ? item.startDate
      : new Date().toISOString().split('T')[0]!;
  const nextDate =
    typeof item.nextDate === 'string' && item.nextDate ? item.nextDate : startDate;

  const recurrenceType: ReminderRecurrenceType =
    item.recurrenceType === 'custom_days' ||
    item.recurrenceType === 'weekly' ||
    item.recurrenceType === 'monthly'
      ? item.recurrenceType
      : 'none';

  const endCondition =
    item.endCondition === 'after_date' || item.endCondition === 'after_occurrences'
      ? item.endCondition
      : 'never';

  const createdAt =
    typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString();
  const updatedAt =
    typeof item.updatedAt === 'string' ? item.updatedAt : createdAt;

  return {
    id: item.id,
    title: item.title.trim(),
    amount: Math.round(amount * 100) / 100,
    categoryId: typeof item.categoryId === 'string' ? (item.categoryId as any) : undefined,
    subcategory: typeof item.subcategory === 'string' ? item.subcategory.trim() : undefined,
    nature: typeof item.nature === 'string' ? (item.nature as any) : undefined,
    startDate,
    nextDate,
    recurrenceType,
    recurrenceIntervalDays:
      typeof item.recurrenceIntervalDays === 'number' && item.recurrenceIntervalDays > 0
        ? Math.round(item.recurrenceIntervalDays)
        : undefined,
    endCondition,
    endDate: typeof item.endDate === 'string' && item.endDate ? item.endDate : null,
    maxOccurrences:
      typeof item.maxOccurrences === 'number' && item.maxOccurrences > 0
        ? Math.round(item.maxOccurrences)
        : null,
    occurrencesCount: Number(item.occurrencesCount) || 0,
    isActive: item.isActive !== false,
    lastAction:
      item.lastAction === 'incorporated' || item.lastAction === 'ignored'
        ? item.lastAction
        : null,
    lastActionDate: typeof item.lastActionDate === 'string' ? item.lastActionDate : null,
    createdAt,
    updatedAt,
  };
}

export const useReminderStore = create<ReminderState>()(
  persist(
    (set, get) => ({
      reminders: [],

      addReminder: (input: ReminderInput) => {
        const now = new Date().toISOString();
        const cleanAmount = Math.max(0, Math.round(Number(input.amount) * 100) / 100);
        const startDate = input.startDate || now.split('T')[0]!;

        const newReminder: ExpenseReminder = {
          id: generateId(),
          title: input.title.trim(),
          amount: cleanAmount,
          categoryId: input.categoryId,
          subcategory: input.subcategory ? input.subcategory.trim() : undefined,
          nature: input.nature,
          startDate,
          nextDate: startDate,
          recurrenceType: input.recurrenceType,
          recurrenceIntervalDays:
            input.recurrenceType === 'custom_days' && input.recurrenceIntervalDays
              ? Math.max(1, Math.round(input.recurrenceIntervalDays))
              : undefined,
          endCondition: input.endCondition,
          endDate: input.endCondition === 'after_date' ? (input.endDate || null) : null,
          maxOccurrences:
            input.endCondition === 'after_occurrences' && input.maxOccurrences
              ? Math.max(1, Math.round(input.maxOccurrences))
              : null,
          occurrencesCount: 0,
          isActive: input.isActive !== false,
          lastAction: null,
          lastActionDate: null,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          reminders: [newReminder, ...state.reminders],
        }));

        return newReminder;
      },

      updateReminder: (id: string, input: Partial<ReminderInput>) => {
        const now = new Date().toISOString();
        set((state) => ({
          reminders: state.reminders.map((r) => {
            if (r.id !== id) return r;

            const updatedStartDate = input.startDate ?? r.startDate;
            // Si la fecha de inicio cambió, reiniciamos nextDate a la nueva fecha de inicio
            const updatedNextDate =
              input.startDate !== undefined && input.startDate !== r.startDate
                ? input.startDate
                : r.nextDate;

            const updatedRecurrence = input.recurrenceType ?? r.recurrenceType;
            const updatedInterval =
              updatedRecurrence === 'custom_days'
                ? input.recurrenceIntervalDays !== undefined
                  ? Math.max(1, Math.round(input.recurrenceIntervalDays))
                  : r.recurrenceIntervalDays
                : undefined;

            return {
              ...r,
              title: input.title !== undefined ? input.title.trim() : r.title,
              amount:
                input.amount !== undefined
                  ? Math.max(0, Math.round(Number(input.amount) * 100) / 100)
                  : r.amount,
              categoryId: input.categoryId !== undefined ? input.categoryId : r.categoryId,
              subcategory:
                input.subcategory !== undefined
                  ? input.subcategory ? input.subcategory.trim() : undefined
                  : r.subcategory,
              nature: input.nature !== undefined ? input.nature : r.nature,
              startDate: updatedStartDate,
              nextDate: updatedNextDate,
              recurrenceType: updatedRecurrence,
              recurrenceIntervalDays: updatedInterval,
              endCondition: input.endCondition ?? r.endCondition,
              endDate:
                (input.endCondition ?? r.endCondition) === 'after_date'
                  ? input.endDate !== undefined
                    ? input.endDate
                    : r.endDate
                  : null,
              maxOccurrences:
                (input.endCondition ?? r.endCondition) === 'after_occurrences'
                  ? input.maxOccurrences !== undefined
                    ? input.maxOccurrences
                    : r.maxOccurrences
                  : null,
              isActive: input.isActive !== undefined ? input.isActive : r.isActive,
              updatedAt: now,
            };
          }),
        }));
      },

      deleteReminder: (id: string) => {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }));
      },

      toggleActive: (id: string) => {
        const now = new Date().toISOString();
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive, updatedAt: now } : r
          ),
        }));
      },

      markIgnored: (id: string) => {
        const now = new Date().toISOString();
        const todayStr = now.split('T')[0]!;

        set((state) => ({
          reminders: state.reminders.map((r) => {
            if (r.id !== id) return r;

            const nextCalculated = calculateNextReminderDate(
              r.nextDate,
              r.recurrenceType,
              r.recurrenceIntervalDays
            );
            const newCount = r.occurrencesCount + 1;

            let willDeactivate = false;
            if (!nextCalculated) {
              willDeactivate = true;
            } else if (
              r.endCondition === 'after_occurrences' &&
              r.maxOccurrences &&
              newCount >= r.maxOccurrences
            ) {
              willDeactivate = true;
            } else if (
              r.endCondition === 'after_date' &&
              r.endDate &&
              nextCalculated > r.endDate
            ) {
              willDeactivate = true;
            }

            return {
              ...r,
              occurrencesCount: newCount,
              nextDate: nextCalculated || r.nextDate,
              isActive: willDeactivate ? false : r.isActive,
              lastAction: 'ignored',
              lastActionDate: todayStr,
              updatedAt: now,
            };
          }),
        }));
      },

      advanceReminder: (id: string, count: number): AdvanceResult => {
        const now = new Date().toISOString();
        const todayStr = now.split('T')[0]!;
        const reminder = get().reminders.find((r) => r.id === id);

        if (!reminder) {
          return { success: false, error: 'Recordatorio no encontrado.' };
        }

        if (count <= 0) {
          return { success: false, error: 'La cantidad de pagos a adelantar debe ser al menos 1.' };
        }

        const remaining = calculateRemainingOccurrences(reminder);
        if (remaining !== null && count > remaining) {
          return {
            success: false,
            error: `Solo quedan ${remaining} pago(s) restante(s) en este recordatorio. No podés adelantar ${count}.`,
          };
        }

        const { newNextDate, willDeactivate } = calculateAdvanceNextDate(reminder, count);
        const updatedCount = reminder.occurrencesCount + count;

        set((state) => ({
          reminders: state.reminders.map((r) => {
            if (r.id !== id) return r;
            return {
              ...r,
              occurrencesCount: updatedCount,
              nextDate: newNextDate || r.nextDate,
              isActive: willDeactivate ? false : r.isActive,
              lastAction: 'incorporated',
              lastActionDate: todayStr,
              updatedAt: now,
            };
          }),
        }));

        return {
          success: true,
          willDeactivate,
          newNextDate,
          advancedCount: count,
        };
      },

      markIncorporated: (id: string) => {
        get().advanceReminder(id, 1);
      },

      fastForwardReminder: (id: string) => {
        const now = new Date().toISOString();
        const todayStr = now.split('T')[0]!;

        set((state) => ({
          reminders: state.reminders.map((r) => {
            if (r.id !== id) return r;

            let curr: string | null = r.nextDate;
            let count = r.occurrencesCount;
            let willDeactivate = false;

            while (curr && curr <= todayStr) {
              count++;
              if (
                r.endCondition === 'after_occurrences' &&
                r.maxOccurrences &&
                count >= r.maxOccurrences
              ) {
                willDeactivate = true;
                break;
              }
              if (
                r.endCondition === 'after_date' &&
                r.endDate &&
                curr >= r.endDate
              ) {
                willDeactivate = true;
                break;
              }

              curr = calculateNextReminderDate(
                curr,
                r.recurrenceType,
                r.recurrenceIntervalDays
              );

              if (!curr) {
                willDeactivate = true;
                break;
              }
            }

            return {
              ...r,
              nextDate: curr || r.nextDate,
              occurrencesCount: count,
              isActive: willDeactivate ? false : r.isActive,
              lastAction: 'ignored',
              lastActionDate: todayStr,
              updatedAt: now,
            };
          }),
        }));
      },

      getDueReminders: (referenceDate?: string) => {
        const todayStr = referenceDate || new Date().toISOString().split('T')[0]!;
        const { reminders } = get();
        return reminders
          .filter((r) => r.isActive && r.nextDate <= todayStr)
          .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return { reminders: [] };
        }
        const state = persistedState as { reminders?: unknown[] };
        if (!Array.isArray(state.reminders)) {
          return { reminders: [] };
        }
        const cleanReminders = state.reminders
          .map(sanitizeReminder)
          .filter((r): r is ExpenseReminder => r !== null);

        return { reminders: cleanReminders };
      },
    }
  )
);

