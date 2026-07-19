import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Dumbbell, BarChart2, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// W4: 5 tabs -> 3. /history and /body still exist as routes (deep links,
// day/log detail pages, W5 will fold Body into Settings) — they're just no
// longer surfaced as their own nav destinations.
const tabs = [
  { to: '/', label: 'Tập', icon: Dumbbell, end: true },
  { to: '/stats', label: 'Thống kê', icon: BarChart2, end: false },
  { to: '/settings', label: 'Cài đặt', icon: Settings, end: false },
];

// /stats tab should also read as active on its merged-in /history/* pages
// (e.g. /history/day/:date, /history/:logId), since NavLink's own `end`
// matching only handles the /stats prefix itself.
function isStatsActive(pathname: string): boolean {
  return pathname.startsWith('/stats') || pathname.startsWith('/history');
}

export default function Layout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('navCollapsed') === '1');

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem('navCollapsed', next ? '1' : '0');
      return next;
    });
  };

  // Sidebar width and the content offset on <main> must always agree — both
  // are derived from the same `collapsed` flag here so they can never drift
  // apart (e.g. sidebar collapses but content keeps the old padding).
  const asideWidthClass = collapsed ? 'md:w-16' : 'md:w-56 lg:w-60';
  const mainPaddingClass = collapsed ? 'md:pl-16' : 'md:pl-56 lg:pl-60';

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Sidebar — desktop only */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 ${asideWidthClass} bg-card border-r border-border z-50 py-6 px-3 transition-all`}>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Mở menu' : 'Thu gọn menu'}
          title={collapsed ? 'Mở menu' : 'Thu gọn menu'}
          className={`flex items-center gap-2 px-3 py-2 mb-6 rounded-xl text-text-secondary hover:bg-background hover:text-text-main transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>

        {!collapsed && (
          <div className="px-3 mb-8 flex items-center gap-2">
            <span className="text-2xl">💪</span>
            <span className="font-black text-lg text-text-main">WorkoutTracker</span>
          </div>
        )}

        <nav className="flex flex-col gap-1">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) => {
                const active = to === '/stats' ? isActive || isStatsActive(pathname) : isActive;
                return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${active ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-background'}`;
              }}
            >
              {({ isActive }) => {
                const active = to === '/stats' ? isActive || isStatsActive(pathname) : isActive;
                return (
                  <>
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                    {!collapsed && <span>{label}</span>}
                  </>
                );
              }}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className={`flex-1 ${mainPaddingClass} transition-all`}>
        <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto min-h-screen pb-20 md:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border flex z-50">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => {
              const active = to === '/stats' ? isActive || isStatsActive(pathname) : isActive;
              return `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold transition-colors ${
                active ? 'text-primary' : 'text-text-muted'
              }`;
            }}
          >
            {({ isActive }) => {
              const active = to === '/stats' ? isActive || isStatsActive(pathname) : isActive;
              return (
                <>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  <span>{label}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
