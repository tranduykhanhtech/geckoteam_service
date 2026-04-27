import { useState } from 'react';
import { usePOSStore, type Product } from '../../store/posStore';
import { 
  Search, Edit2, Eye, EyeOff, Package, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function ProductManagementTable() {
  const { products, categories, updateProduct, isLoading } = usePOSStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<{ name: string; price: string }>({ name: '', price: '' });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleStartEdit = (p: Product) => {
    setEditingId(p.id);
    setEditValue({ name: p.name, price: p.price.toString() });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateProduct(id, { 
        name: editValue.name, 
        price: parseFloat(editValue.price) 
      });
      setEditingId(null);
    } catch (err) {
      alert('Failed to update product');
    }
  };


  const toggleAvailability = async (p: Product) => {
    try {
      await updateProduct(p.id, { is_available: !p.is_available });
    } catch (err) {
      alert('Failed to update availability');
    }
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-slate-900 animate-spin" />
          <Package className="h-4 w-4 text-slate-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider text-center">Syncing Catalog</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Apple Style Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative group w-full sm:w-64 lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
          <input 
            type="text"
            placeholder="Search catalog..."
            className="w-full pl-12 pr-6 h-11 bg-white border border-slate-100 rounded-2xl text-xs font-semibold focus:ring-1 focus:ring-slate-900 outline-none transition-all placeholder:text-slate-300 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap",
              selectedCategory === 'All' ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-400 border border-slate-100"
            )}
          >
            All
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap",
                selectedCategory === cat.id ? "bg-slate-900 text-white shadow-sm" : "bg-white text-slate-400 border border-slate-100"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Product</th>
              <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Category</th>
              <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Price</th>
              <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Visibility</th>
              <th className="px-6 py-4 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredProducts.map((p) => (
              <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-white border border-slate-100 overflow-hidden mr-4 shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    {editingId === p.id ? (
                      <input 
                        className="bg-white border border-slate-900 rounded-lg px-2 py-1 text-sm font-semibold w-32 sm:w-40 focus:ring-0 outline-none"
                        value={editValue.name}
                        onChange={e => setEditValue({ ...editValue, name: e.target.value })}
                        autoFocus
                      />
                    ) : (
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-sm tracking-tight truncate max-w-[120px] sm:max-w-none">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wide">
                          ID: {p.id.slice(0, 8)}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 hidden md:table-cell">
                  <span className="text-[10px] font-semibold px-2.5 py-1 bg-slate-50 rounded text-slate-500 uppercase tracking-wide">
                    {p.category_name}
                  </span>
                </td>
                <td className="px-6 py-3">
                   {editingId === p.id ? (
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">$</span>
                        <input 
                          type="number"
                          className="bg-white border border-slate-900 rounded-lg pl-5 pr-2 py-1 text-sm font-semibold w-full outline-none"
                          value={editValue.price}
                          onChange={e => setEditValue({ ...editValue, price: e.target.value })}
                        />
                      </div>
                   ) : (
                      <span className="text-sm font-semibold text-slate-900 tracking-tight">${p.price.toLocaleString()}</span>
                   )}
                </td>
                <td className="px-6 py-3">
                  <button 
                    onClick={() => toggleAvailability(p)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all",
                      p.is_available 
                        ? "text-slate-900 bg-slate-100 hover:bg-slate-200" 
                        : "text-slate-400 bg-slate-50 hover:bg-slate-100"
                    )}
                  >
                    {p.is_available ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    <span className="hidden sm:inline">{p.is_available ? 'Live' : 'Hidden'}</span>
                  </button>
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-2 transition-all">
                    {editingId === p.id ? (
                      <>
                        <button 
                          onClick={() => handleSaveEdit(p.id)}
                          className="h-8 px-4 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold text-[10px] uppercase tracking-wider transition-all"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="h-8 px-4 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 font-semibold text-[10px] uppercase tracking-wider transition-all"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-end gap-2 transition-all">
                        <button 
                          onClick={() => handleStartEdit(p)}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
