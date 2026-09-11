import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'highlight';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, variant = 'default', className = '', ...props }, ref) => {
    const baseStyles = 'rounded-2xl transition-all duration-150';

    const variantStyles = {
      default: 'bg-white border border-slate-200/80 shadow-xs',
      elevated: 'bg-white border border-slate-200 shadow-md shadow-slate-200/50',
      highlight: 'bg-indigo-50/70 border border-indigo-200/80 shadow-sm',
    }[variant];

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

