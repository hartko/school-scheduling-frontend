'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Users, Building2, BookOpen, Clock, Layers, GraduationCap,
  ArrowRight, Sunrise, Sunset, Timer, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

// ─── Static Data ──────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Teachers',     count: 12, icon: Users,         href: '/teachers',     iconBg: '#fce4ec', iconColor: '#e91e8c' },
  { label: 'Rooms',        count: 8,  icon: Building2,     href: '/rooms',        iconBg: '#f3e5f5', iconColor: '#9c27b0' },
  { label: 'Subjects',     count: 20, icon: BookOpen,      href: '/subjects',     iconBg: '#fce4ec', iconColor: '#c2185b' },
  { label: 'Schedules',    count: 6,  icon: Clock,         href: '/schedules',    iconBg: '#f8bbd0', iconColor: '#ad1457' },
  { label: 'Sections',     count: 15, icon: Layers,        href: '/sections',     iconBg: '#fce4ec', iconColor: '#e91e8c' },
  { label: 'Class Groups', count: 34, icon: GraduationCap, href: '/class-groups', iconBg: '#f3e5f5', iconColor: '#7b1fa2' },
];

const TEACHERS = [
  { name: 'Ben Torres',    short: 'BT', firstClass: '07:00', lastClass: '13:00', days: 3, subjects: 3 },
  { name: 'Ana Santos',    short: 'AS', firstClass: '07:30', lastClass: '14:30', days: 3, subjects: 2 },
  { name: 'Lea Cruz',      short: 'LC', firstClass: '08:00', lastClass: '12:00', days: 2, subjects: 2 },
  { name: 'Marco Reyes',   short: 'MR', firstClass: '08:30', lastClass: '17:00', days: 5, subjects: 5 },
  { name: 'Clara Bautista',short: 'CB', firstClass: '09:00', lastClass: '16:00', days: 5, subjects: 4 },
  { name: 'Mia Lim',       short: 'ML', firstClass: '10:00', lastClass: '18:00', days: 5, subjects: 5 },
];

const DAY_LOAD = [
  { day: 'Mon', classes: 18 },
  { day: 'Tue', classes: 14 },
  { day: 'Wed', classes: 20 },
  { day: 'Thu', classes: 16 },
  { day: 'Fri', classes: 22 },
  { day: 'Sat', classes: 8  },
];


const ROOM_UTIL = [
  { room: 'Rm 101', used: 5, total: 6 },
  { room: 'Rm 102', used: 4, total: 6 },
  { room: 'Rm 103', used: 6, total: 6 },
  { room: 'Rm 201', used: 2, total: 6 },
  { room: 'Lab 1',  used: 3, total: 5 },
  { room: 'Gym',    used: 1, total: 3 },
];

const ALERTS = [
  { type: 'warning', msg: 'Room 103 is fully booked on Wednesday' },
  { type: 'ok',      msg: '100% of teachers have assigned subjects' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toMins(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minsToHrs(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return min === 0 ? `${h}h` : `${h}h ${min}m`;
}

const teacherChartData = TEACHERS.map((t) => ({
  name: t.short,
  fullName: t.name,
  weeklyMins: (toMins(t.lastClass) - toMins(t.firstClass)) * t.days,
  firstClass: t.firstClass,
  lastClass: t.lastClass,
  subjects: t.subjects,
}));

const maxWeeklyMins = Math.max(...teacherChartData.map((d) => d.weeklyMins));
const byFirstClass = [...TEACHERS].sort((a, b) => toMins(a.firstClass) - toMins(b.firstClass));
const byLastClass  = [...TEACHERS].sort((a, b) => toMins(b.lastClass)  - toMins(a.lastClass));
const byHours      = [...teacherChartData].sort((a, b) => b.weeklyMins - a.weeklyMins);
const bySubs       = [...TEACHERS].sort((a, b) => b.subjects - a.subjects);

// ─── Tooltips ─────────────────────────────────────────────────────────────────

function HoursTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg border border-ink-200">
      <p className="font-semibold text-ink-900 mb-1">{d.fullName}</p>
      <p className="text-ink-500">First class: <span className="font-bold text-accent">{d.firstClass}</span></p>
      <p className="text-ink-500">Last class: <span className="font-bold text-accent">{d.lastClass}</span></p>
      <p className="text-ink-500">Weekly: <span className="font-bold text-ink-900">{minsToHrs(d.weeklyMins)}</span></p>
    </div>
  );
}
function SimpleTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-lg border border-ink-200">
      <p className="font-semibold text-ink-900">{label}</p>
      <p className="text-ink-500">{payload[0].name ?? 'Value'}: <span className="font-bold text-accent">{payload[0].value}</span></p>
    </div>
  );
}

// ─── Rank Card ────────────────────────────────────────────────────────────────

