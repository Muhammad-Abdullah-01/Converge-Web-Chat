import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, User, ShieldAlert, LogOut, CheckCircle, AlertCircle } from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/chat',
      name: 'Chats',
      icon: MessageSquare,
    },
    {
      path: '/profile',
      name: 'Profile',
      icon: User,
    },
  ];

  // If user is admin, append dashboard to menu items
  if (user?.role === 'admin') {
    menuItems.push({
      path: '/admin',
      name: 'Admin Panel',
      icon: ShieldAlert,
    });
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-purple-600/5 blur-3xl"></div>

      {/* Main Sidebar */}
      <aside className="glass-panel hidden md:flex h-full w-64 flex-col border-r border-slate-900 bg-slate-950/80">
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-900">
          <Link to="/chat" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-heading">
              ⚡ CONVERGE
            </span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {menuItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Connection State */}
        <div className="border-t border-slate-900 p-4 space-y-4">
          {/* Connection Status Badge */}
          <div className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-1.5 text-xs">
            <span className="text-slate-400 font-medium">Socket Connection</span>
            <div className="flex items-center gap-1.5 font-semibold">
              {isConnected ? (
                <>
                  <span className="text-emerald-400">Connected</span>
                  <CheckCircle size={12} className="text-emerald-400" />
                </>
              ) : (
                <>
                  <span className="text-amber-500 animate-pulse">Connecting...</span>
                  <AlertCircle size={12} className="text-amber-500" />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={user?.avatar}
              alt={user?.username}
              className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user?.username}</p>
              <p className="text-xs truncate text-slate-500 capitalize">{user?.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-red-400 transition duration-200"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <div className="flex h-full w-full flex-col">
        <header className="glass-panel flex h-16 items-center justify-between px-6 border-b border-slate-900 md:hidden">
          <Link to="/chat">
            <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-heading">
              ⚡ CONVERGE
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {menuItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`p-2 rounded-lg transition duration-200 ${
                    isActive ? 'text-indigo-400' : 'text-slate-400'
                  }`}
                >
                  <Icon size={20} />
                </Link>
              );
            })}
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-hidden relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
