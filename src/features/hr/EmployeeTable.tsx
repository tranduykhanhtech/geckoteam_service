import { useHRStore } from '../../store/hrStore';
import type { EmployeeProfile } from '../../store/hrStore';
import { Shield, User, Power, PowerOff, Loader2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Joined Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {employees.map((emp) => {
              const isMe = emp.id === currentUser?.id;
              
              return (
                <tr key={emp.id} className={cn("hover:bg-slate-50 transition-colors", !emp.is_active && "opacity-60 bg-slate-50/50")}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className={cn("h-8 w-8 rounded-full flex items-center justify-center mr-3 text-white", emp.role === 'admin' ? "bg-emerald-500" : "bg-slate-300")}>
                        {emp.role === 'admin' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {emp.full_name}
                          {isMe && <Badge variant="secondary" className="text-[9px] py-0 h-4">You</Badge>}
                          {!emp.is_active && <Badge variant="destructive" className="text-[9px] py-0 h-4">Inactive</Badge>}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                          {emp.staff_code || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {emp.email ? (
                        <span className="text-slate-700 font-medium">{emp.email}</span>
                      ) : (
                        <span className="text-slate-300 italic text-xs">No email</span>
                      )}
                      {emp.phone ? (
                        <span className="text-slate-500 text-xs">{emp.phone}</span>
                      ) : (
                        <span className="text-slate-300 italic text-xs">No phone</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isMe ? (
                      <Badge variant={emp.role === 'admin' ? 'success' : 'default'} className="capitalize shadow-none pointer-events-none">
                        {emp.role}
                      </Badge>
                    ) : (
                      <select
                        disabled={loadingId === emp.id}
                        value={emp.role}
                        onChange={(e) => handleRoleChange(emp.id, e.target.value as EmployeeProfile['role'])}
                        className="px-2 py-1 bg-slate-100 border-none rounded text-xs font-medium focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                      >
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(emp.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {loadingId === emp.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      ) : (
                        !isMe && (
                          <button
                            onClick={() => handleStatusToggle(emp.id, emp.is_active)}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              emp.is_active 
                                ? "text-slate-400 hover:text-red-600 hover:bg-red-50" 
                                : "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                            )}
                            title={emp.is_active ? "Deactivate Account" : "Activate Account"}
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
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
