import React from 'react';
import { cn } from '@/lib/utils';

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-0.5">
        <label htmlFor={inputId} className="flex items-center gap-2 cursor-pointer">
          <input
            ref={ref}
            type="checkbox"
            id={inputId}
            className={cn('w-4 h-4 rounded border-ink-300 text-accent focus:ring-accent/30', className)}
            {...props}
          />
          <span className="text-sm text-ink-700">{label}</span>
        </label>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);
CheckboxField.displayName = 'CheckboxField';