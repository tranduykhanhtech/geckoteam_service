import { useEffect, lazy, Suspense, useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { cn } from './lib/utils'
import { LayoutDashboard, ShoppingCart, Package, Users, UsersRound, Settings, LogOut, Loader2, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import geckoLogo from './assets/gecko.svg'

// Lazy load features for code splitting
const DashboardOverview = lazy(() => import('./features/dashboard/DashboardOverview').then(m => ({ default: m.DashboardOverview })));
const POSView = lazy(() => import('./features/pos/POSView').then(m => ({ default: m.POSView })));
const InventoryView = lazy(() => import('./features/inventory/InventoryView').then(m => ({ default: m.InventoryView })));
const HRView = lazy(() => import('./features/hr/HRView').then(m => ({ default: m.HRView })));
const OperationsView = lazy(() => import('./features/operations/OperationsView').then(m => ({ default: m.OperationsView })));
const CRMView = lazy(() => import('./features/crm/CRMView').then(m => ({ default: m.CRMView })));
const LoginView = lazy(() => import('./features/auth/LoginView').then(m => ({ default: m.LoginView })));
const RegisterCompanyView = lazy(() => import('./features/auth/RegisterCompanyView').then(m => ({ default: m.RegisterCompanyView })));

const PageLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-slate-50/50">
    <Loader2 className="h-8 w-8 text-slate-900 animate-spin" />
  </div>
);

// Main Layout Component (Only shown when authenticated)
function MainLayout() {
  const { profile, signOut } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager'] },
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['admin', 'manager'] },
    { name: 'HR Management', path: '/hr', icon: Users, roles: ['admin'] },
    { name: 'CRM', path: '/crm', icon: UsersRound, roles: ['admin', 'manager'] },
    { name: 'Operations', path: '/operations', icon: Settings, roles: ['admin'] },
  ];

  const currentRole = profile?.role || 'staff';
  const allowedNavItems = allNavItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex flex-col md:flex-row overflow-hidden font-sans antialiased">
      {/* Apple Style Mobile Header */}
      <header className="md:hidden bg-white/80 backdrop-blur-xl text-slate-900 p-4 flex items-center justify-between z-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img src={geckoLogo} alt="Gecko Logo" className="h-6 w-6" />
          <span className="font-semibold tracking-tight">Gecko</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-slate-50 rounded-xl transition-colors"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Sidebar - Apple Style */}
      <aside
        className={cn(
          "bg-white border-r border-slate-100 text-slate-500 flex flex-col shrink-0 transition-all duration-500 ease-in-out fixed md:relative z-[60] h-full shadow-sm md:shadow-none",
          // Desktop behavior
          "md:translate-x-0",
          isCollapsed ? "md:w-24" : "md:w-72",
          // Mobile behavior
          isMobileMenuOpen ? "translate-x-0 w-72" : "-translate-x-full w-72"
        )}
      >
        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-10 h-6 w-6 bg-white border border-slate-200 text-slate-400 rounded-full items-center justify-center shadow-sm hover:text-slate-900 transition-all z-50"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>

        <div className={cn("p-8", isCollapsed && "md:px-4 md:flex md:justify-center")}>
          <div className="flex items-center justify-between md:block">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
              <img src={geckoLogo} alt="Gecko Logo" className="h-8 w-8 shrink-0" />
              <span className={cn(isCollapsed && "md:hidden")}>Gecko</span>
            </h1>
          </div>

          {profile && (
            <div className={cn(
              "mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100",
              isCollapsed && "md:hidden"
            )}>
              <p className="text-sm font-semibold text-slate-900 truncate">{profile.full_name}</p>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{profile.role}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-2">
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center rounded-xl text-sm font-medium transition-all duration-300",
                  isCollapsed ? "md:justify-center md:px-0 md:py-3.5 px-4 py-3" : "px-4 py-3",
                  isActive
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                )
              }
              title={isCollapsed ? item.name : ""}
            >
              <item.icon className={cn("shrink-0", isCollapsed ? "md:h-5 md:w-5 h-5 w-5 mr-3 md:mr-0" : "mr-3 h-5 w-5")} />
              <span className={cn(isCollapsed && "md:hidden")}>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className={cn("p-6 border-t border-slate-50", isCollapsed && "md:px-2")}>
          <button
            onClick={signOut}
            className={cn(
              "flex items-center w-full rounded-xl text-sm font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all",
              isCollapsed ? "md:justify-center md:py-3.5 py-3 px-4" : "px-4 py-3"
            )}
            title={isCollapsed ? "Log out" : ""}
          >
            <LogOut className={cn("shrink-0", isCollapsed ? "md:h-5 md:w-5 h-5 w-5 mr-3 md:mr-0" : "mr-3 h-5 w-5")} />
            <span className={cn(isCollapsed && "md:hidden")}>Log out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 z-[55] md:hidden backdrop-blur-sm animate-in fade-in duration-500"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {allowedNavItems.some(i => i.path === '/') && (
              <Route path="/" element={<div className="h-full overflow-y-auto"><DashboardOverview /></div>} />
            )}
            {allowedNavItems.some(i => i.path === '/pos') && (
              <Route path="/pos" element={<POSView />} />
            )}
            {allowedNavItems.some(i => i.path === '/inventory') && (
              <Route path="/inventory" element={<div className="h-full overflow-y-auto"><InventoryView /></div>} />
            )}
            {allowedNavItems.some(i => i.path === '/hr') && (
              <Route path="/hr" element={<div className="h-full overflow-y-auto"><HRView /></div>} />
            )}
            {allowedNavItems.some(i => i.path === '/crm') && (
              <Route path="/crm" element={<div className="h-full overflow-y-auto"><CRMView /></div>} />
            )}
            {allowedNavItems.some(i => i.path === '/operations') && (
              <Route path="/operations" element={<div className="h-full overflow-y-auto"><OperationsView /></div>} />
            )}

            {/* Fallback route */}
            <Route path="*" element={<Navigate to={allowedNavItems[0]?.path || '/'} replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-slate-900 animate-spin mb-4" />
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Loading System</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginView />} />
            <Route path="/register" element={<RegisterCompanyView />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="*" element={<MainLayout />} />
        )}
      </Routes>
    </Suspense>
  );
}

export default App
