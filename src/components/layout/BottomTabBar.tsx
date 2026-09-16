import { Home, BarChart2, Settings } from 'lucide-react';

export type TabId = 'home' | 'analytics' | 'settings';

interface BottomTabBarProps {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; Icon: typeof Home }[] = [
  { id: 'home', label: 'Inicio', Icon: Home },
  { id: 'analytics', label: 'Análisis', Icon: BarChart2 },
  { id: 'settings', label: 'Ajustes', Icon: Settings },
];

export function BottomTabBar({ activeTab, onChange }: BottomTabBarProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm border-t border-slate-200/80 flex items-stretch pointer-events-auto">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors cursor-pointer ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600 active:text-slate-700'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={`text-[10px] font-semibold tracking-wide ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

