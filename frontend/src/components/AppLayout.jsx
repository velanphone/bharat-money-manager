import { useAuth } from '../context/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Settings, LogOut, Wallet } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cx(...inputs) {
  return twMerge(clsx(inputs));
}

export default function AppLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900">Bharat Money</h1>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-zinc-200 sticky top-0 h-screen overflow-y-auto">
        <div className="p-6 border-b border-zinc-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-brand-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 leading-tight">
            Bharat<br />Money Manager
          </h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                )
              }
            >
              <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 font-bold border border-zinc-200">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-zinc-900 truncate">My Account</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-600 hover:bg-rose-50 transition-all group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 px-6 py-3 flex justify-around items-center z-20 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cx(
                'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
                isActive ? 'text-brand-600' : 'text-zinc-400 hover:text-zinc-900'
              )
            }
          >
            <item.icon className={cx("w-6 h-6", item.name === 'Transactions' && "bg-brand-600 text-white rounded-full p-1.5 w-10 h-10 shadow-md shadow-brand-500/30 transform -translate-y-4 border-4 border-zinc-50")} />
            <span className={cx("text-[10px] font-medium", item.name === 'Transactions' && "hidden")}>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
