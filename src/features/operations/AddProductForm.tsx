import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { Button } from '../../components/ui/button';
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {msg && (
        <div className={cn(
          'text-xs px-3 py-2 rounded-md flex items-start gap-2',
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {msg.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name</label>
          <input
            required
            type="text"
            placeholder="e.g. Espresso"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="e.g. 4.50"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
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
              'px-3 py-2 rounded-md border text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap',
              showNewCat
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-400 hover:text-amber-600'
            )}
          >
            <Plus className="h-4 w-4" />
            New
          </button>
        </div>

        {showNewCat && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-2 space-y-2">
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
                {catLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-700">Recipe / Ingredients</p>
            <p className="text-xs text-slate-500">Link inventory items to auto-deduct stock on sale.</p>
          </div>
          <button 
            type="button" 
            onClick={addRecipeRow}
            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1"
          >
            <Plus className="h-3 w-3" /> Add Ingredient
          </button>
        </div>
        
        {recipe.length === 0 && (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-md p-4 text-center">
            <p className="text-sm text-slate-500 italic">No ingredients linked. Stock won't be auto-deducted.</p>
          </div>
        )}

        <div className="space-y-2">
          {recipe.map((row, index) => (
            <div key={index} className="flex gap-3 items-center">
              <select
                required
                value={row.inventory_item_id}
                onChange={(e) => updateRecipeRow(index, 'inventory_item_id', e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
              >
                <option value="">Select Inventory Item</option>
                {inventoryItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md p-1 shadow-sm">
                <input
                  required
                  type="number"
                  step="any"
                  placeholder="0"
                  value={row.quantity}
                  onChange={(e) => updateRecipeRow(index, 'quantity', e.target.value)}
                  className="w-16 px-2 py-1 text-sm border-none focus:ring-0 outline-none font-bold text-slate-900"
                />
                <select
                  value={row.unit}
                  onChange={(e) => updateRecipeRow(index, 'unit', e.target.value)}
                  className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-1 rounded border-none focus:ring-0 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
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
                className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-10">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Plus className="h-5 w-5 mr-2" />Save Menu Item</>}
        </Button>
      </div>
    </form>
  );
}