function RankCard({ icon: Icon, label, items, accent }: {
  icon: React.ElementType;
  label: string;
  items: { name: string; value: string; code: string }[];
  accent: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + '22' }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="font-semibold text-sm text-ink-900">{label}</h3>
      </div>
      <div className="space-y-2.5">
        {items.map((it, i) => (
          <div key={it.name} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
              style={{ background: i === 0 ? accent : '#f5f5f5', color: i === 0 ? '#fff' : '#616161' }}>
              {i + 1}
            </span>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#e91e8c,#9c27b0)' }}>
              {it.code}
            </div>
            <span className="text-sm text-ink-800 flex-1 truncate">{it.name}</span>
            <span className="text-sm font-bold shrink-0" style={{ color: accent }}>{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm mt-1 text-ink-500">Welcome back, Admin. Here&apos;s your school at a glance.</p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon;
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
              <p className="font-display text-3xl font-bold text-ink-900">{s.count}</p>
              <p className="text-sm mt-0.5 text-ink-500">{s.label}</p>
            </Link>
          );
        })}
      </div>

      {/* ── Alerts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALERTS.map((a, i) => (
          <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm border ${
            a.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {a.type === 'warning'
              ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
              : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />}
            {a.msg}
          </div>
        ))}
      </div>

      {/* ── Row 1: Teacher hours + Day load ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="font-semibold text-sm text-ink-900 mb-1">Weekly Hours per Teacher</h2>
          <p className="text-xs text-ink-400 mb-4">Hover for time-in / time-out detail</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={teacherChartData} barSize={28} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${Math.round(v / 60)}h`} tick={{ fontSize: 11, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
              <Tooltip content={<HoursTooltip />} cursor={{ fill: 'rgba(233,30,140,0.06)' }} />
              <Bar dataKey="weeklyMins" radius={[6, 6, 0, 0]}>
                {teacherChartData.map((entry) => (
                  <Cell key={entry.name}
                    fill={entry.weeklyMins === maxWeeklyMins ? 'url(#gradHigh)' : 'url(#gradLow)'} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e91e8c" /><stop offset="100%" stopColor="#c2185b" />
                </linearGradient>
                <linearGradient id="gradLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f06292" /><stop offset="100%" stopColor="#e91e8c88" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-sm text-ink-900 mb-1">Class Load by Day</h2>
          <p className="text-xs text-ink-400 mb-4">Total classes scheduled per weekday + shape overview</p>
          <div className="grid grid-cols-2 gap-2">
            <ResponsiveContainer width="100%" height={195}>
              <BarChart data={DAY_LOAD} barSize={22} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9e9e9e' }} axisLine={false} tickLine={false} />
                <Tooltip content={<SimpleTooltip />} cursor={{ fill: 'rgba(233,30,140,0.06)' }} />
                <Bar dataKey="classes" name="Classes" radius={[5, 5, 0, 0]} fill="#e91e8c" />
              </BarChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={195}>
              <RadarChart data={DAY_LOAD.map((d) => ({ subject: d.day, A: d.classes }))} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <PolarGrid stroke="#e0e0e0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#9e9e9e' }} />
                <PolarRadiusAxis tick={false} axisLine={false} />
                <Radar dataKey="A" stroke="#e91e8c" fill="#e91e8c" fillOpacity={0.25} dot={{ r: 3, fill: '#e91e8c' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Room util ── */}
      <div className="grid grid-cols-1 gap-4">

        {/* Room utilization */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-sm text-ink-900">Room Utilization</h2>
          </div>
          <p className="text-xs text-ink-400 mb-4">Slots used vs. available</p>
          <div className="space-y-3">
            {ROOM_UTIL.map((r) => {
              const pct = Math.round((r.used / r.total) * 100);
              const full = pct === 100;
              return (
                <div key={r.room}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-ink-700">{r.room}</span>
                    <span className={`text-xs font-bold ${full ? 'text-rose-500' : 'text-ink-900'}`}>
                      {r.used}/{r.total}{full ? ' · full' : ''}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${pct}%`,
                      background: full
                        ? 'linear-gradient(90deg,#ef5350,#c62828)'
                        : 'linear-gradient(90deg,#e91e8c,#9c27b0)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Rankings row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RankCard icon={Sunrise} label="Earliest First Class" accent="#e91e8c"
          items={byFirstClass.slice(0, 4).map((t) => ({ name: t.name, value: t.firstClass, code: t.short }))} />
        <RankCard icon={Sunset} label="Latest Last Class" accent="#9c27b0"
          items={byLastClass.slice(0, 4).map((t) => ({ name: t.name, value: t.lastClass, code: t.short }))} />
        <RankCard icon={Timer} label="Most Weekly Hours" accent="#c2185b"
          items={byHours.slice(0, 4).map((t) => ({ name: t.fullName, value: minsToHrs(t.weeklyMins), code: t.name }))} />
        <RankCard icon={BookOpen} label="Most Subjects Taught" accent="#7b1fa2"
          items={bySubs.slice(0, 4).map((t) => ({ name: t.name, value: `${t.subjects} subj.`, code: t.short }))} />
      </div>

      {/* ── Workflow guide ── */}
      <div className="card p-6">
        <h2 className="section-title mb-1">Getting Started</h2>
        <p className="text-sm mb-5 text-ink-500">Follow these steps to set up your school schedule</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Set Up Resources',
              items: ['Add Teachers', 'Add Rooms', 'Add Subjects', 'Add Schedules', 'Add Sections'],
              bg: '#fce4ec', border: '#f48fb1', num: '#e91e8c' },
            { step: '02', title: 'Create Assignments',
              items: ['Assign Subject → Teacher', 'Assign Schedule → Room'],
              bg: '#f3e5f5', border: '#ce93d8', num: '#9c27b0' },
            { step: '03', title: 'Build Class Groups',
              items: ['Link Teacher-Subject + Room-Schedule + Section together'],
              bg: '#fce4ec', border: '#f48fb1', num: '#c2185b' },
          ].map((phase) => (
            <div key={phase.step} className="rounded-xl p-4"
              style={{ background: phase.bg, border: `1px solid ${phase.border}` }}>
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
