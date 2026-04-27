import { useHRStore } from '../../store/hrStore';
import type { EmployeeProfile } from '../../store/hrStore';
import { Shield, User, Power, PowerOff, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

export function EmployeeTable() {
  const { employees, updateRole, toggleStatus } = useHRStore();
  const { profile: currentUser } = useAuthStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRoleChange = async (id: string, newRole: EmployeeProfile['role']) => {
    setLoadingId(id);
    try {
      await updateRole(id, newRole);
    } finally {
      setLoadingId(null);
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    setLoadingId(id);
    try {
      await toggleStatus(id, !currentStatus);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-slate-50">
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Employee</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contact</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Role</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Joined Date</th>
            <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {employees.map((emp) => {
            const isMe = emp.id === currentUser?.id;
            
            return (
              <tr key={emp.id} className={cn("group hover:bg-slate-50/50 transition-colors", !emp.is_active && "opacity-50")}>
                <td className="px-6 py-3">
                  <div className="flex items-center">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mr-4 border border-slate-100 bg-white shadow-sm transition-transform group-hover:scale-105", emp.role === 'admin' ? "text-slate-900" : "text-slate-400")}>
                      {emp.role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {emp.full_name}
                        {isMe && <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-medium">You</span>}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 tracking-wide">
                        {emp.staff_code || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-3">
                  <div className="flex flex-col">
                    <span className="text-slate-600 font-medium text-xs">{emp.email || '—'}</span>
                    <span className="text-slate-400 text-[11px] mt-0.5">{emp.phone || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-3">
                  {isMe ? (
                    <span className="text-xs font-semibold text-slate-900 capitalize px-2.5 py-1 bg-slate-50 rounded-lg">
                      {emp.role}
                    </span>
                  ) : (
                    <select
                      disabled={loadingId === emp.id}
                      value={emp.role}
                      onChange={(e) => handleRoleChange(emp.id, e.target.value as EmployeeProfile['role'])}
                      className="text-xs font-semibold text-slate-900 bg-transparent border-none focus:ring-0 cursor-pointer p-0 hover:text-slate-500 transition-colors"
                    >
                      <option value="staff">Staff</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  )}
                </td>
                <td className="px-6 py-3 text-slate-400 text-xs font-medium">
                  {new Date(emp.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {loadingId === emp.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    ) : (
                      !isMe && (
                        <button
                          onClick={() => handleStatusToggle(emp.id, emp.is_active)}
                          className={cn(
                            "p-2 rounded-xl transition-all duration-300",
                            emp.is_active 
                              ? "text-slate-500 hover:text-rose-500 hover:bg-rose-50" 
                              : "text-slate-900 bg-slate-100 hover:bg-slate-200"
                          )}
                          title={emp.is_active ? "Suspend Account" : "Activate Account"}
                        >
                          {emp.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                        </button>
                      )
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {employees.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium text-xs">
                No active records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
