import { useEffect, useState } from 'react';
import { usePOSStore } from '../../store/posStore';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { Coffee, CakeSlice, Utensils, CupSoda, Loader2, PackageOpen, Search, Filter, Plus } from 'lucide-react';

const getCategoryIcon = (category: string, className?: string) => {
  const defaultClass = className || "h-4 w-4 mr-2";
  const catLower = category.toLowerCase();
  if (catLower.includes('coffee')) return <Coffee className={defaultClass} />;
  if (catLower.includes('tea') || catLower.includes('drink')) return <CupSoda className={defaultClass} />;
  if (catLower.includes('pastry') || catLower.includes('cake')) return <CakeSlice className={defaultClass} />;
  return <Utensils className={defaultClass} />;
};

export function ProductList() {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    addToCart,
    fetchProductsAndCategories,
    isLoading
  } = usePOSStore();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  // Filter products by search and category
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category_name === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Apple Style Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-30 sticky top-0 px-6 py-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Menu</h2>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{filteredProducts.length} items available</p>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full pl-11 pr-4 h-11 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-slate-200 rounded-2xl outline-none transition-all font-medium text-slate-900 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Category Scroll - Apple Style */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x items-center">
          <button
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "px-6 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-300 snap-start",
              selectedCategory === 'All'
                ? "bg-slate-900 text-white shadow-md"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={cn(
                "px-6 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-300 flex items-center snap-start",
                selectedCategory === category.name
                  ? "bg-slate-900 text-white shadow-md"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-6 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-900">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
            <p className="text-sm font-medium">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-24">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="group cursor-pointer"
                onClick={() => addToCart(product)}
              >
                {/* Product Card - Apple Style */}
                <div className="apple-card flex flex-col h-full overflow-hidden bg-white">
                  <div className="h-44 relative overflow-hidden bg-slate-50 border-b border-slate-50">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-200">
                        {getCategoryIcon(product.category_name || '', "h-16 w-16 opacity-50")}
                      </div>
                    )}
                    
                    {/* Minimal Price Badge */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-white/90 backdrop-blur-md text-slate-900 px-3 py-1 rounded-xl text-xs font-semibold shadow-sm border border-white/50">
                        ${Number(product.price).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1 justify-between">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-slate-600 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        {product.category_name}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                       <div className="h-9 w-9 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white flex items-center justify-center transition-all duration-300">
                          <Plus className="h-4 w-4" />
                       </div>
                       <span className="text-[10px] font-semibold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                          Add
                       </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

