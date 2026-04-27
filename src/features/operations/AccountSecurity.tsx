import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  KeyRound, Loader2, CheckCircle2, 
  AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function AccountSecurity() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;
      setMsg({ type: 'success', text: 'Password updated successfully!' });
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight">Security Center</h3>
          </div>
          <p className="text-slate-400 text-sm max-w-md font-medium leading-relaxed">
            Protect your access to the system. We recommend using a unique password that you don't use elsewhere.
          </p>
        </div>
        {/* Subtle background glow */}
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-6">
        {msg && (
          <div className={cn(
            'text-[11px] font-semibold uppercase tracking-wider px-6 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 border shadow-sm',
            msg.type === 'success' 
              ? 'bg-white text-slate-900 border-slate-100' 
              : 'bg-rose-50 text-rose-600 border-rose-100'
          )}>
            {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
            {msg.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                required
                type="password"
                minLength={6}
                className="w-full pl-11 pr-4 h-12 bg-white border border-slate-100 rounded-xl focus:ring-1 focus:ring-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm shadow-sm"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Confirm New Password</label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                required
                type="password"
                minLength={6}
                className="w-full pl-11 pr-4 h-12 bg-white border border-slate-100 rounded-xl focus:ring-1 focus:ring-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm shadow-sm"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full md:w-auto px-12 bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-semibold text-[11px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Update Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
