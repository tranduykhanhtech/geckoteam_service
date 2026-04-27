import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Ban, Loader2, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VoidBillFormProps {
  voidOrder: (id: string) => Promise<void>;
}

export function VoidBillForm({ voidOrder }: VoidBillFormProps) {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [orderPreview, setOrderPreview] = useState<{ id: string; order_code: string; total_amount: number; status: string; created_at: string } | null>(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    const input = identifier.trim();
    if (!input) return;
    setSearching(true);
    setOrderPreview(null);
    setMsg(null);
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input);
      
      let query = supabase
        .from('orders')
        .select('id, order_code, total_amount, status, created_at');
      
      if (isUuid) {
        query = query.eq('id', input);
      } else {
        query = query.eq('order_code', input);
      }

      const { data, error } = await query.single();
      
      if (error || !data) throw new Error('Order not found. Check the code (e.g., GK-...) or ID.');
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
      setMsg({ type: 'success', text: `Order ${orderPreview.order_code} voided successfully.` });
      setOrderPreview(null);
      setIdentifier('');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Search Order by ID or Code</label>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. GK-240427-XXXX or UUID"
            value={identifier}
            onChange={e => { setIdentifier(e.target.value); setOrderPreview(null); setMsg(null); }}
            className="flex-1 px-4 h-12 bg-white border border-slate-100 rounded-xl focus:ring-1 focus:ring-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm font-mono shadow-sm"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !identifier.trim()}
            className="px-8 h-12 bg-slate-900 text-white rounded-xl text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-slate-900/10"
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Find
          </button>
        </div>
      </div>

      {orderPreview && (
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl shadow-slate-200/50 animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
             <Ban className="h-32 w-32 text-slate-900" />
          </div>

          <div className="flex items-center gap-4 mb-8 relative">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900">
              <Ban className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-xl tracking-tight">Order Verification</h4>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">Manual Override Required</p>
            </div>
          </div>
          
          <div className="space-y-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Identifier</p>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-mono text-slate-900 font-bold bg-slate-50 px-3 py-1 rounded-lg w-fit border border-slate-100">{orderPreview.order_code}</p>
                  <p className="text-[9px] font-mono text-slate-300 truncate max-w-[200px]">{orderPreview.id}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Transaction</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tighter">${Number(orderPreview.total_amount).toFixed(2)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <span className={cn('inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border', 
                  orderPreview.status === 'cancelled' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                )}>
                  {orderPreview.status}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logged At</p>
                <p className="text-xs font-semibold text-slate-500">{new Date(orderPreview.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50">
            <button
              onClick={handleVoid}
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white h-14 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-rose-200"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Ban className="h-5 w-5" />}
              Confirm Permanent Deletion
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
