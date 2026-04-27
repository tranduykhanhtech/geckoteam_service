import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { Plus, Loader2, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AddProductFormProps {
  categories: { id: string; name: string }[];
  onSuccess: () => void;
}

export function AddProductForm({ categories: initialCategories, onSuccess }: AddProductFormProps) {
  const { profile } = useAuthStore();
  const [localCategories, setLocalCategories] = useState(initialCategories);
  React.useEffect(() => { setLocalCategories(initialCategories); }, [initialCategories]);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { items: inventoryItems, fetchItems: fetchInventory } = useInventoryStore();
  const [recipe, setRecipe] = useState<{ inventory_item_id: string; quantity: string; unit: string }[]>([]);

  React.useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const addRecipeRow = () => {
    setRecipe([...recipe, { inventory_item_id: '', quantity: '', unit: 'g' }]);
  };

  const removeRecipeRow = (index: number) => {
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const updateRecipeRow = (index: number, field: string, value: string) => {
    const newRecipe = [...recipe];
    (newRecipe[index] as any)[field] = value;
    
    // Auto-set default unit when item is selected
    if (field === 'inventory_item_id' && value) {
      const item = inventoryItems.find(i => i.id === value);
      if (item) {
        // If base unit is kg/l, default to g/ml for convenience
        if (item.weight_volume_unit?.toLowerCase() === 'kg') (newRecipe[index] as any).unit = 'g';
        else if (item.weight_volume_unit?.toLowerCase() === 'l') (newRecipe[index] as any).unit = 'ml';
        else (newRecipe[index] as any).unit = item.weight_volume_unit || 'g';
      }
    }
    
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
        const recipeData = validRecipe.map(r => {
          const item = inventoryItems.find(i => i.id === r.inventory_item_id);
          let finalQuantity = parseFloat(r.quantity);
          
          // Conversion logic
          if (item?.weight_volume_unit?.toLowerCase() === 'kg' && r.unit === 'g') {
            finalQuantity = finalQuantity / 1000;
          } else if (item?.weight_volume_unit?.toLowerCase() === 'l' && r.unit === 'ml') {
            finalQuantity = finalQuantity / 1000;
          }

          return {
            product_id: product.id,
            inventory_item_id: r.inventory_item_id,
            quantity: finalQuantity
          };
        });
        
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
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Item Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Espresso"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm"
          />
        </div>
        <div className="space-y-3">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Price ($)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full px-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm"
          />
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Category</label>
        <div className="flex gap-3">
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="flex-1 px-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm appearance-none"
          >
            <option value="">
              {localCategories.length === 0 ? 'No categories yet' : 'Select category…'}
            </option>
            {localCategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { setShowNewCat(v => !v); setCatMsg(null); }}
            className={cn(
              'px-6 h-12 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap',
              showNewCat
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        {showNewCat && (
          <div className="bg-slate-50 rounded-2xl p-4 mt-3 space-y-4 border border-slate-100">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Create New Category</p>
            {catMsg && (
              <div className={cn(
                'text-[10px] font-semibold uppercase tracking-wider px-3 py-2 rounded-xl flex items-center gap-2',
                catMsg.type === 'success' ? 'bg-white text-slate-900 border border-slate-100' : 'bg-rose-50 text-rose-600'
              )}>
                {catMsg.type === 'success' ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />}
                {catMsg.text}
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Category name…"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                className="flex-1 px-4 h-10 bg-white border border-transparent rounded-xl focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm"
                autoFocus
              />
              <button
                type="button"
                onClick={handleCreateCategory}
                disabled={catLoading || !newCatName.trim()}
                className="px-4 h-10 bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
              >
                {catLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider pl-1">Recipe / Ingredients</p>
          </div>
          <button 
            type="button" 
            onClick={addRecipeRow}
            className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-500 px-4 py-2 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <Plus className="h-3 w-3" /> Add Item
          </button>
        </div>
        
        {recipe.length === 0 ? (
          <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-xs text-slate-400 font-medium">Link inventory items to auto-deduct stock on sale.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recipe.map((row, index) => (
              <div key={index} className="flex gap-3 items-center animate-in fade-in slide-in-from-right-4 duration-300">
                <select
                  required
                  value={row.inventory_item_id}
                  onChange={(e) => updateRecipeRow(index, 'inventory_item_id', e.target.value)}
                  className="flex-1 px-4 h-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-slate-900 outline-none transition-all font-semibold text-slate-900 text-sm appearance-none"
                >
                  <option value="">Select Inventory Item</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2">
                  <input
                    required
                    type="number"
                    step="any"
                    placeholder="0"
                    value={row.quantity}
                    onChange={(e) => updateRecipeRow(index, 'quantity', e.target.value)}
                    className="w-16 h-12 bg-transparent border-none focus:ring-0 outline-none font-semibold text-slate-900 text-sm text-center"
                  />
                  <select
                    value={row.unit}
                    onChange={(e) => updateRecipeRow(index, 'unit', e.target.value)}
                    className="text-[10px] font-semibold uppercase tracking-wider bg-white text-slate-500 px-3 py-1 rounded-lg border-none focus:ring-0 outline-none cursor-pointer"
                  >
                    <option value="g">g</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                    <option value="l">L</option>
                    <option value="pcs">pcs</option>
                  </select>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeRecipeRow(index)}
                  className="p-3 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-6">
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 rounded-xl font-semibold text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Save Catalog Item
            </>
          )}
        </button>
      </div>
    </form>
  );
}
