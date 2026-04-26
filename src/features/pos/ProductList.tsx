import { useEffect } from 'react';
import { usePOSStore } from '../../store/posStore';
import { Card, CardContent } from '../../components/ui/card';
import { cn } from '../../lib/utils';
import { Coffee, CakeSlice, Utensils, CupSoda, Loader2, PackageOpen } from 'lucide-react';

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

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  // Filter products by selected category name (or 'All')
  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category_name === selectedCategory);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Category Filters */}
      <div className="pt-6 px-6 pb-2 bg-slate-50 shrink-0 z-10 sticky top-0">
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
          <button
            onClick={() => setSelectedCategory('All')}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center snap-start border",
              selectedCategory === 'All'
                ? "bg-slate-900 text-white border-slate-900 shadow-md"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
            )}
          >
            All Items
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center snap-start border",
                selectedCategory === category.name
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              )}
            >
              {getCategoryIcon(category.name, cn("h-4 w-4 mr-2", selectedCategory === category.name ? "text-emerald-400" : "text-slate-400"))}
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
            <p className="font-medium">Loading your premium menu...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 max-w-sm mx-auto text-center">
            <div className="h-20 w-20 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-6">
              <PackageOpen className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Your menu is empty</h3>
            <p className="text-slate-500">There are no products available in your company's database yet. Go to Operations to add some!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-24">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group cursor-pointer rounded-2xl border-0 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 bg-white overflow-hidden flex flex-col relative"
                onClick={() => addToCart(product)}
              >
                {/* Product Image Area */}
                <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:from-emerald-50/50 group-hover:to-teal-50/50 transition-colors duration-300">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    getCategoryIcon(product.category_name || '', "h-14 w-14 text-slate-300 group-hover:text-emerald-400/50 transition-colors duration-300")
                  )}

                  {/* Subtle Add Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm text-emerald-600 font-bold px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      Tap to Add
                    </div>
                  </div>
                </div>

                <CardContent className="p-4 flex flex-col flex-1 justify-between bg-white relative z-10">
                  <div>
                    <h3 className="font-bold text-slate-900 text-[14px] leading-tight mb-0.5 group-hover:text-emerald-600 transition-colors">
                      {product.name}
                    </h3>
                    {product.category_name && (
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-2">
                        {product.category_name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <span className="font-bold text-base text-emerald-600">
                      ${Number(product.price).toFixed(2)}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                      <span className="text-xl font-light text-slate-400 group-hover:text-emerald-500 leading-none pb-0.5">+</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
