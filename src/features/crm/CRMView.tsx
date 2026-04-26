import { useState, useEffect } from 'react';
import { CustomerTable } from './CustomerTable';
import { Button } from '../../components/ui/button';
import { Users, UserPlus, TrendingUp, Search, Calendar } from 'lucide-react';
import { useCRMStore } from '../../store/crmStore';
import { CustomerModal } from './CustomerModal';

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

  return (
    <div className="flex-1 space-y-8 p-8 bg-[#F8FAFC] min-h-full overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-1 bg-emerald-500 rounded-full" />
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Customer Relationship</h2>
          </div>
          <p className="text-slate-500 font-medium">Manage your customer database, track loyalty, and view purchase history.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search customers..."
              className="pl-10 pr-4 h-11 bg-white border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-64 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            className="h-11 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 px-6"
            onClick={() => setIsModalOpen(true)}
          >
            <UserPlus className="mr-2 h-5 w-5" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Customers Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Users className="h-24 w-24 text-slate-900" />
          </div>
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 text-slate-600">
              <Users className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Active Customers</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900">{totalCustomers}</p>
              <span className="text-emerald-500 text-xs font-bold flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                Live
              </span>
            </div>
          </div>
        </div>
        
        {/* Total Revenue Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-emerald-600">
            <TrendingUp className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Customer LTV</p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-slate-900">${totalSpent.toLocaleString()}</p>
              <div className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Total</div>
            </div>
          </div>
        </div>

        {/* Avg Value Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-blue-600">
            <Calendar className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Average Order Value</p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-slate-900">${avgSpent.toFixed(1)}</p>
              <div className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase">Per User</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <CustomerTable 
          customers={filteredCustomers} 
          isLoading={isLoading} 
          onEditCustomer={handleEditCustomer} 
        />
      </div>
      
      {/* Modals */}
      <CustomerModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        editCustomer={selectedCustomer} 
      />
    </div>
  );
}
