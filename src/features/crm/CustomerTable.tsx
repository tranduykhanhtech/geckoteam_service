import { Mail, Phone, Edit2, User, MoreHorizontal, History, Star } from 'lucide-react';
import type { Customer } from '../../store/crmStore';

interface CustomerTableProps {
  customers: Customer[];
  isLoading: boolean;
  onEditCustomer: (customer: Customer) => void;
}

export function CustomerTable({ customers, isLoading, onEditCustomer }: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        Loading customers...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        No customers found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-[#F1F5F9] text-slate-500 font-bold border-b border-slate-200">
          <tr>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px]">Customer Name</th>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px]">Contact Info</th>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px]">Stats</th>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px]">Last Visit</th>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px] text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-50/80 transition-all duration-200 group">
              <td className="px-6 py-5">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mr-4 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-[15px] group-hover:text-emerald-600 transition-colors">
                      {customer.full_name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Member since {new Date(customer.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {customer.email || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {customer.phone || 'N/A'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Total Spent</span>
                    <span className="text-sm font-black text-slate-900">${customer.total_spent?.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Visits</span>
                    <span className="text-sm font-black text-slate-900">{customer.visit_count}</span>
                  </div>
                  <div className="flex flex-col px-3 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter flex items-center gap-1">
                      <Star className="h-2 w-2 fill-emerald-600" /> Points
                    </span>
                    <span className="text-sm font-black text-emerald-700">{customer.points || 0}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5">
                {customer.last_visit ? (
                  <div className="flex items-center gap-2 text-slate-600 font-medium">
                    <History className="h-3.5 w-3.5 text-slate-400" />
                    {new Date(customer.last_visit).toLocaleDateString()}
                  </div>
                ) : (
                  <span className="text-slate-300 italic text-xs">Never visited</span>
                )}
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onEditCustomer(customer)}
                    className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                    <MoreHorizontal className="h-4 w-4" />
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
