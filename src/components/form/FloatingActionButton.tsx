import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export function FloatingActionButton({
  onClick,
  ariaLabel = 'Agregar nuevo registro',
}: FloatingActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/30 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-4 focus:ring-slate-400"
      style={{
        bottom: 'max(1.5rem, calc(var(--sab, 0px) + 1.25rem))',
      }}
    >
      <Plus className="w-7 h-7 stroke-[2.5]" />
    </button>
  );
}

