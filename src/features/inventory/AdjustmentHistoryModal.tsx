import { useEffect } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import { X, History, TrendingUp, TrendingDown, ShoppingCart, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AdjustmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdjustmentHistoryModal({ isOpen, onClose }: AdjustmentHistoryModalProps) {
  const { adjustmentHistory, isHistoryLoading, fetchHistory } = useInventoryStore();

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, fetchHistory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center">
            <History className="h-5 w-5 mr-2 text-slate-700" />
            <h3 className="font-bold text-lg text-slate-900">Adjustment History</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0">
          {isHistoryLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : adjustmentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <History className="h-10 w-10 mb-2 opacity-20" />
              <p>No adjustments recorded yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-slate-500 font-medium border-b border-slate-100 sticky top-0">
                <tr>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Item</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Staff</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustmentHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-6 py-3 text-slate-500 whitespace-nowrap">
                      {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {record.item_name}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        record.type === 'Restock' ? 'bg-emerald-100 text-emerald-800' : 
                        record.type === 'POS Auto-Deduct' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.type === 'Restock' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {record.type === 'Spoilage' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {record.type === 'POS Auto-Deduct' && <ShoppingCart className="w-3 h-3 mr-1" />}
                        {record.type}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {record.staff_name ?? '—'}
                    </td>
                    <td className={`px-6 py-3 text-right font-bold ${
                      record.amount > 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {record.amount > 0 ? '+' : ''}{record.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
