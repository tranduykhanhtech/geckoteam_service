import React, { useState } from 'react';
import { useShiftStore } from '../../store/shiftStore';
import { useAuthStore } from '../../store/authStore';
import { Loader2, Lock, Unlock, DollarSign, Calculator } from 'lucide-react';
import { cn } from '../../lib/utils';

export function OpenShiftOverlay() {
  const { openShift, isLoading } = useShiftStore();
  const { profile } = useAuthStore();
  const [floatAmount, setFloatAmount] = useState('');

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!floatAmount) return;
    try {
      await openShift(parseFloat(floatAmount));
    } catch (err) {
      alert('Failed to open shift');
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-900">
            <Unlock className="h-8 w-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2 tracking-tight">Open Register</h2>
        <p className="text-center text-slate-500 text-sm mb-8">
          Welcome, {profile?.full_name}. Please enter the starting cash float to begin your shift.
        </p>

        <form onSubmit={handleOpen} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Starting Cash (Float)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                autoFocus
                required
                type="number"
                step="0.01"
                min="0"
                value={floatAmount}
                onChange={(e) => setFloatAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-4 text-xl font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !floatAmount}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Start Shift'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function CloseShiftModal({ onClose }: { onClose: () => void }) {
  const { currentShift, closeShift, isLoading } = useShiftStore();
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');

  // In a real app, you would calculate expected balance by querying all cash orders for this shift
  // For this UI, we assume expected_balance is passed or we calculate it roughly.
  // We'll let the backend or a future enhancement calculate the exact expected cash based on orders.
  // For now, we'll just require actual cash.
  const expectedCash = currentShift?.opening_balance || 0;
  const variance = parseFloat(actualCash || '0') - expectedCash;

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actualCash) return;
    try {
      await closeShift(parseFloat(actualCash), expectedCash, notes);
      onClose();
    } catch (err) {
      alert('Failed to close shift');
    }
  };

  if (!currentShift) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Lock className="h-5 w-5 text-rose-500" />
            End of Day
          </h2>
          <button onClick={onClose} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900">Cancel</button>
        </div>

        <form onSubmit={handleClose} className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Opening Float</span>
              <span className="font-bold text-slate-900">${currentShift.opening_balance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">System Expected Cash</span>
              <span className="font-bold text-slate-900">${expectedCash.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Actual Cash in Drawer</label>
            <div className="relative">
              <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                autoFocus
                required
                type="number"
                step="0.01"
                min="0"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="0.00"
                className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-4 text-xl font-bold text-slate-900 focus:border-slate-900 focus:ring-0 outline-none transition-all"
              />
            </div>

            {actualCash && (
              <div className={cn(
                "text-xs font-bold mt-2 text-right",
                variance === 0 ? "text-emerald-500" : variance > 0 ? "text-blue-500" : "text-rose-500"
              )}>
                Variance: {variance > 0 ? '+' : ''}{variance.toFixed(2)}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Closing Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any issues or reasons for variance..."
              className="w-full h-20 bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !actualCash}
            className="w-full h-14 bg-rose-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-600/20"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Close Shift'}
          </button>
        </form>
      </div>
    </div>
  );
}
