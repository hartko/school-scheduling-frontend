import React, { useState, useRef, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
interface SearchableSelectFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}
 
export const SearchableSelectField = React.forwardRef<HTMLInputElement, SearchableSelectFieldProps>(
  ({ label, error, hint, options, placeholder = 'Search...', value, onChange, disabled, id, className }, ref) => {
    const generatedId = useId();
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-') ?? generatedId;
 
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
 
    const wrapperRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
 
    const selectedOption = options.find((o) => o.value === value);
    const filtered = query
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options;
 
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setOpen(false);
          setQuery('');
          setActiveIndex(-1);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);
 
    useEffect(() => {
      if (activeIndex >= 0 && listRef.current) {
        const item = listRef.current.children[activeIndex] as HTMLElement;
        item?.scrollIntoView({ block: 'nearest' });
      }
    }, [activeIndex]);
 
    const selectOption = (option: { value: string; label: string }) => {
      onChange?.(option.value);
      setQuery('');
      setOpen(false);
      setActiveIndex(-1);
    };
 
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
        setOpen(true);
        return;
      }
      switch (e.key) {
        case 'ArrowDown': setActiveIndex((i) => Math.min(i + 1, filtered.length - 1)); break;
        case 'ArrowUp':   setActiveIndex((i) => Math.max(i - 1, 0)); break;
        case 'Enter':
          if (activeIndex >= 0 && filtered[activeIndex]) selectOption(filtered[activeIndex]);
          break;
        case 'Escape':
          setOpen(false);
          setQuery('');
          setActiveIndex(-1);
          break;
      }
    };
 
    return (
      <div className="flex flex-col gap-0.5">
        {label && <label htmlFor={inputId} className="form-label">{label}</label>}
        <div ref={wrapperRef} className="relative">
          <input
            ref={ref}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
            aria-controls={`${inputId}-listbox`}
            aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
            autoComplete="off"
            disabled={disabled}
            placeholder={placeholder}
            value={open ? query : (selectedOption?.label ?? '')}
            className={cn('form-input pr-8', error && 'error', className)}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
            onKeyDown={handleKeyDown}
          />
          <span aria-hidden="true" className={cn('pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 transition-transform duration-150', open && 'rotate-180')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 5L7 9.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          {open && (
            <ul ref={listRef} id={`${inputId}-listbox`} role="listbox" className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-ink-200 bg-white py-1 shadow-md">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-ink-400 select-none">No results found</li>
              ) : (
                filtered.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${inputId}-option-${index}`}
                    role="option"
                    aria-selected={option.value === value}
                    onMouseDown={(e) => { e.preventDefault(); selectOption(option); }}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cn(
                      'cursor-pointer px-3 py-2 text-sm select-none',
                      index === activeIndex ? 'bg-accent/10 text-accent' : 'text-ink-700 hover:bg-ink-50',
                      option.value === value && 'font-medium'
                    )}
                  >
                    {option.label}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        {error && <p className="form-error">{error}</p>}
        {hint && !error && <p className="text-xs text-ink-400 mt-1">{hint}</p>}
      </div>
    );
  }
);
SearchableSelectField.displayName = 'SearchableSelectField';