import React from 'react';
import {
  Bug,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import type { BugItem } from '../types';

interface MetricsOverviewProps {
  bugs: BugItem[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  bugs,
  activeFilter,
  onSelectFilter,
}) => {
  const total = bugs.length;
  const openCount = bugs.filter(b => ['new', 'proposed', 'to do'].includes((b.state || '').toLowerCase())).length;
  const activeCount = bugs.filter(b => ['active', 'in progress', 'committed', 'approved', 'investigating'].includes((b.state || '').toLowerCase())).length;
  const closedCount = bugs.filter(b => ['closed', 'done', 'completed', 'resolved', 'fixed'].includes((b.state || '').toLowerCase())).length;
  const criticalCount = bugs.filter(b => {
    const s = (b.severity || '').toLowerCase();
    return s.includes('1') || s.includes('critical') || s.includes('2') || s.includes('high');
  }).length;

  const distinctPages = new Set(bugs.map(b => b.page_name).filter(Boolean)).size;

  const cards = [
    {
      id: 'all',
      title: 'Total Tracked Bugs',
      value: total,
      sub: `${distinctPages} Active Modules`,
      icon: Bug,
      activeStyle: 'ring-2 ring-sky-600 border-sky-600 bg-sky-50/30',
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      accentColor: 'bg-sky-600',
    },
    {
      id: 'open',
      title: 'New',
      value: openCount,
      sub: 'Awaiting triage or backlog',
      icon: Clock,
      activeStyle: 'ring-2 ring-sky-500 border-sky-500 bg-sky-50/30',
      iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
      accentColor: 'bg-sky-500',
    },
    {
      id: 'active',
      title: 'Committed',
      value: activeCount,
      sub: 'In development or approved',
      icon: Activity,
      activeStyle: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/20',
      iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
      accentColor: 'bg-amber-500',
    },
    {
      id: 'critical',
      title: 'Critical & High',
      value: criticalCount,
      sub: 'Requires prompt attention',
      icon: AlertTriangle,
      activeStyle: 'ring-2 ring-rose-600 border-rose-600 bg-rose-50/20',
      iconBg: 'bg-rose-50 text-rose-700 border-rose-200',
      accentColor: 'bg-rose-600',
    },
    {
      id: 'closed',
      title: 'Resolved & Closed',
      value: closedCount,
      sub: 'Verified by QA and closed',
      icon: CheckCircle2,
      activeStyle: 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/20',
      iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      accentColor: 'bg-emerald-600',
    },
  ];

  return (
    <section id="metrics-overview" aria-label="Key Performance Indicators" className="mb-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5">
        {cards.map((c) => {
          const Icon = c.icon;
          const isSelected = activeFilter === c.id;
          return (
            <button
              id={`btn-metric-filter-${c.id}`}
              key={c.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Filter by ${c.title}: ${c.value} items`}
              onClick={() => onSelectFilter(isSelected ? 'all' : c.id)}
              className={`relative overflow-hidden p-3.5 sm:p-4 rounded-xl text-left bg-white border transition-all duration-150 cursor-pointer shadow-2xs flex flex-col justify-between hover:shadow-xs focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${
                isSelected
                  ? c.activeStyle
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Top Accent Strip */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${c.accentColor}`} aria-hidden="true" />

              <div className="flex items-center justify-between mb-2.5 w-full">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {c.title}
                </span>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center border text-xs ${c.iconBg}`} aria-hidden="true">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold font-display tracking-tight text-slate-900 tabular-nums mb-0.5">
                  {c.value.toLocaleString()}
                </div>
                <div className="text-[11px] font-sans text-slate-500">
                  {c.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
