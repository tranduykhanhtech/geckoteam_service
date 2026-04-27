import { useState, useEffect } from 'react';
import { useTransferStore } from '../../store/transferStore';
import type { TransferItem } from '../../store/transferStore';
import { useStoreStore } from '../../store/storeStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Truck, ArrowRight, Plus, X, 
  CheckCircle2, Clock, 
  Search, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function TransferView({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { transfers, isLoading, fetchTransfers, createTransfer, acceptTransfer, cancelTransfer } = useTransferStore();
  const { stores, fetchStores } = useStoreStore();
  const { items: inventory } = useInventoryStore();
  const { profile } = useAuthStore();
  
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [targetStoreId, setTargetStoreId] = useState('');
  const [selectedItems, setSelectedItems] = useState<TransferItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTransfers();
      fetchStores();
    }
  }, [isOpen, fetchTransfers, fetchStores]);

  if (!isOpen) return null;

  const handleAddItem = (invItem: any) => {
    const existing = selectedItems.find(it => it.name === invItem.name);
    if (existing) return;
    
    setSelectedItems([...selectedItems, {
      name: invItem.name,
      unit: invItem.unit,
      quantity: 1,
      category_id: invItem.category_id
    }]);
  };

  const handleUpdateQty = (name: string, qty: number) => {
    setSelectedItems(selectedItems.map(it => 
      it.name === name ? { ...it, quantity: Math.max(0.1, qty) } : it
    ));
  };

  const handleRemoveItem = (name: string) => {
    setSelectedItems(selectedItems.filter(it => it.name !== name));
  };

  const handleSubmitTransfer = async () => {
    if (!targetStoreId || selectedItems.length === 0) return;
    try {
      await createTransfer(targetStoreId, selectedItems);
      setIsNewTransferOpen(false);
      setSelectedItems([]);
      setTargetStoreId('');
    } catch (err: any) {
      alert('Failed to create transfer');
    }
  };

  const filteredInventory = inventory.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
              <Truck className="h-6 w-6 text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Stock Transfers</h2>
              <p className="text-xs text-slate-400 font-medium">Inter-branch inventory movement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsNewTransferOpen(true)}
              className="apple-btn-primary h-10 px-6 text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Transfer
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {isLoading && transfers.length === 0 ? (
            <div className="h-full flex items-center justify-center">
               <Loader2 className="h-8 w-8 text-slate-200 animate-spin" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300 space-y-4">
               <Truck className="h-16 w-16 opacity-20" />
               <p className="text-sm font-semibold uppercase tracking-widest">No active transfers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {transfers.map(t => (
                <div key={t.id} className="apple-card p-6 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center",
                      t.status === 'completed' ? "bg-slate-50 text-slate-900" : 
                      t.status === 'pending' ? "bg-slate-50 text-slate-900" : "bg-slate-50 text-slate-400"
                    )}>
                      {t.status === 'completed' ? <CheckCircle2 className="h-6 w-6" /> : 
                       t.status === 'pending' ? <Clock className="h-6 w-6" /> : <X className="h-6 w-6" />}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold text-slate-900">{t.from_store_name}</span>
                        <ArrowRight className="h-3 w-3 text-slate-300" />
                        <span className="text-sm font-bold text-slate-900">{t.to_store_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span>{t.items.length} Items</span>
                        <span>•</span>
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>By {t.creator_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      t.status === 'completed' ? "bg-slate-100 text-slate-900" : 
                      t.status === 'pending' ? "bg-slate-50 text-slate-900" : "bg-slate-100 text-slate-400"
                    )}>
                      {t.status}
                    </div>

                    {t.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        {t.to_store_id === profile?.store_id ? (
                          <button 
                            onClick={() => acceptTransfer(t.id)}
                            className="h-9 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                          >
                            Accept
                          </button>
                        ) : (
                          <button 
                            onClick={() => cancelTransfer(t.id)}
                            className="h-9 px-4 bg-slate-50 text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Transfer Sidebar/Modal Overlay */}
      {isNewTransferOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px]" onClick={() => setIsNewTransferOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Create Stock Transfer</h3>
              <button onClick={() => setIsNewTransferOpen(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Destination */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To Branch</label>
                <div className="grid grid-cols-2 gap-3">
                  {stores.filter(s => s.id !== profile?.store_id).map(s => (
                    <button
                      key={s.id}
                      onClick={() => setTargetStoreId(s.id)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all",
                        targetStoreId === s.id 
                          ? "border-slate-900 bg-slate-50 ring-1 ring-slate-900" 
                          : "border-slate-100 hover:border-slate-200"
                      )}
                    >
                      <p className="text-sm font-bold text-slate-900">{s.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{s.address || 'No address'}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Inventory Search */}
                 <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-10 pr-4 h-10 bg-slate-50 border-none rounded-xl text-xs font-medium focus:ring-1 focus:ring-slate-900 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="h-64 overflow-y-auto border border-slate-100 rounded-2xl p-2 space-y-1">
                      {filteredInventory.map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleAddItem(item)}
                          className="w-full p-3 text-left hover:bg-slate-50 rounded-xl flex items-center justify-between group transition-all"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{item.name}</p>
                            <p className="text-[9px] text-slate-400 uppercase font-black">{item.quantity} {item.unit} in stock</p>
                          </div>
                          <Plus className="h-3 w-3 text-slate-300 group-hover:text-slate-900" />
                        </button>
                      ))}
                    </div>
                 </div>

                 {/* Selected List */}
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Items to move</label>
                    <div className="space-y-3">
                      {selectedItems.map(item => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900 line-clamp-1">{item.name}</p>
                          </div>
                          <div className="flex items-center bg-slate-50 rounded-lg p-1 px-2 border border-slate-100">
                            <input 
                              type="number"
                              className="w-12 bg-transparent border-none text-xs font-bold text-center focus:ring-0 p-0"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQty(item.name, parseFloat(e.target.value))}
                            />
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                          </div>
                          <button onClick={() => handleRemoveItem(item.name)} className="text-slate-300 hover:text-rose-500">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {selectedItems.length === 0 && (
                        <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                           Add items from inventory
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-50">
              <button 
                onClick={handleSubmitTransfer}
                disabled={!targetStoreId || selectedItems.length === 0}
                className="w-full py-4 bg-slate-900 disabled:bg-slate-200 text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
              >
                Send Transfer Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
