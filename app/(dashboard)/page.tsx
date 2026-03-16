'use client';
import { useTeachers }       from '@/hooks/useTeachers';
import { useRooms }          from '@/hooks/useRooms';
import { useSubjects }       from '@/hooks/useSubjects';
import { useSchedules }      from '@/hooks/useSchedules';
import { useSections }       from '@/hooks/useSections';
import { useClassGroups }    from '@/hooks/useClassGroups';
import { Users, Building2, BookOpen, Clock, Layers, GraduationCap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface StatConfig {
  label: string;
  icon: React.ElementType;
  href: string;
  iconBg: string;
  iconColor: string;
}

const STAT_CONFIG: StatConfig[] = [
  { label: 'Teachers',     icon: Users,         href: '/teachers',     iconBg: '#fce4ec', iconColor: '#e91e8c' },
  { label: 'Rooms',        icon: Building2,     href: '/rooms',        iconBg: '#f3e5f5', iconColor: '#9c27b0' },
  { label: 'Subjects',     icon: BookOpen,      href: '/subjects',     iconBg: '#fce4ec', iconColor: '#c2185b' },
  { label: 'Schedules',    icon: Clock,         href: '/schedules',    iconBg: '#f8bbd0', iconColor: '#ad1457' },
  { label: 'Sections',     icon: Layers,        href: '/sections',     iconBg: '#fce4ec', iconColor: '#e91e8c' },
  { label: 'Class Groups', icon: GraduationCap, href: '/class-groups', iconBg: '#f3e5f5', iconColor: '#7b1fa2' },
];

export default function DashboardPage() {
  // Fetch page 1 with limit 1 — we only need `pagination.total` for the count
  const { data: teachersData }  = useTeachers({ page: 1, limit: 1 });
  const { data: roomsData }     = useRooms({ page: 1, limit: 1 });
  const { data: subjectsData }  = useSubjects({ page: 1, limit: 1 });
  const { data: schedulesData } = useSchedules({ page: 1, limit: 1 });
  const { data: sectionsData }  = useSections({ page: 1, limit: 1 });
  const { data: cgData }        = useClassGroups({ page: 1, limit: 1 });

  const counts = [
    teachersData?.pagination.total,
    roomsData?.pagination.total,
    subjectsData?.pagination.total,
    schedulesData?.pagination.total,
    sectionsData?.pagination.total,
    cgData?.pagination.total,
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm mt-1 text-ink-500">Welcome back, Admin. Here&apos;s your school at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {STAT_CONFIG.map((s, i) => {
          const Icon  = s.icon;
          const count = counts[i];
          return (
            <Link key={s.label} href={s.href}
              className="card p-5 group transition-all hover:-translate-y-0.5"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.iconBg }}>
                  <Icon className="w-5 h-5" style={{ color: s.iconColor }} />
                </div>
                <ArrowRight className="w-4 h-4 text-ink-200 group-hover:text-accent transition-colors" />
              </div>
              <p className="font-display text-3xl font-bold text-ink-900">
                {count ?? <span className="inline-block w-8 h-7 rounded bg-ink-100 animate-pulse" />}
              </p>
              <p className="text-sm mt-0.5 text-ink-500">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Workflow guide */}
      <div className="card p-6">
        <h2 className="section-title mb-1">Getting Started</h2>
        <p className="text-sm mb-5 text-ink-500">Follow these steps to set up your school schedule</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '01', title: 'Set Up Resources',
              items: ['Add Teachers', 'Add Rooms', 'Add Subjects', 'Add Schedules', 'Add Sections'],
              bg: '#fce4ec', border: '#f48fb1', num: '#e91e8c',
            },
            {
              step: '02', title: 'Create Assignments',
              items: ['Assign Subject → Teacher', 'Assign Schedule → Room'],
              bg: '#f3e5f5', border: '#ce93d8', num: '#9c27b0',
            },
            {
              step: '03', title: 'Build Class Groups',
              items: ['Link Teacher-Subject + Room-Schedule + Section together'],
              bg: '#fce4ec', border: '#f48fb1', num: '#c2185b',
            },
          ].map((phase) => (
            <div key={phase.step} className="rounded-xl p-4" style={{ background: phase.bg, border: `1px solid ${phase.border}` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: phase.num }}>{phase.step}</span>
                <p className="font-semibold text-sm text-ink-900">{phase.title}</p>
              </div>
              <ul className="space-y-1.5">
                {phase.items.map((it) => (
                  <li key={it} className="flex items-start gap-2 text-xs text-ink-700">
                    <span className="mt-0.5 font-bold" style={{ color: phase.num }}>→</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
