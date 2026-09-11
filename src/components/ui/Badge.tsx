import { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'real' | 'delayed' | 'transferred' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: BadgeProps) {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    real: 'bg-rose-50 text-rose-700 border-rose-200',
    delayed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    transferred: 'bg-teal-50 text-teal-800 border-teal-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

