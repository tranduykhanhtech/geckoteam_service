import { Mail, Phone, Edit2, User, MoreHorizontal, History, Star, Heart, TrendingUp, Calendar } from 'lucide-react';
import type { Customer } from '../../store/crmStore';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  onEditCustomer: (customer: Customer) => void;
}

export function CustomerTable({ customers, isLoading, onEditCustomer }: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="p-24 flex flex-col items-center justify-center space-y-4">
        <TrendingUp className="h-10 w-10 text-rose-500 animate-bounce" />
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Analyzing Member Data...</p>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-24 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
           <User className="h-8 w-8 text-slate-200" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No VIP members found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-50">
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Member</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Contact</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Metrics</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Engagement</th>
            <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Options</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {customers.map((customer) => (
            <tr key={customer.id} className="group hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-5">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mr-4 text-slate-400 group-hover:text-slate-900 transition-all">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm tracking-tight">
                      {customer.full_name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">Since {new Date(customer.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-slate-600 font-medium text-xs">{customer.email || '—'}</span>
                  <span className="text-slate-400 text-[11px] mt-0.5">{customer.phone || '—'}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Spent</span>
                    <span className="text-sm font-semibold text-slate-900">${customer.total_spent?.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Visits</span>
                    <span className="text-sm font-semibold text-slate-900">{customer.visit_count}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                   <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
                      <Star className="h-3 w-3 text-slate-400" />
                      {customer.points || 0} pts
                   </div>
                   {customer.last_visit && (
                     <span className="text-[10px] text-slate-400 font-medium mt-0.5">Last: {new Date(customer.last_visit).toLocaleDateString()}</span>
                   )}
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => onEditCustomer(customer)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
