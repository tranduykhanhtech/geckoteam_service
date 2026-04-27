import { useState, useEffect } from 'react';
import { CustomerTable } from './CustomerTable';
import { Button } from '../../components/ui/button';
import { 
  Users, UserPlus, TrendingUp, Search, 
  Calendar, Heart, Star, Sparkles, 
  ChevronRight, ArrowUpRight
} from 'lucide-react';
import { useCRMStore } from '../../store/crmStore';
import { CustomerModal } from './CustomerModal';
import { cn } from '../../lib/utils';

export function CRMView() {
  const { customers, isLoading, fetchCustomers } = useCRMStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomer(null);
  };

  // Metrics calculations
  const totalCustomers = customers.length;
  const totalSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const avgSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;
  
  const filteredCustomers = customers.filter(c => 
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone?.includes(searchQuery)
  );

  if (isLoading && customers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50/50">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-slate-900 animate-spin" />
          <Users className="h-4 w-4 text-slate-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 text-slate-400 font-medium tracking-wider uppercase text-[10px]">Syncing Members</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 bg-slate-50 min-h-full overflow-y-auto pb-24">
      {/* Apple Style Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Directory</h2>
          <p className="text-slate-500 font-medium text-sm">Manage your customer relationships.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search customers..."
              className="pl-11 pr-6 h-11 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-100 outline-none w-full md:w-80 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
          title="Community" 
          value={totalCustomers.toString()} 
          icon={<Users className="h-5 w-5" />}
          subtitle="Registered members"
        />
        <MetricCard 
          title="Revenue Share" 
          value={`$${totalSpent.toLocaleString()}`} 
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="Customer lifetime value"
        />
        <MetricCard 
          title="Average" 
          value={`$${avgSpent.toFixed(0)}`} 
          icon={<Star className="h-5 w-5" />}
          subtitle="Value per member"
        />
      </div>

      {/* Main Content Area */}
      <div className="apple-card overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                 <Users className="h-4 w-4 text-slate-900" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 tracking-tight">Member Registry</h3>
           </div>
        </div>
        <div className="overflow-x-auto">
          <CustomerTable 
            customers={filteredCustomers} 
            isLoading={isLoading} 
            onEditCustomer={handleEditCustomer} 
          />
        </div>
      </div>
      
      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        editCustomer={selectedCustomer} 
      />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MetricCard({ title, value, icon, subtitle }: any) {
  return (
    <div className="apple-card p-8 bg-white group border border-slate-100/50">
       <div className="flex justify-between items-start mb-6">
          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
             {icon}
          </div>
       </div>
       
       <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-slate-900 tracking-tight mb-1">{value}</h3>
          <p className="text-[11px] font-medium text-slate-400">{subtitle}</p>
       </div>
    </div>
  );
}

function Loader2({ className }: any) {
  return <TrendingUp className={className} />; // Fallback if Loader2 icon missing
}
