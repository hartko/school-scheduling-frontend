import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1.5 mb-3" aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#c2185b', opacity: 0.5 }} />}
            {isLast || !item.href ? (
              <span
                className="text-sm font-semibold"
                style={{ color: isLast ? '#e91e8c' : '#757575' }}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-sm font-medium transition-colors"
                style={{ color: '#757575' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e91e8c')}
                onMouseLeave={e => (e.currentTarget.style.color = '#757575')}
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
