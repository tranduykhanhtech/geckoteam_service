import { ProductList } from './ProductList';
import { Cart } from './Cart';

export function POSView() {
  return (
    <div className="flex-1 flex overflow-hidden h-full bg-slate-50">
      {/* Left side: Products */}
      <ProductList />

      {/* Right side: Cart */}
      <div className="flex flex-col w-full md:w-80 lg:w-[400px] shrink-0 border-l border-slate-200 bg-white shadow-[rgba(0,0,0,0.05)_0px_0px_20px_0px] z-10">
        <div className="flex-1 overflow-hidden flex flex-col">
          <Cart />
        </div>
      </div>
    </div>
  );
}
