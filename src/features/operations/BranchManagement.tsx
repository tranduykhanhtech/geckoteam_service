import { useState } from 'react';
import { useStoreStore } from '../../store/storeStore';
import { Plus, Store, MapPin, Loader2, Check } from 'lucide-react';

export function BranchManagement() {
  const { stores, createStore, isLoading } = useStoreStore();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await createStore(name, address);
      setName('');
      setAddress('');
      setIsAdding(false);
    } catch (err) {
      alert('Failed to create branch');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Branches</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="h-8 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Plus className="h-3 w-3" />
          Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stores.map(store => (
          <div key={store.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900">{store.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                <MapPin className="h-3 w-3" />
                {store.address || 'No address provided'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h4 className="text-xl font-bold text-slate-900 tracking-tight mb-6">New Branch</h4>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Branch Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. District 1 Outlet"
                  className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, District..."
                  className="w-full h-12 bg-slate-50 border-none rounded-2xl px-4 text-sm font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
