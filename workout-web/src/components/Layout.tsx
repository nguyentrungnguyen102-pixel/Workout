import { Outlet, NavLink } from 'react-router-dom';
import { Dumbbell, Calendar, User, BarChart2, Settings } from 'lucide-react';

const tabs = [
  { to: '/', label: 'Tập', icon: Dumbbell, end: true },
  { to: '/history', label: 'Lịch sử', icon: Calendar, end: false },
  { to: '/body', label: 'Cơ thể', icon: User, end: false },
  { to: '/stats', label: 'Thống kê', icon: BarChart2, end: false },
  { to: '/settings', label: 'Cài đặt', icon: Settings, end: false },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-56 lg:w-60 bg-card border-r border-border z-50 py-6 px-3">
        <div className="px-3 mb-8 flex items-center gap-2">
          <span className="text-2xl">💪</span>
          <span className="font-black text-lg text-text-main">WorkoutTracker</span>
        </div>
        <nav className="flex flex-col gap-1">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-background'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:pl-56 lg:pl-60">
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
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-primary' : 'text-text-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
