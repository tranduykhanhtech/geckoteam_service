import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Ban, Loader2, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VoidBillFormProps {
  voidOrder: (id: string) => Promise<void>;
}

export function VoidBillForm({ voidOrder }: VoidBillFormProps) {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderPreview, setOrderPreview] = useState<{ id: string; total_amount: number; status: string; created_at: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!orderId.trim()) return;
    setSearching(true);
    setOrderPreview(null);
    setMsg(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('id', orderId.trim())
        .single();
      if (error) throw new Error('Order not found. Please check the Order ID.');
      setOrderPreview(data);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSearching(false);
    }
  };

  const handleVoid = async () => {
    if (!orderPreview) return;
    setLoading(true);
    setMsg(null);
    try {
      await voidOrder(orderPreview.id);
      setMsg({ type: 'success', text: `Order voided successfully.` });
      setOrderPreview(null);
      setOrderId('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {msg && (
        <div className={cn(
          'text-sm px-4 py-3 rounded-md flex items-start gap-2',
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Search Order by ID</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            value={orderId}
            onChange={e => { setOrderId(e.target.value); setOrderPreview(null); setMsg(null); }}
            className="flex-1 px-4 py-2 text-base border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !orderId.trim()}
            className="px-6 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50 flex items-center font-medium"
          >
            {searching ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Search className="h-5 w-5 mr-2" />}
            Find
          </button>
        </div>
      </div>

      {orderPreview && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mt-6">
          <h4 className="font-bold text-slate-900 mb-4 pb-4 border-b border-slate-200">Order Details</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Order ID</span>
              <span className="font-mono text-slate-900 font-medium">{orderPreview.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total Amount</span>
              <span className="font-bold text-slate-900 text-lg">${Number(orderPreview.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Current Status</span>
              <span className={cn('font-semibold capitalize px-2 py-0.5 rounded-full text-xs', 
                orderPreview.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
              )}>
                {orderPreview.status}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date Created</span>
              <span className="font-medium text-slate-900">{new Date(orderPreview.created_at).toLocaleString()}</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            {orderPreview.status === 'cancelled' ? (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                This order has already been voided/cancelled.
              </div>
            ) : (
              <Button
                onClick={handleVoid}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white h-12 text-base font-bold"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Ban className="h-5 w-5 mr-2" />}
                Confirm Void Order
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
