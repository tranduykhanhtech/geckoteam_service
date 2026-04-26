import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { usePOSStore } from '../../store/posStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { Button } from '../../components/ui/button';
import {
  Plus, Ban, X, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, Search, AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';

type AdminTab = 'add-product' | 'void-bill';

export function AdminPanel() {
  const { profile } = useAuthStore();
  const { fetchProductsAndCategories, categories, voidOrder } = usePOSStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('add-product');

  if (profile?.role !== 'admin') return null;

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Admin Controls
        </span>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="border-t border-slate-100">
          {/* Tab bar */}
          <div className="flex border-b border-slate-100">
            {([
              { id: 'add-product', label: 'Add Item', icon: Plus },
              { id: 'void-bill', label: 'Void Bill', icon: Ban },
            ] as { id: AdminTab; label: string; icon: React.ElementType }[]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                  activeTab === tab.id
                    ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === 'add-product' && <AddProductForm categories={categories} onSuccess={fetchProductsAndCategories} />}
            {activeTab === 'void-bill' && <VoidBillForm voidOrder={voidOrder} />}
          </div>
        </div>
      )}
    </div>
  );
}



// ─── Add Product Form ─────────────────────────────────────────────────────────

function AddProductForm({ categories: initialCategories, onSuccess }: {
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}) {
  const { profile } = useAuthStore();
  const [localCategories, setLocalCategories] = useState(initialCategories);
  React.useEffect(() => { setLocalCategories(initialCategories); }, [initialCategories]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { items: inventoryItems, fetchItems: fetchInventory } = useInventoryStore();
  const [recipe, setRecipe] = useState<{ inventory_item_id: string; quantity: string }[]>([]);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addRecipeRow = () => {
    setRecipe([...recipe, { inventory_item_id: '', quantity: '' }]);
  };

  const removeRecipeRow = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const updateRecipeRow = (index: number, field: string, value: string) => {
    const newRecipe = [...recipe];
    (newRecipe[index] as any)[field] = value;
    setRecipe(newRecipe);
  };

  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [catMsg, setCatMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCatLoading(true);
    setCatMsg(null);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCatName.trim(), company_id: profile!.company_id }])
        .select('id, name')
        .single();
      if (error) throw error;

      setLocalCategories(prev => [...prev, data]);
      setCategoryId(data.id);
      setCatMsg({ type: 'success', text: `Category "${data.name}" created!` });
      setNewCatName('');
      setShowNewCat(false);
      onSuccess();
    } catch (err: any) {
      setCatMsg({ type: 'error', text: err.message });
    } finally {
      setCatLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { setMsg({ type: 'error', text: 'Please select a category.' }); return; }
    setLoading(true);
    setMsg(null);
    try {
      const { data: product, error: pError } = await supabase.from('products').insert([{
        name,
        price: parseFloat(price),
        category_id: categoryId,
        company_id: profile!.company_id,
        is_available: true,
      }]).select().single();

      if (pError) throw pError;

      const validRecipe = recipe.filter(r => r.inventory_item_id && r.quantity);
      if (validRecipe.length > 0) {
        const recipeData = validRecipe.map(r => ({
          product_id: product.id,
          inventory_item_id: r.inventory_item_id,
          quantity: parseFloat(r.quantity)
        }));

        const { error: rError } = await supabase.from('product_recipes').insert(recipeData);
        if (rError) throw rError;
      }

      setMsg({ type: 'success', text: `"${name}" added with recipe!` });
      setName(''); setPrice(''); setCategoryId(''); setRecipe([]);
      onSuccess();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-slate-500 mb-3">Add a new item to the menu.</p>

      {msg && (
        <div className={cn(
          'text-xs px-3 py-2 rounded-md flex items-start gap-2',
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          {msg.text}
        </div>
      )}

      <input
        required
        type="text"
        placeholder="Item name"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
      />
      <input
        required
        type="number"
        step="0.01"
        min="0"
        placeholder="Price (e.g. 4.50)"
        value={price}
        onChange={e => setPrice(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
      />

      <div className="space-y-2">
        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          >
            <option value="">
              {localCategories.length === 0 ? 'No categories yet — create one ↓' : 'Select category…'}
            </option>
            {localCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { setShowNewCat(v => !v); setCatMsg(null); }}
            className={cn(
              'px-2.5 py-2 rounded-md border text-xs font-semibold transition-colors flex items-center gap-1 whitespace-nowrap',
              showNewCat
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>

        {showNewCat && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 space-y-2">
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">New Category</p>
            {catMsg && (
              <div className={cn(
                'text-xs px-2 py-1.5 rounded flex items-center gap-1.5',
                catMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              )}>
                {catMsg.type === 'success' ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
                {catMsg.text}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Coffee, Snacks…"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                className="flex-1 px-3 py-1.5 text-sm border border-amber-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={catLoading || !newCatName.trim()}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {catLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">Recipe / Ingredients</p>
          <button
            type="button"
            onClick={addRecipeRow}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-semibold transition-colors"
          >
            + Add Ingredient
          </button>
        </div>

        {recipe.length === 0 && (
          <p className="text-[10px] text-slate-400 italic">No ingredients linked. Stock won't be auto-deducted.</p>
        )}

        <div className="space-y-2">
          {recipe.map((row, index) => (
            <div key={index} className="flex gap-2 items-center animate-in slide-in-from-top-1 duration-200">
              <select
                required
                value={row.inventory_item_id}
                onChange={(e) => updateRecipeRow(index, 'inventory_item_id', e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Select Item</option>
                {inventoryItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <input
                  required
                  type="number"
                  step="any"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) => updateRecipeRow(index, 'quantity', e.target.value)}
                  className="w-16 px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-[10px] text-slate-500 w-6 font-medium">
                  {row.inventory_item_id ? inventoryItems.find(i => i.id === row.inventory_item_id)?.weight_volume_unit : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeRecipeRow(index)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-9 text-sm">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" />Add Item with Recipe</>}
        </Button>
      </div>
    </form>
  );
}

// ─── Void Bill Form ───────────────────────────────────────────────────────────

function VoidBillForm({ voidOrder }: { voidOrder: (id: string) => Promise<void> }) {
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
    <div className="space-y-3">
      <p className="text-xs text-slate-500 mb-3">Enter a completed Order ID to void it.</p>

      {msg && (
        <div className={cn(
          'text-xs px-3 py-2 rounded-md flex items-start gap-2',
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Order ID (UUID)"
          value={orderId}
          onChange={e => { setOrderId(e.target.value); setOrderPreview(null); setMsg(null); }}
          className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-400 font-mono"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !orderId.trim()}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-slate-600" />}
        </button>
      </div>

      {orderPreview && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
          <div className="flex justify-between text-xs text-slate-600">
            <span>Order ID</span>
            <span className="font-mono text-slate-900">{orderPreview.id.slice(0, 12)}…</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Total</span>
            <span className="font-bold text-slate-300">${Number(orderPreview.total_amount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Status</span>
            <span className={cn('font-semibold capitalize', orderPreview.status === 'cancelled' ? 'text-red-600' : 'text-emerald-600')}>
              {orderPreview.status}
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-600">
            <span>Date</span>
            <span>{new Date(orderPreview.created_at).toLocaleString()}</span>
          </div>
          {orderPreview.status === 'cancelled' ? (
            <p className="text-xs text-red-600 font-medium pt-1">This order is already cancelled.</p>
          ) : (
            <Button
              onClick={handleVoid}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-8 text-xs mt-1"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <X className="h-3.5 w-3.5 mr-1" />}
              Confirm Void
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
