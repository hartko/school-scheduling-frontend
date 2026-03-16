import React from 'react';
import { cn } from '@/lib/utils';

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="flex flex-col gap-0.5">
        {label && <label htmlFor={inputId} className="form-label">{label}</label>}
        <select
          ref={ref}
          id={inputId}
          className={cn('form-input', error && 'error', className)}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && <p className="form-error">{error}</p>}
      </div>
    );
  }
);
SelectField.displayName = 'SelectField';