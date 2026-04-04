import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { useAuthStore } from '../store/useAuthStore';
import { CATEGORY_ICONS } from '../store/useInventoryStore';
import { LoadingSpinner } from '../components/shared/index';

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function StatCard({ icon, label, value, sub, gradient, to }) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={`card p-5 relative overflow-hidden group ${to ? 'cursor-pointer' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
      <div className="relative z-10 flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl glass flex items-center justify-center text-xl flex-shrink-0 border border-white/10">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold gradient-text tabular-nums">{value ?? '—'}</p>
          <p className="text-sm text-text-secondary mt-0.5">{label}</p>
          {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
        </div>
      </div>
    </motion.div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

function WeeklyBar({ data }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="card p-5">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Scans — last 8 weeks</h3>
      <div className="flex items-end gap-2 h-24">
        {data.map((d, i) => {
          const pct = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">{d.count}</span>
              <motion.div
                className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-cyan-500 group-hover:from-brand-500 group-hover:to-cyan-400 transition-all"
                initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: 'easeOut' }}
                style={{ minHeight: d.count > 0 ? 4 : 0 }}
                title={`${d.label}: ${d.count}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            {i % 2 === 0 && <span className="text-[10px] text-text-muted">{d.label}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FrequencyBar({ name, displayName, count, max }) {
  const pct = Math.max((count / max) * 100, 4);
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-text-secondary w-28 truncate capitalize flex-shrink-0">{displayName || name}</p>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-brand-600 to-cyan-500 rounded-full"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      </div>
      <span className="text-xs font-semibold text-text-muted w-5 text-right tabular-nums">{count}</span>
    </div>
  );
}

function CategoryBreakdown({ data }) {
  if (!data?.length) return null;
  const total  = data.reduce((s, d) => s + d.count, 0);
  const colors = ['from-violet-500 to-purple-600','from-cyan-500 to-blue-600','from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600','from-emerald-500 to-green-600','from-red-500 to-rose-700',
    'from-sky-500 to-cyan-700','from-indigo-500 to-violet-700','from-teal-500 to-emerald-700'];
  return (
    <div className="card p-5">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Inventory by category</h3>
      <div className="space-y-3">
        {data.slice(0, 8).map(({ category, count }, i) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={category} className="flex items-center gap-3">
              <span className="text-base flex-shrink-0">{CATEGORY_ICONS[category] || '📦'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text-secondary capitalize">{category || 'other'}</span>
                  <span className="text-xs text-text-muted tabular-nums">{count} · {pct}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full bg-gradient-to-r ${colors[i % colors.length]}`}
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityFeed({ events, isLoading }) {
  const navigate = useNavigate();
  const ICONS = { scan: '📸', favorite: '❤️' };
  return (
    <div className="card p-5">
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Recent activity</h3>
      {isLoading ? (
        <div className="flex justify-center py-6"><div className="w-5 h-5 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" /></div>
      ) : events.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">No activity yet.</p>
      ) : (
        <ol className="space-y-3">
          {events.map((ev, i) => (
            <motion.li key={ev.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-3 ${ev.link ? 'cursor-pointer group' : ''}`}
              onClick={() => ev.link && navigate(ev.link)}>
              {ev.image ? (
                <img src={ev.image} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-white/5" loading="lazy"/>
              ) : (
                <div className="w-9 h-9 rounded-lg glass flex items-center justify-center text-base flex-shrink-0 border border-white/10">
                  {ICONS[ev.type] || '•'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm text-text-secondary line-clamp-1 leading-snug ${ev.link ? 'group-hover:text-brand-300 transition-colors' : ''}`}>
                  {ev.title}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{timeAgo(ev.createdAt)}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { stats, activity, isLoading, isLoadingActivity, fetchStats, fetchActivity } = useAnalyticsStore();
  const user = useAuthStore((s) => s.user);
  useEffect(() => { fetchStats(); fetchActivity(); }, [fetchStats, fetchActivity]);

  const maxIngCount = stats?.mostUsedIngredients?.[0]?.count || 1;

  return (
    <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 overflow-hidden">
      <div className="blob w-72 h-72 bg-violet-600/15 top-0 right-0 animate-blob" />
      <div className="blob w-56 h-56 bg-cyan-500/10 bottom-20 left-0 animate-blob-delay" />

      <div className="mb-8 relative z-10">
        <h1 className="text-3xl font-bold text-text-primary">
          <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Welcome back, <span className="text-text-secondary font-medium">{user?.displayName}</span> — here's your kitchen at a glance.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24"><LoadingSpinner size="lg" label="Loading dashboard…" /></div>
      ) : (
        <div className="space-y-6 relative z-10">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="📸" label="Total scans" value={stats?.totalDetections}
              sub="fridge sessions" gradient="from-violet-500/20 to-purple-600/10" to="/history" />
            <StatCard icon="🧊" label="Inventory items" value={stats?.inventorySize}
              sub="items tracked" gradient="from-cyan-500/20 to-blue-600/10" to="/inventory" />
            <StatCard icon="❤️" label="Saved recipes" value={stats?.savedRecipesCount}
              sub="in favourites" gradient="from-pink-500/20 to-rose-600/10" to="/favorites" />
            <StatCard icon="📅" label="Meals cooked"
              value={stats?.mealPlanCompletion ? `${stats.mealPlanCompletion.cooked}/${stats.mealPlanCompletion.total}` : '—'}
              sub={stats?.mealPlanCompletion ? `${stats.mealPlanCompletion.pct}% this week` : 'this week'}
              gradient="from-amber-500/20 to-orange-600/10" to="/mealplan" />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WeeklyBar data={stats?.weeklyScans} />
            <CategoryBreakdown data={stats?.categoryBreakdown} />
          </div>

          {/* Ingredients + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-4">Most detected ingredients</h3>
              {!stats?.mostUsedIngredients?.length ? (
                <p className="text-sm text-text-muted text-center py-6">
                  No scans yet.{' '}
                  <Link to="/upload" className="gradient-text font-medium hover:opacity-80">Scan your fridge →</Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.mostUsedIngredients.map((item) => (
                    <FrequencyBar key={item.name} name={item.name} displayName={item.displayName}
                      count={item.count} max={maxIngCount} />
                  ))}
                </div>
              )}
            </div>
            <ActivityFeed events={activity} isLoading={isLoadingActivity} />
          </div>
        </div>
      )}
    </main>
  );
}