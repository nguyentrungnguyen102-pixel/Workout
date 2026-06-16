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
    <div className="flex flex-col h-screen max-w-md mx-auto bg-background">
      <div className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border flex z-50">
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
