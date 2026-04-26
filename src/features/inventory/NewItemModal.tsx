import React, { useState } from 'react';
import { useInventoryStore } from '../../store/inventoryStore';
import type { InventoryItem } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { X, Loader2, Plus, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface NewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: InventoryItem | null;
}

export function NewItemModal({ isOpen, onClose, editItem }: NewItemModalProps) {
  const { categories, addItem, updateItem, deleteItem, fetchCategories } = useInventoryStore();
  const { profile } = useAuthStore();
  
  const [name, setName] = useState(editItem?.name || '');
  const [categoryId, setCategoryId] = useState(editItem?.category_id || '');
  const [unit, setUnit] = useState(editItem?.unit || 'Box');
  const [weightValue, setWeightValue] = useState(editItem?.weight_volume_value?.toString() || '1');
  const [weightUnit, setWeightUnit] = useState(editItem?.weight_volume_unit || 'kg');
  const [quantity, setQuantity] = useState(editItem?.quantity?.toString() || '0');
  const [threshold, setThreshold] = useState(editItem?.threshold?.toString() || '5');
  
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline category creation
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  // Sync state if editItem changes
  React.useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setCategoryId(editItem.category_id);
      setUnit(editItem.unit);
      setWeightValue(editItem.weight_volume_value.toString());
      setWeightUnit(editItem.weight_volume_unit);
      setQuantity(editItem.quantity.toString());
      setThreshold(editItem.threshold.toString());
    } else {
      setName(''); setCategoryId(''); setUnit('Box'); setWeightValue('1'); setWeightUnit('kg');
      setQuantity('0'); setThreshold('5');
    }
  }, [editItem]);

  if (!isOpen) return null;

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCatLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .insert([{ name: newCatName.trim(), company_id: profile!.company_id }])
        .select('id, name')
        .single();
      
      if (error) throw error;

      await fetchCategories();
      setCategoryId(data.id);
      setNewCatName('');
      setShowNewCat(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCatLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editItem || !window.confirm('Are you sure you want to delete this item?')) return;
    setDeleteLoading(true);
    try {
      await deleteItem(editItem.id);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) { setError('Please select or create a category'); return; }
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        name,
        category_id: categoryId,
        unit,
        weight_volume_value: parseFloat(weightValue) || 1,
        weight_volume_unit: weightUnit,
        quantity: parseFloat(quantity) || 0,
        threshold: parseFloat(threshold) || 0,
      };

      if (editItem) {
        await updateItem(editItem.id, payload);
      } else {
        await addItem(payload);
      }
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-900">{editItem ? 'Edit Ingredient' : 'Add New Ingredient'}</h3>
          <div className="flex items-center gap-2">
            {editItem && (
              <button 
                onClick={handleDelete} 
                disabled={deleteLoading}
                className="text-slate-400 hover:text-red-500 p-1 transition-colors"
              >
                {deleteLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Item Name</label>
            <input 
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900" 
              placeholder="e.g. Arabica Beans"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Category</label>
            <div className="flex gap-2">
              <select 
                required
                className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCat(!showNewCat)}
                className={cn(
                  "p-2 border rounded-md transition-colors",
                  showNewCat ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
                )}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {showNewCat && (
            <div className="bg-slate-50 p-3 rounded-md border border-slate-200 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Category</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" 
                  placeholder="Category name..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                />
                <Button 
                  type="button" 
                  size="sm" 
                  onClick={handleCreateCategory}
                  disabled={catLoading || !newCatName.trim()}
                >
                  {catLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3 p-3 border border-slate-100 rounded-lg bg-slate-50/50">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Conversion Setup</p>
            
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-slate-500">How do you purchase this?</label>
              <input 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" 
                placeholder="e.g. Box, Bottle, Pack"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 text-center block">Value per {unit || 'Unit'}</label>
                <input 
                  type="number"
                  step="any"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white" 
                  placeholder="e.g. 5, 500, 12"
                  value={weightValue}
                  onChange={(e) => setWeightValue(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[11px] font-medium text-slate-500 text-center block">Standard Unit</label>
                <select 
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                >
                  <option>kg</option>
                  <option>g</option>
                  <option>L</option>
                  <option>ml</option>
                  <option>pcs</option>
                  <option>can</option>
                </select>
              </div>
            </div>
            
            <div className="text-center p-2 bg-white border border-dashed border-slate-200 rounded text-xs text-slate-500">
              Summary: <span className="font-bold text-slate-900">1 {unit || 'Unit'} = {weightValue} {weightUnit}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Stock In Hand ({unit})</label>
              <input 
                type="number" 
                step="any"
                min="0"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900" 
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-amber-700">Low Threshold ({unit})</label>
              <input 
                type="number" 
                step="any"
                min="0"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 border-amber-200 bg-amber-50" 
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : editItem ? 'Update Item' : 'Add Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
