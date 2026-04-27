import { useState } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import type { InventoryItem } from '../../store/inventoryStore';
import { 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  Edit2,
  Plus,
  Minus,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

interface InventoryTableProps {
  onEditItem: (item: InventoryItem) => void;
}

export function InventoryTable({ onEditItem }: InventoryTableProps) {
  const { items, adjustStock } = useInventoryStore();
  const [editingState, setEditingState] = useState<{ id: string, type: 'add' | 'deduct' } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('');

  const handleAdjustSubmit = (id: string, isAdd: boolean) => {
    const amount = parseFloat(adjustAmount);
    if (!isNaN(amount) && amount > 0) {
      adjustStock(id, isAdd ? amount : -amount);
    }
    setEditingState(null);
    setAdjustAmount('');
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.quantity <= 0) return { label: 'Out of Stock', variant: 'destructive', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' };
    if (item.quantity <= item.threshold) return { label: 'Low Stock', variant: 'warning', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'In Stock', variant: 'success', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-50">
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Ingredient</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Category</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Level</th>
            <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
            <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium text-xs">
                No inventory records found.
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const status = getStockStatus(item);
              const StatusIcon = status.icon;
              const isEditingAdd = editingState?.id === item.id && editingState.type === 'add';
              const isEditingDeduct = editingState?.id === item.id && editingState.type === 'deduct';
              
              const stockPercentage = Math.min((item.quantity / (item.threshold * 2.5)) * 100, 100);

              return (
                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mr-4 text-slate-400 group-hover:text-slate-900 transition-all">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2 text-sm tracking-tight">
                          {item.name}
                          <button 
                            onClick={() => onEditItem(item)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-slate-900 transition-all"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">ID: {item.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-semibold px-2 py-1 bg-slate-100 rounded text-slate-500 uppercase tracking-wide">
                      {item.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <div className="flex justify-between items-end">
                        <span className={cn(
                          "font-semibold text-base tracking-tight",
                          item.quantity <= item.threshold ? 'text-rose-600' : 'text-slate-900'
                        )}>
                          {Number(item.quantity).toLocaleString()} <span className="text-[10px] font-medium text-slate-400 uppercase ml-0.5">{item.unit}</span>
                        </span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase">
                           Min: {item.threshold}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-1000",
                            item.quantity === 0 ? 'bg-rose-500' : 
                            item.quantity <= item.threshold ? 'bg-amber-500' : 'bg-slate-900'
                          )}
                          style={{ width: `${stockPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={cn(
                      "flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider",
                      status.color
                    )}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.label}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {isEditingAdd ? (
                      <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                        <input
                          type="number"
                          className="w-20 h-9 px-3 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm font-semibold"
                          placeholder="0"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingState(null);
                            if (e.key === 'Enter') handleAdjustSubmit(item.id, true);
                          }}
                        />
                        <button 
                          onClick={() => handleAdjustSubmit(item.id, true)}
                          className="h-9 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold text-[10px] uppercase tracking-wider transition-all"
                        >
                          Add
                        </button>
                      </div>
                    ) : isEditingDeduct ? (
                      <div className="flex items-center justify-end gap-2 animate-in fade-in slide-in-from-right-2 duration-300">
                        <input
                          type="number"
                          className="w-20 h-9 px-3 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none text-sm font-semibold"
                          placeholder="0"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setEditingState(null);
                            if (e.key === 'Enter') handleAdjustSubmit(item.id, false);
                          }}
                        />
                        <button 
                          onClick={() => handleAdjustSubmit(item.id, false)}
                          className="h-9 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 font-semibold text-[10px] uppercase tracking-wider transition-all"
                        >
                          Deduct
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                          onClick={() => setEditingState({ id: item.id, type: 'add' })}
                          title="Restock"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button 
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-rose-500 shadow-sm transition-all"
                          onClick={() => setEditingState({ id: item.id, type: 'deduct' })}
                          title="Use"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
