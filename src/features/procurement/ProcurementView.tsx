import React, { useState, useEffect } from 'react';
import { useProcurementStore } from '../../store/procurementStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { ShoppingBag, CheckCircle2, Clock, Plus, X, FileText, Building2, Phone } from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

type Tab = 'orders' | 'suppliers';

export function ProcurementView({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const [isNewPOOpen, setIsNewPOOpen] = useState(false);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const { profile } = useAuthStore();

  const {
    purchaseOrders, suppliers,
    fetchPurchaseOrders, fetchSuppliers, receivePurchaseOrder
  } = useProcurementStore();

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
  }, [fetchPurchaseOrders, fetchSuppliers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative w-full max-w-6xl h-[90vh] bg-slate-50 rounded-[32px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

        <div className="bg-white border-b border-slate-200/50 px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Procurement</h1>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Manage Purchasing & Suppliers</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNewSupplierOpen(true)}
                className="h-10 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                New Supplier
              </button>
              <button
                onClick={() => setIsNewPOOpen(true)}
                className="h-10 px-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
              >
                <Plus className="h-4 w-4" />
                Create PO
              </button>
              <div className="h-8 w-px bg-slate-200 mx-2" />
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={cn(
                "text-sm font-bold pb-4 border-b-2 transition-all",
                activeTab === 'orders' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Purchase Orders
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={cn(
                "text-sm font-bold pb-4 border-b-2 transition-all",
                activeTab === 'suppliers' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Suppliers Directory
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'orders' ? (
            <div className="space-y-4">
              {purchaseOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                  <FileText className="h-12 w-12 mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Purchase Orders Found</p>
                </div>
              ) : (
                purchaseOrders.map(po => (
                  <div key={po.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-200 transition-all">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        po.status === 'received' ? "bg-emerald-50 text-emerald-600" :
                          po.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                      )}>
                        {po.status === 'received' ? <CheckCircle2 className="h-6 w-6" /> :
                          po.status === 'pending' ? <Clock className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-bold text-slate-900 text-lg">PO-{po.id.slice(0, 8).toUpperCase()}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest",
                            po.status === 'received' ? "bg-emerald-100 text-emerald-700" :
                              po.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {po.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                          <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" /> {po.supplier_name}</span>
                          <span>•</span>
                          <span>{format(new Date(po.created_at), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</p>
                        <p className="text-xl font-bold text-slate-900">${po.total_amount.toFixed(2)}</p>
                      </div>

                      {po.status === 'pending' && profile?.role !== 'staff' && (
                        <button
                          onClick={() => receivePurchaseOrder(po.id)}
                          className="h-10 px-6 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Receive
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers.map(sup => (
                <div key={sup.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{sup.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Supplier</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {sup.contact_name && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="w-6 flex justify-center"><CheckCircle2 className="h-4 w-4 opacity-50" /></div>
                        {sup.contact_name}
                      </div>
                    )}
                    {sup.phone && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="w-6 flex justify-center"><Phone className="h-4 w-4 opacity-50" /></div>
                        {sup.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {isNewSupplierOpen && <NewSupplierModal onClose={() => setIsNewSupplierOpen(false)} />}
      {isNewPOOpen && <NewPOModal onClose={() => setIsNewPOOpen(false)} />}

    </div>
  );
}

function NewSupplierModal({ onClose }: { onClose: () => void }) {
  const { createSupplier, isLoading } = useProcurementStore();
  const [formData, setFormData] = useState({ name: '', contact_name: '', phone: '', email: '', address: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    try {
      await createSupplier(formData);
      onClose();
    } catch (err) {
      alert("Failed to create supplier");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-6">Add New Supplier</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" placeholder="Company Name" className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <input type="text" placeholder="Contact Person" className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none" value={formData.contact_name} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
          <input type="tel" placeholder="Phone Number" className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-medium focus:ring-2 focus:ring-slate-900 outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />

          <div className="flex gap-3 pt-4 border-t border-slate-50 mt-6">
            <button type="button" onClick={onClose} className="flex-1 h-12 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 h-12 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewPOModal({ onClose }: { onClose: () => void }) {
  const { suppliers, createPurchaseOrder, isLoading } = useProcurementStore();
  const { items: inventory, fetchItems } = useInventoryStore();
  const [supplierId, setSupplierId] = useState('');
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAddItem = (invItem: any) => {
    if (selectedItems.find(i => i.inventory_item_id === invItem.id)) return;
    setSelectedItems([...selectedItems, {
      inventory_item_id: invItem.id,
      name: invItem.name,
      unit: invItem.unit,
      quantity: '1',
      unit_price: '0'
    }]);
  };

  const handleSubmit = async () => {
    if (!supplierId || selectedItems.length === 0) return;
    try {
      const formattedItems = selectedItems.map(item => ({
        ...item,
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0
      }));
      await createPurchaseOrder(supplierId, formattedItems, null);
      onClose();
    } catch (err) {
      alert("Failed to create PO");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Create Purchase Order</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-semibold focus:ring-2 focus:ring-slate-900 outline-none"
            >
              <option value="">Select Supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-8 border-t border-slate-50 pt-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Directory</label>
              <div className="h-64 overflow-y-auto border border-slate-100 rounded-xl p-2 space-y-1">
                {inventory.map(item => (
                  <button key={item.id} onClick={() => handleAddItem(item)} className="w-full p-3 text-left hover:bg-slate-50 rounded-lg flex items-center justify-between group transition-all">
                    <p className="text-xs font-bold text-slate-900">{item.name}</p>
                    <Plus className="h-3 w-3 text-slate-300 group-hover:text-slate-900" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Items</label>
              <div className="space-y-3">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <button onClick={() => setSelectedItems(selectedItems.filter(i => i.inventory_item_id !== item.inventory_item_id))} className="text-slate-400 hover:text-rose-500"><X className="h-3 w-3" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Qty ({item.unit})</p>
                        <input type="number" className="w-full h-8 px-2 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none" value={item.quantity} onChange={e => {
                          const newItems = [...selectedItems]; newItems[idx].quantity = e.target.value; setSelectedItems(newItems);
                        }} />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Unit Price ($)</p>
                        <input type="number" className="w-full h-8 px-2 text-xs font-bold bg-white border border-slate-200 rounded-lg outline-none" value={item.unit_price} onChange={e => {
                          const newItems = [...selectedItems]; newItems[idx].unit_price = e.target.value; setSelectedItems(newItems);
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-slate-50">
          <div className="flex justify-between items-center mb-6">
            <span className="text-sm font-bold text-slate-500">Total Purchase Value</span>
            <span className="text-2xl font-black text-slate-900">${selectedItems.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)), 0).toFixed(2)}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !supplierId || selectedItems.length === 0}
            className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 transition-all"
          >
            Submit Order
          </button>
        </div>
      </div>
    </div>
  );
}
