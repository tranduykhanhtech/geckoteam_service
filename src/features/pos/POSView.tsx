import { useState } from 'react';
import { ProductList } from './ProductList';
import { Cart } from './Cart';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { usePOSStore } from '../../store/posStore';
import { useShiftStore } from '../../store/shiftStore';
import { OpenShiftOverlay, CloseShiftModal } from './ShiftManagement';
import { cn } from '../../lib/utils';
import { useEffect } from 'react';

export function POSView() {
  const [activeView, setActiveView] = useState<'products' | 'cart'>('products');
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const { cart } = usePOSStore();
  const { currentShift, fetchCurrentShift, isLoading: isShiftLoading } = useShiftStore();

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  return (
    <div className="flex-1 flex overflow-hidden h-full bg-slate-50 relative">
      {!isShiftLoading && !currentShift && <OpenShiftOverlay />}
      {isCloseShiftOpen && <CloseShiftModal onClose={() => setIsCloseShiftOpen(false)} />}
      
      {/* Products Area */}
      <div className={cn(
        "flex-1 flex flex-col h-full",
        activeView === 'cart' ? "hidden md:flex" : "flex"
      )}>
        <ProductList onOpenCloseShift={() => setIsCloseShiftOpen(true)} />
      </div>

      {/* Cart Area */}
      <div className={cn(
        "flex flex-col w-full md:w-80 lg:w-[400px] shrink-0 border-l border-slate-200 bg-white shadow-[rgba(0,0,0,0.05)_0px_0px_20px_0px] z-10",
        activeView === 'products' ? "hidden md:flex" : "flex"
      )}>
        {/* Mobile Cart Back Header */}
        <div className="md:hidden flex items-center p-4 border-b bg-white">
          <button 
            onClick={() => setActiveView('products')}
            className="p-2 hover:bg-slate-100 rounded-full mr-2"
          >
            <ArrowLeft className="h-6 w-6 text-slate-600" />
          </button>
          <span className="font-bold text-slate-900">Review Order</span>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <Cart />
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {activeView === 'products' && (
        <button
          onClick={() => setActiveView('cart')}
          className="md:hidden fixed bottom-6 right-6 h-14 w-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl z-40 animate-in zoom-in duration-300"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cart.length > 0 && (
              <span className="absolute -top-3 -right-3 h-6 w-6 bg-slate-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center border-2 border-white">
                {cart.length}
              </span>
            )}
          </div>
        </button>
      )}
    </div>
  );
}
