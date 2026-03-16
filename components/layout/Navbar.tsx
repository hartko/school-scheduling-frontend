'use client';
import { usePathname } from 'next/navigation';
import { Bell, Menu, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  teachers: 'Teachers',
  rooms: 'Rooms',
  subjects: 'Subjects',
  schedules: 'Schedules',
  sections: 'Sections',
  'teacher-subjects': 'Teacher Subjects',
  'room-schedules': 'Room Schedules',
  'class-groups': 'Class Groups',
};

interface NavbarProps { onMenuToggle?: () => void; }

export function Navbar({ onMenuToggle }: NavbarProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="h-14 flex items-center px-5 gap-4 sticky top-0 z-30"
      style={{ background: '#ffffff', borderBottom: '1px solid #eeeeee', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <button onClick={onMenuToggle} className={cn('btn-icon md:hidden')} aria-label="Toggle menu">
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        <Home className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#bdbdbd' }} />
        {segments.map((seg, i) => (
          <span key={seg} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#e0e0e0' }} />
            <span className="truncate" style={{ color: i === segments.length - 1 ? '#333333' : '#9e9e9e', fontWeight: i === segments.length - 1 ? 600 : 400 }}>
              {routeLabels[seg] ?? seg}
            </span>
          </span>
        ))}
        {segments.length === 0 && <span style={{ color: '#333333', fontWeight: 600 }}>Dashboard</span>}
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
