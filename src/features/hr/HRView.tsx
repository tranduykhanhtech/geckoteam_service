import { useState, useEffect } from 'react';
import { useHRStore } from '../../store/hrStore';
import { EmployeeTable } from './EmployeeTable';
import { NewEmployeeModal } from './NewEmployeeModal';
import { Button } from '../../components/ui/button';
import { Users, Plus, Loader2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export function HRView() {
  const { employees, isLoading, fetchEmployees } = useHRStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const activeCount = employees.filter(e => e.is_active).length;
  const adminCount = employees.filter(e => e.role === 'admin' && e.is_active).length;
  const staffCount = employees.filter(e => e.role === 'staff' && e.is_active).length;

  if (isLoading && employees.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-full bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-slate-50 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">HR Management</h2>
          <p className="text-slate-500 mt-1">Manage staff roles, access, and company profiles.</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            className="bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Active Employees</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
              <Users className="ml-2 h-5 w-5 text-slate-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-800 mb-1">Admins / Managers</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-emerald-900">{adminCount}</p>
              <Badge variant="success" className="ml-2">System Access</Badge>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">Staff (Cashiers)</p>
            <div className="flex items-center">
              <p className="text-2xl font-bold text-blue-900">{staffCount}</p>
              <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200 border-none">POS Access</Badge>
            </div>
          </div>
        </div>
      </div>

      <EmployeeTable />
      
      <NewEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
