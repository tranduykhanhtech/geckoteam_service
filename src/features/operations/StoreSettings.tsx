import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Save, Loader2, CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StoreSettings() {
  const { profile } = useAuthStore();
  const [rate, setRate] = useState<string>('1');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      if (!profile?.company_id) return;
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('points_rate')
          .eq('id', profile.company_id)
          .single();
        
        if (error) throw error;
        if (data) setRate(data.points_rate.toString());
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
        .update({ points_rate: parseFloat(rate) })
        .eq('id', profile.company_id);

      if (error) throw error;
      setMsg({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {msg && (
        <div className={cn(
          'text-sm px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2',
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900">Loyalty Program Settings</h4>
            <p className="text-xs text-slate-500">Define how customers earn points on purchases.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 pl-1">
              Points Conversion Rate
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                  $
                </div>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="w-full pl-8 pr-4 h-12 bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-indigo-500 transition-all font-bold text-slate-900"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                />
              </div>
              <div className="text-slate-400 font-black text-xl">=</div>
              <div className="flex-1 bg-white border-2 border-slate-100 rounded-2xl h-12 flex items-center px-4 font-bold text-slate-900">
                1 Point
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 bg-white p-3 rounded-xl border border-slate-100">
              💡 <span className="font-bold">Example:</span> If set to <span className="text-indigo-600">5.00</span>, a customer spending <span className="text-indigo-600">$50.00</span> will earn <span className="text-indigo-600">10 points</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-2xl font-bold shadow-lg shadow-slate-900/20"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5 mr-2" />Save Store Settings</>}
        </Button>
      </div>
    </form>
  );
}
