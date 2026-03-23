import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export function PageHeader({ title, description, actions, icon }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-11 h-11 bg-accent/10 rounded-xl flex items-center justify-center text-accent flex-shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {description && (
            <p className="text-sm text-ink-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
