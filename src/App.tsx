import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { cn } from './lib/utils'
import { LayoutDashboard, ShoppingCart, Package, Users, UsersRound, Settings, LogOut, Loader2 } from 'lucide-react'
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
    <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
  </div>
);

// Main Layout Component (Only shown when authenticated)
function MainLayout() {
  const { profile, signOut } = useAuthStore();

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    { name: 'POS', path: '/pos', icon: ShoppingCart, roles: ['admin', 'manager', 'staff'] },
    { name: 'Inventory', path: '/inventory', icon: Package, roles: ['admin', 'manager'] },
    { name: 'HR Management', path: '/hr', icon: Users, roles: ['admin'] },
    { name: 'CRM', path: '/crm', icon: UsersRound, roles: ['admin', 'manager'] },
    { name: 'Operations', path: '/operations', icon: Settings, roles: ['admin'] },
  ];

  const currentRole = profile?.role || 'staff';
  const allowedNavItems = allNavItems.filter(item => item.roles.includes(currentRole));

  return (
    <div className="h-screen max-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
            <img src={geckoLogo} alt="Gecko Logo" className="h-8 w-8" />
            Gecko
          </h1>
          {profile && (
            <div className="mt-4 px-3 py-2 bg-slate-800 rounded-md border border-slate-700">
              <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-emerald-400 capitalize">{profile.role}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
          {allowedNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-emerald-400"
                    : "hover:bg-slate-800 text-slate-300 hover:text-white"
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={signOut}
            className="flex items-center w-full px-3 py-2.5 rounded-md text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Log out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
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
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Loading Gecko POS...</p>
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
