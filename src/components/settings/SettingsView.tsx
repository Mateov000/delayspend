import { useState } from 'react';
import { BudgetSettings } from './BudgetSettings';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';

interface SettingsSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export function SettingsView() {
  const [openSection, setOpenSection] = useState<string | null>('budgets');

  const sections: SettingsSection[] = [
    {
      id: 'budgets',
      title: 'Presupuesto por categoría',
      subtitle: 'Límites de gasto por rubro',
      icon: <Target className="w-4 h-4" />,
      content: <BudgetSettings />,
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
