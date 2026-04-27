import { useState, useEffect } from 'react';
import { useHRStore } from '../../store/hrStore';
import { useStoreStore } from '../../store/storeStore';
import { useAuthStore } from '../../store/authStore';
import { EmployeeTable } from './EmployeeTable';
import { NewEmployeeModal } from './NewEmployeeModal';
import { 
  Users, Loader2, ShieldCheck, 
  UserPlus, Briefcase, ChevronDown
} from 'lucide-react';

export function HRView() {
  const { stores } = useStoreStore();
  const { profile } = useAuthStore();
  const [selectedStore, setSelectedStore] = useState<string>('all');

  const { employees, isLoading, fetchEmployees } = useHRStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = selectedStore === 'all' 
    ? employees 
    : employees.filter(e => e.store_id === selectedStore);

  const activeCount = filteredEmployees.filter(e => e.is_active).length;
  const adminCount = filteredEmployees.filter(e => (e.role === 'admin' || e.role === 'manager') && e.is_active).length;
  const staffCount = filteredEmployees.filter(e => e.role === 'staff' && e.is_active).length;

  if (isLoading && employees.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50/50">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-slate-900 animate-spin" />
          <Users className="h-4 w-4 text-slate-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 text-slate-400 font-medium tracking-wider uppercase text-[10px]">Loading Workforce</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full space-y-8 p-4 md:p-8 bg-slate-50 overflow-y-auto pb-24">
      {/* Apple Style Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">People</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage your workforce and permissions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {profile?.role === 'admin' && (
            <div className="relative group">
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none transition-all shadow-sm hover:border-slate-300"
              >
                <option value="all">All Branches</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-hover:text-slate-900 transition-colors" />
            </div>
          )}
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="apple-btn-primary h-11 px-6 text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            New Member
          </button>
        </div>
      </div>

      {/* Minimalist Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Active Workforce" 
          value={activeCount.toString()} 
          icon={<Users className="h-5 w-5" />}
          subtitle="Team members online"
        />
        <MetricCard 
          title="Privileged Access" 
          value={adminCount.toString()} 
          icon={<ShieldCheck className="h-5 w-5" />}
          subtitle="Admins & Managers"
        />
        <MetricCard 
          title="Operational Staff" 
          value={staffCount.toString()} 
          icon={<Briefcase className="h-5 w-5" />}
          subtitle="Front-line roles"
        />
      </div>

      {/* Main Content Area */}
      <div className="apple-card overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                 <Users className="h-4 w-4 text-slate-900" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 tracking-tight">Staff Directory</h3>
           </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <EmployeeTable data={filteredEmployees} />
        </div>
      </div>
      
      <NewEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MetricCard({ title, value, icon, subtitle }: any) {
  return (
    <div className="apple-card p-8 bg-white group border border-slate-100/50">
       <div className="flex justify-between items-start mb-6">
          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900 transition-colors">
             {icon}
          </div>
       </div>
       
       <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-slate-900 tracking-tight mb-1">{value}</h3>
          <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>
       </div>
    </div>
  );
}
