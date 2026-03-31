import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnalyticsStore } from '../store/useAnalyticsStore';
import { useAuthStore } from '../store/useAuthStore';
import { CATEGORY_ICONS } from '../store/useInventoryStore';
import { LoadingSpinner } from '../components/shared/index';

// ── Helpers ───────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'brand', to }) {
  const colorMap = {
    brand:  'bg-brand-50  text-brand-600',
    accent: 'bg-accent-50 text-accent-600',
    purple: 'bg-purple-50 text-purple-600',
    teal:   'bg-teal-50   text-teal-600',
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={to ? { y: -2 } : undefined}
      transition={{ duration: 0.3 }}
      className={`card p-5 flex items-start gap-4 ${to ? 'cursor-pointer hover:shadow-card-hover transition-shadow duration-200' : ''}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-text-primary tabular-nums">{value}</p>
        <p className="text-sm font-medium text-text-secondary mt-0.5">{label}</p>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

// ── Mini bar chart (pure CSS) ─────────────────────────────────
function BarChart({ data, label }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">{label}</h3>
      <div className="flex items-end gap-1.5 h-24">
        {data.map((d, i) => {
          const pct = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 0);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-xs text-text-muted opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                {d.count}
              </span>
              <motion.div
                className="w-full rounded-t-sm bg-brand-400 group-hover:bg-brand-500 transition-colors"
                initial={{ height: 0 }}
                animate={{ height: `${pct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
                style={{ minHeight: d.count > 0 ? 4 : 0 }}
                title={`${d.label}: ${d.count} scan${d.count !== 1 ? 's' : ''}`}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels — show every other to avoid crowding */}
      <div className="flex gap-1.5 mt-1.5">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            {i % 2 === 0 && (
              <span className="text-[10px] text-text-muted">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal frequency bar ──────────────────────────────────
function FrequencyBar({ name, displayName, count, max }) {
  const pct = Math.max((count / max) * 100, 4);
  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-text-primary w-28 truncate capitalize flex-shrink-0">{displayName || name}</p>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-brand-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-semibold text-text-muted w-6 text-right tabular-nums">{count}</span>
    </div>
  );
}

// ── Category donut (CSS only) ─────────────────────────────────
function CategoryBreakdown({ data }) {
  if (!data?.length) return null;
  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = [
    'bg-brand-500', 'bg-accent-400', 'bg-purple-400', 'bg-teal-400',
    'bg-blue-400', 'bg-pink-400', 'bg-amber-400', 'bg-red-400', 'bg-slate-400',
  ];

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Inventory by category
      </h3>
      <div className="space-y-2.5">
        {data.slice(0, 8).map(({ category, count }, i) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={category} className="flex items-center gap-3">
              <span className="text-base flex-shrink-0">{CATEGORY_ICONS[category] || '📦'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-text-primary capitalize">{category || 'other'}</span>
                  <span className="text-xs text-text-muted tabular-nums">{count} · {pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${colors[i % colors.length]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Activity feed ─────────────────────────────────────────────
const ACTIVITY_ICONS = { scan: '📸', favorite: '❤️' };

function ActivityFeed({ events, isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Recent activity
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-6"><LoadingSpinner size="sm" /></div>
      ) : events.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">No activity yet.</p>
      ) : (
        <ol className="space-y-3" role="list">
          {events.map((event, i) => (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              className={`flex items-start gap-3 ${event.link ? 'cursor-pointer group' : ''}`}
              onClick={() => event.link && navigate(event.link)}
              role={event.link ? 'button' : undefined}
              tabIndex={event.link ? 0 : undefined}
              onKeyDown={(e) => e.key === 'Enter' && event.link && navigate(event.link)}
            >
              {/* Icon or thumbnail */}
              {event.image ? (
                <img
                  src={event.image}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-slate-100"
                  aria-hidden="true"
                  loading="lazy"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base flex-shrink-0">
                  {ACTIVITY_ICONS[event.type] || '•'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className={`text-sm text-text-primary line-clamp-1 leading-snug
                               ${event.link ? 'group-hover:text-brand-600 transition-colors' : ''}`}>
                  {event.title}
                </p>
                {event.subtitle && (
                  <p className="text-xs text-red-500 mt-0.5">{event.subtitle}</p>
                )}
                <p className="text-xs text-text-muted mt-0.5">{timeAgo(event.createdAt)}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── Nutrition summary strip ───────────────────────────────────
function NutritionSummary({ nutrition }) {
  if (!nutrition) return null;
  const items = [
    { label: 'Avg calories / item', value: nutrition.avgCalories, unit: 'kcal', color: 'text-brand-600' },
    { label: 'Avg protein',         value: nutrition.avgProtein,  unit: 'g',    color: 'text-blue-600'  },
    { label: 'Avg carbs',           value: nutrition.avgCarbs,    unit: 'g',    color: 'text-amber-600' },
    { label: 'Avg fat',             value: nutrition.avgFat,      unit: 'g',    color: 'text-rose-600'  },
  ];
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
        Fridge nutrition avg <span className="font-normal normal-case text-text-muted">· across {nutrition.totalItems} available items</span>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map(({ label, value, unit, color }) => (
          <div key={label} className="text-center">
            <p className={`text-xl font-bold tabular-nums ${color}`}>{value}{unit}</p>
            <p className="text-xs text-text-muted mt-0.5 leading-snug">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main dashboard page ───────────────────────────────────────
export default function Dashboard() {
  const { stats, activity, isLoading, isLoadingActivity, fetchStats, fetchActivity } = useAnalyticsStore();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetchStats();
    fetchActivity();
  }, [fetchStats, fetchActivity]);

  const maxIngredientCount = stats?.mostUsedIngredients?.[0]?.count || 1;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-text-primary">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Welcome back, {user?.displayName} — here's what's happening in your kitchen.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner size="lg" label="Loading dashboard…" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Stat cards ──────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon="📸" color="brand"
              label="Total scans"
              value={stats?.totalDetections ?? '—'}
              sub="fridge scan sessions"
              to="/history"
            />
            <StatCard
              icon="🧊" color="teal"
              label="Inventory items"
              value={stats?.inventorySize ?? '—'}
              sub="items tracked"
              to="/inventory"
            />
            <StatCard
              icon="❤️" color="accent"
              label="Saved recipes"
              value={stats?.savedRecipesCount ?? '—'}
              sub="in your favourites"
              to="/favorites"
            />
            <StatCard
              icon="📅" color="purple"
              label="Meals cooked"
              value={stats?.mealPlanCompletion ? `${stats.mealPlanCompletion.cooked}/${stats.mealPlanCompletion.total}` : '—'}
              sub={stats?.mealPlanCompletion ? `${stats.mealPlanCompletion.pct}% this week` : 'this week'}
              to="/mealplan"
            />
          </div>

          {/* ── Nutrition summary ────────────────────────────── */}
          {stats?.nutritionSummary && (
            <NutritionSummary nutrition={stats.nutritionSummary} />
          )}

          {/* ── Charts row ───────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={stats?.weeklyScans}
              label="Scans — last 8 weeks"
            />
            <CategoryBreakdown data={stats?.categoryBreakdown} />
          </div>

          {/* ── Most used ingredients + activity ─────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Most used ingredients */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
                Most detected ingredients
              </h3>
              {!stats?.mostUsedIngredients?.length ? (
                <p className="text-sm text-text-muted py-4 text-center">
                  No ingredients scanned yet.{' '}
                  <Link to="/upload" className="text-brand-600 hover:underline">Scan your fridge →</Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.mostUsedIngredients.map((item) => (
                    <FrequencyBar
                      key={item.name}
                      name={item.name}
                      displayName={item.displayName}
                      count={item.count}
                      max={maxIngredientCount}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Activity feed */}
            <ActivityFeed events={activity} isLoading={isLoadingActivity} />
          </div>
        </div>
      )}
    </main>
  );
}