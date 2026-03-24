'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, Building2, BookOpen, Clock, Layers,
  UserCheck, CalendarDays, GraduationCap, LogOut, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const navGroups = [
  {
    label: 'Resources',
    items: [
      { href: '/teachers', label: 'Teachers', icon: Users },
      { href: '/rooms', label: 'Rooms', icon: Building2 },
      { href: '/subjects', label: 'Subjects', icon: BookOpen },
      { href: '/schedules', label: 'Schedules', icon: Clock },
      { href: '/sections', label: 'Sections', icon: Layers },
    ],
  },
  {
    label: 'Assignments',
    items: [
      { href: '/teacher-subjects', label: 'Teacher Subjects', icon: UserCheck },
      { href: '/room-schedules', label: 'Room Schedules', icon: CalendarDays },
      { href: '/class-groups', label: 'Class Groups', icon: GraduationCap },
    ],
  },
];

interface SidebarProps {
  onNavClick?: () => void;
}

export function Sidebar({ onNavClick }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 h-full flex flex-col"
      style={{ background: '#353232' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
            <Image src="/images/domi.png" alt="SCI" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <p className="font-display text-base font-bold text-white leading-tight">SCI</p>
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.6)' }}>v1.0</p>
          </div>
          <button
            onClick={onNavClick}
            className="md:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-2 text-xs font-mono uppercase tracking-widest"
              style={{ color: 'rgba(230, 226, 229, 0.5)' }}>
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link href={item.href} className={cn('sidebar-link', active && 'active')} onClick={onNavClick}>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ background: 'rgba(255,255,255,0.25)' }}>
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Admin</p>
            <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>admin@sci.edu</p>
          </div>
        </div>
        <Link href="/login" className="sidebar-link" onClick={onNavClick}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
