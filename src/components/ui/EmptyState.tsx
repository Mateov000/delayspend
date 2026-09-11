import { STRINGS } from '../../constants/strings';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = STRINGS.HISTORY_EMPTY_TITLE,
  description = STRINGS.HISTORY_EMPTY_DESC,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 my-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <Inbox className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
        {description}
      </p>
    </div>
  );
}

