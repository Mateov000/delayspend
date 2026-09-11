import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-slate-50 border-x border-slate-200/80 relative flex flex-col pb-28 shadow-sm">
        {children}
      </div>
    </div>
  );
}

