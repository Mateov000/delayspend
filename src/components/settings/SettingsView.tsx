import { useState } from 'react';
import { BudgetSettings } from './BudgetSettings';
import { ChevronDown, ChevronUp, Target, Bell, Plus } from 'lucide-react';
import { useReminderStore } from '../../store/useReminderStore';

interface SettingsSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

interface SettingsViewProps {
  onOpenReminders?: () => void;
  onOpenNewReminder?: () => void;
}

export function SettingsView({ onOpenReminders, onOpenNewReminder }: SettingsViewProps) {
  const [openSection, setOpenSection] = useState<string | null>('budgets');
  const { reminders } = useReminderStore();
  const activeRemindersCount = reminders.filter((r) => r.isActive).length;

  const sections: SettingsSection[] = [
    {
      id: 'budgets',
      title: 'Presupuesto por categoría',
      subtitle: 'Límites de gasto por rubro',
      icon: <Target className="w-4 h-4" />,
      content: <BudgetSettings />,
    },
    {
      id: 'reminders',
      title: 'Recordatorios de gastos',
      subtitle: `${activeRemindersCount} recordatorio(s) activo(s)`,
      icon: <Bell className="w-4 h-4" />,
      content: (
        <div className="flex flex-col gap-3 py-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            Configurá avisos para pedir dinero periódicamente o planificar gastos recurrentes sin que interfieran con tus balances actuales.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenReminders}
              className="flex-1 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ver y administrar ({reminders.length})</span>
            </button>
            <button
              type="button"
              onClick={onOpenNewReminder}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>
        </div>
      ),
    },
  ];

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <div className="px-1">
        <h2 className="text-base font-bold text-slate-800">Ajustes</h2>
        <p className="text-[12px] text-slate-400 font-medium mt-0.5">
          Configuración de tu experiencia DelaySpend
        </p>
      </div>

      {sections.map((section) => {
        const isOpen = openSection === section.id;
        return (
          <div
            key={section.id}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs"
          >
            {/* Header del acordeón */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer hover:bg-slate-50 transition-colors"
              aria-expanded={isOpen}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center shrink-0">
                {section.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-slate-800 block">{section.title}</span>
                <span className="text-[11px] text-slate-400 font-medium">{section.subtitle}</span>
              </div>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {/* Contenido del acordeón */}
            {isOpen && (
              <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                {section.content}
              </div>
            )}
          </div>
        );
      })}

      {/* Espacio para tab bar */}
      <div className="h-4" />
    </div>
  );
}

