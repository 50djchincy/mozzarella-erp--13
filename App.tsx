
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Wallet,
  Zap,
  Users,
  Receipt,
  Handshake,
  BarChart3,
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  UserCircle,
  LogOut,
  Loader2
} from 'lucide-react';
import { ViewType, UserRole, User, Account, Customer } from './types';
import { AuthProvider, useAuth } from './components/AuthContext';
import LoginPage from './components/LoginPage';
import DashboardView from './components/DashboardView';
import MoneyLabView from './components/MoneyLabView';
import DailyOpsView from './components/DailyOpsView';
import StaffHubView from './components/StaffHubView';
import ExpensesView from './components/ExpensesView';
import SettlementView from './components/SettlementView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import { useFirestoreSync } from './hooks/useFirestoreSync';

const AppContent: React.FC = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Firestore-backed state
  const {
    data: accounts,
    loading: accountsLoading,
    addOrUpdateItem: addOrUpdateAccount
  } = useFirestoreSync<Account>('accounts', [], 'name', { enabled: !!user });

  const {
    data: customers,
    loading: customersLoading,
    addOrUpdateItem: addOrUpdateCustomer
  } = useFirestoreSync<Customer>('customers', [], 'name', { enabled: !!user });

  // Multi-state loading check
  const loading = authLoading || accountsLoading || customersLoading;



  if (loading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 font-medium animate-pulse">Initializing Mozzarella ERP...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'money-lab', label: 'Money Lab', icon: Wallet },
    { id: 'daily-ops', label: 'Daily Ops', icon: Zap },
    { id: 'staff-hub', label: 'Staff Hub', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'settlement', label: 'Settlement', icon: Handshake },
    { id: 'reports', label: 'Reporting', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView />;
      case 'money-lab': return <MoneyLabView role={user.role} accounts={accounts} setAccounts={() => { }} />;
      case 'daily-ops': return <DailyOpsView role={user.role} accounts={accounts} customers={customers} />;
      case 'staff-hub': return <StaffHubView role={user.role} accounts={accounts} />;
      case 'expenses': return <ExpensesView role={user.role} accounts={accounts} currentUser={{ name: user.name }} />;
      case 'settlement': return <SettlementView role={user.role} accounts={accounts} customers={customers} />;
      case 'reports': return <ReportsView />;
      case 'settings': return <SettingsView currentUser={user} onUpdateRole={(role) => { }} customers={customers} setCustomers={() => { }} />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-bold text-xl text-white">M</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-white">Mozzarella</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-tighter">FINANCIAL ERP</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeView === item.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 font-bold'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
              <UserCircle size={24} className="text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-white">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-16 lg:h-20 flex items-center justify-between px-6 lg:px-10 shrink-0 bg-slate-950/50 backdrop-blur-md z-30 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold lg:text-2xl text-slate-100 capitalize">
              {navItems.find(n => n.id === activeView)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-indigo-400 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-950"></span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Live Mode
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 lg:px-10 pb-24 lg:pb-10 pt-4">
          {renderContent()}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 safe-area-bottom z-40 border-t border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`flex flex-col items-center gap-1 transition-colors px-3 py-1 rounded-lg ${activeView === item.id ? 'text-indigo-400' : 'text-slate-500'
                  }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label.split(' ')[0]}</span>
              </button>
            ))}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col items-center gap-1 text-slate-500"
            >
              <Menu size={20} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Menu</span>
            </button>
          </div>
        </nav>
      </main>

      {/* Mobile Drawer Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div
            className="absolute left-0 top-0 bottom-0 w-80 bg-slate-900 shadow-2xl flex flex-col transform transition-transform duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-xl text-white">M</span>
                </div>
                <h1 className="font-bold text-lg text-white">Mozzarella</h1>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400">
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as ViewType);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${activeView === item.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800'
                    }`}
                >
                  <item.icon size={22} />
                  <span className="font-medium text-lg">{item.label}</span>
                </button>
              ))}
            </nav>

            <div className="p-6 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <UserCircle size={32} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-bold text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 font-black uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
