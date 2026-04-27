import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { 
  Save, Loader2, CheckCircle2, AlertTriangle, 
  Star, Printer, Globe, BellRing
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function StoreSettings() {
  const { profile } = useAuthStore();
  const [rate, setRate] = useState<string>('1');
  const [redemptionValue, setRedemptionValue] = useState<string>('0.1');
  const [printerIp, setPrinterIp] = useState<string>('');
  const [printerPort, setPrinterPort] = useState<string>('9100');
  const [autoPrint, setAutoPrint] = useState<boolean>(true);
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      if (!profile?.company_id) return;
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', profile.company_id)
          .single();
        
        if (error) throw error;
        if (data) {
          setRate(data.points_rate?.toString() || '1');
          setRedemptionValue(data.point_redemption_value?.toString() || '0.1');
          setPrinterIp(data.printer_ip || '');
          setPrinterPort(data.printer_port?.toString() || '9100');
          setAutoPrint(data.auto_print_receipt ?? true);
        }
      } catch (err) {
        console.error('Failed to fetch settings:', err);
      } finally {
        setFetching(false);
      }
    }
    fetchSettings();
  }, [profile?.company_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.company_id) return;
    
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ 
          points_rate: parseFloat(rate),
          point_redemption_value: parseFloat(redemptionValue),
          printer_ip: printerIp,
          printer_port: parseInt(printerPort),
          auto_print_receipt: autoPrint
        })
        .eq('id', profile.company_id);

      if (error) throw error;
      setMsg({ type: 'success', text: 'Infrastructure configuration synced!' });
      
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fetching Core Config...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
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

      <div className="grid grid-cols-1 gap-6">
        {/* Loyalty Program Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-lg tracking-tight">Loyalty Architecture</h4>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Member Reward Logic</p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Points Issuance Rate
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full pl-8 pr-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm"
                    value={rate}
                    onChange={e => setRate(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 uppercase">Per Point</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Redemption Value
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full pl-8 pr-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm"
                    value={redemptionValue}
                    onChange={e => setRedemptionValue(e.target.value)}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 uppercase">Value / Point</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Printer Configuration Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-50 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-lg tracking-tight">Print Infrastructure</h4>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Network & Hardware Config</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Printer IP
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.100"
                  className="w-full pl-11 pr-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm"
                  value={printerIp}
                  onChange={e => setPrinterIp(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Service Port
              </label>
              <input
                type="number"
                className="w-full px-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm"
                value={printerPort}
                onChange={e => setPrinterPort(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-900">
                  <BellRing className="h-5 w-5" />
               </div>
               <div>
                  <h5 className="text-sm font-semibold text-slate-900 tracking-tight">Auto-Print Receipts</h5>
                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Automatic print on checkout</p>
               </div>
            </div>
            <button
              type="button"
              onClick={() => setAutoPrint(!autoPrint)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                autoPrint ? "bg-slate-900" : "bg-slate-200"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                autoPrint ? "left-7" : "left-1"
              )} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-semibold text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </form>
  );
}
