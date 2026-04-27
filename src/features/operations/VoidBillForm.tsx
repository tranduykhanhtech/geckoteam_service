import { useState } from 'react';
import { supabase } from '../../lib/supabase';
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
    <div className="space-y-8">
      {msg && (
        <div className={cn(
          'text-[10px] font-semibold uppercase tracking-wider px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm border',
          msg.type === 'success' 
            ? 'bg-white text-slate-900 border-slate-100' 
            : 'bg-rose-50 text-rose-600 border-rose-100'
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="space-y-4">
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Search Order by ID</label>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. 123e4567-..."
            value={orderId}
            onChange={e => { setOrderId(e.target.value); setOrderPreview(null); setMsg(null); }}
            className="flex-1 px-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm font-mono"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !orderId.trim()}
            className="px-8 h-12 bg-slate-900 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Find
          </button>
        </div>
      </div>

      {orderPreview && (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900">
              <Ban className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-lg tracking-tight">Order Details</h4>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Verification for override</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Order ID</p>
                <p className="text-xs font-mono text-slate-900 font-medium truncate">{orderPreview.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Amount</p>
                <p className="text-2xl font-semibold text-slate-900 tracking-tight">${Number(orderPreview.total_amount).toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Current Status</p>
                <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider', 
                  orderPreview.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                )}>
                  {orderPreview.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Timestamp</p>
                <p className="text-xs font-medium text-slate-500">{new Date(orderPreview.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-50">
            {orderPreview.status === 'cancelled' ? (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center gap-3">
                <AlertTriangle className="h-4 w-4" />
                This record is already voided
              </div>
            ) : (
              <button
                onClick={handleVoid}
                disabled={loading}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white h-12 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                Confirm Order Override
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
