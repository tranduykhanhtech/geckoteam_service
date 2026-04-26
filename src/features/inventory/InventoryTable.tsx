import { useState } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import type { InventoryItem } from '../../store/inventoryStore';
import { 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  Edit2,
  Plus,
  Minus
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
    if (item.quantity <= 0) return { label: 'Out of Stock', variant: 'destructive', icon: AlertCircle };
    if (item.quantity <= item.threshold) return { label: 'Low Stock', variant: 'warning', icon: AlertCircle };
    return { label: 'Healthy', variant: 'success', icon: CheckCircle2 };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-[#F1F5F9] text-slate-500 font-bold border-b border-slate-200">
          <tr>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px]">Ingredient & Source</th>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px]">Category</th>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px]">Current Inventory</th>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px]">Inventory Status</th>
            <th className="px-6 py-5 uppercase tracking-widest text-[10px] text-right">Inventory Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => {
            const status = getStockStatus(item);
            const StatusIcon = status.icon;
            const isEditingAdd = editingState?.id === item.id && editingState.type === 'add';
            const isEditingDeduct = editingState?.id === item.id && editingState.type === 'deduct';
            
            // Calculate percentage for progress bar (cap at 100%)
            const stockPercentage = Math.min((item.quantity / (item.threshold * 3)) * 100, 100);

            return (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-all duration-200 group">
                <td className="px-6 py-5">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center mr-4 group-hover:bg-white group-hover:shadow-sm transition-all duration-300">
                      <Package className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2 text-[15px]">
                        {item.name}
                        <button 
                          onClick={() => onEditItem(item)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-lg transition-all"
                        >
                          <Edit2 className="h-3 w-3 text-slate-400" />
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tighter">SKU: {item.id.slice(0, 12).toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                    {item.category_name}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <div className="flex justify-between items-baseline">
                      <span className={cn(
                        "font-black text-base font-mono",
                        status.variant === 'destructive' ? 'text-red-600' : 'text-slate-900'
                      )}>
                        {Number(item.quantity).toLocaleString()} <span className="text-[10px] font-bold text-slate-400 uppercase">{item.unit}</span>
                      </span>
                      {item.unit !== item.weight_volume_unit && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          {Number(item.quantity * item.weight_volume_value).toLocaleString()} {item.weight_volume_unit}
                        </span>
                      )}
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          status.variant === 'destructive' ? 'bg-red-500' : 
                          status.variant === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                        )}
                        style={{ width: `${stockPercentage}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <Badge variant={status.variant as any} className="flex items-center w-fit gap-1.5 shadow-none py-1 px-3 font-bold border-none">
                    <StatusIcon className="h-3.5 w-3.5" />
                    {status.label}
                  </Badge>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium italic">Min required: {item.threshold} {item.unit}</p>
                </td>
                <td className="px-6 py-5 text-right">
                  {isEditingAdd ? (
                    <div className="flex items-center justify-end space-x-2 animate-in slide-in-from-right-2 duration-200">
                      <input
                        type="number"
                        className="w-24 h-9 px-3 py-1 text-sm border-2 border-emerald-500/30 rounded-lg focus:outline-none focus:border-emerald-500 bg-white font-mono font-bold"
                        placeholder="Qty"
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
                        className="h-9 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-md shadow-emerald-600/20 font-bold text-xs"
                      >
                        ADD
                      </button>
                    </div>
                  ) : isEditingDeduct ? (
                    <div className="flex items-center justify-end space-x-2 animate-in slide-in-from-right-2 duration-200">
                      <input
                        type="number"
                        className="w-24 h-9 px-3 py-1 text-sm border-2 border-red-500/30 rounded-lg focus:outline-none focus:border-red-500 bg-white font-mono font-bold"
                        placeholder="Qty"
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
                        className="h-9 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md shadow-red-600/20 font-bold text-xs"
                      >
                        USE
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 px-4 text-emerald-600 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-600 hover:text-white font-bold transition-all"
                        onClick={() => setEditingState({ id: item.id, type: 'add' })}
                      >
                        <Plus className="h-3 w-3 mr-1.5" />
                        RESTOCK
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-9 px-4 text-red-600 border-red-100 bg-red-50/50 hover:bg-red-600 hover:text-white font-bold transition-all"
                        onClick={() => setEditingState({ id: item.id, type: 'deduct' })}
                      >
                        <Minus className="h-3 w-3 mr-1.5" />
                        DEDUCT
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
