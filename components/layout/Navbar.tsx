'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Menu, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBreadcrumb } from '@/context/BreadcrumbContext';

const sectionLabels: Record<string, string> = {
  teachers:         'Teachers',
  rooms:            'Rooms',
  subjects:         'Subjects',
  schedules:        'Schedules',
  sections:         'Sections',
  'teacher-subjects': 'Teacher Subjects',
  'room-schedules': 'Room Schedules',
  'class-groups':   'Class Groups',
};

const skipSegments = new Set(['show']);

const actionLabels: Record<string, string> = {
  create: 'New',
  edit:   'Edit',
};

function buildCrumbs(segments: string[], dynamicLabels: Record<string, string>) {
  const crumbs: { label: string; href: string }[] = [];
  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    if (skipSegments.has(seg)) continue;
    if (/^\d+$/.test(seg)) {
      // Use the dynamic label registered by the page (e.g. schedule name), skip if none
      const dynamic = dynamicLabels[seg];
      if (dynamic) crumbs.push({ label: dynamic, href: path });
      continue;
    }
    crumbs.push({ label: sectionLabels[seg] ?? actionLabels[seg] ?? seg, href: path });
  }
  return crumbs;
}

interface NavbarProps { onMenuToggle?: () => void; }

export function Navbar({ onMenuToggle }: NavbarProps) {
  const pathname = usePathname();
  const { labels } = useBreadcrumb();
  const crumbs = buildCrumbs(pathname.split('/').filter(Boolean), labels);

  return (
    <header className="h-14 flex items-center px-5 gap-4 sticky top-0 z-30"
      style={{ background: '#ffffff', borderBottom: '1px solid #eeeeee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <button onClick={onMenuToggle} className={cn('btn-icon md:hidden')} aria-label="Toggle menu">
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumbs.length === 0
          ? <span className="text-sm font-semibold" style={{ color: '#333' }}>Dashboard</span>
          : crumbs.map((crumb, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#e91e8c', opacity: 0.5 }} />}
                  {isLast ? (
                    <span className="text-sm font-semibold truncate" style={{ color: '#e91e8c' }}>
                      {crumb.label}
                    </span>
                  ) : (
                    <Link href={crumb.href} className="text-sm font-medium truncate transition-colors hover:text-pink-600"
                      style={{ color: '#757575' }}>
                      {crumb.label}
                    </Link>
                  )}
                </span>
              );
            })
        }
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="btn-icon relative" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: '#e91e8c' }} />
        </button>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #e91e8c, #c2185b)' }}>
          A
        </div>
      </div>
    </header>
  );
}
