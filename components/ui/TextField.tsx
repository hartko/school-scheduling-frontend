import React from 'react';
import { cn } from '@/lib/utils';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-0.5">
        {label && <label htmlFor={inputId} className="form-label">{label}</label>}
        <input
          ref={ref}
          id={inputId}
          className={cn('form-input', error && 'error', className)}
          {...props}
        />
        {error && <p className="form-error">{error}</p>}
        {hint && !error && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
      </div>
    );
  }
);
TextField.displayName = 'TextField';


