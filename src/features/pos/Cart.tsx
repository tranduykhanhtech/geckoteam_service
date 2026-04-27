import { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/posStore';
import { useCRMStore } from '../../store/crmStore';
import { useStoreStore } from '../../store/storeStore';
import { useAuthStore } from '../../store/authStore';
import { 
  Trash2, Plus, Minus, ShoppingCart, CheckCircle2, 
  Loader2, Banknote, CreditCard, QrCode, User, 
  Search, X, ChevronRight, Receipt
} from 'lucide-react';
import { cn } from '../../lib/utils';

type PaymentMethod = 'Cash' | 'Card' | 'QR Code';

export function Cart() {
  const { 
    cart, updateQuantity, removeFromCart, clearCart, 
    getSubtotal, getLoyaltyDiscount, getTotal, 
    checkout, selectedCustomer, setSelectedCustomer,
    pointsToRedeem, setPointsToRedeem
  } = usePOSStore();
  const { customers, fetchCustomers } = useCRMStore();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastOrderCode, setLastOrderCode] = useState<string>('');
  const [lastOrderItems, setLastOrderItems] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [cashReceived, setCashReceived] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const total = getTotal();
  const subtotal = getSubtotal();
  const discount = getLoyaltyDiscount();
  const change = cashReceived ? parseFloat(cashReceived) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    try {
      const itemsCopy = [...cart];
      const code = await checkout();
      setLastOrderItems(itemsCopy);
      setLastOrderCode(code);
      setCheckoutSuccess(true);
    } catch (err: any) {
      console.error("Checkout error:", err);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredCustomers = customerSearch.length >= 2 
    ? customers.filter(c => 
        c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) || 
        c.phone?.includes(customerSearch)
      ).slice(0, 5)
    : [];

  const handleNewOrder = () => {
    setCheckoutSuccess(false);
    setPaymentMethod('Cash');
    setCashReceived('');
    setSelectedCustomer(null);
    setPointsToRedeem(0);
  };

  if (checkoutSuccess) {
    const profile = useAuthStore.getState().profile;
    const { stores, currentStoreId } = useStoreStore.getState();
    const currentStore = stores.find(s => s.id === currentStoreId);
    const orderTime = new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500 overflow-y-auto">
        <div className="mb-8 relative">
           <div className="h-24 w-24 bg-slate-900 rounded-[32px] flex items-center justify-center shadow-2xl animate-bounce">
              <CheckCircle2 className="h-12 w-12 text-white" />
           </div>
           <div className="absolute -top-4 -right-4 h-8 w-8 bg-emerald-50/50 rounded-full blur-xl" />
        </div>
        
        <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Success!</h2>
        <p className="text-slate-400 text-sm font-medium mb-10">Order processed and finalized.</p>
        
        {/* Realistic Detailed Digital Receipt */}
        <div className="bg-white w-full rounded-[40px] p-8 mb-10 border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
          {/* Header Section */}
          <div className="flex flex-col items-center pb-8 border-b border-slate-50 relative">
             <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6 text-slate-900" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 tracking-tight">{profile?.companies?.name || 'Gecko POS'}</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{currentStore?.name || 'Main Branch'}</p>
             
             {/* Receipt Top Pattern */}
             <div className="absolute top-0 left-0 right-0 h-1 flex justify-center gap-1.5 opacity-10 -mt-8">
                {Array.from({length: 12}).map((_, i) => (
                  <div key={i} className="h-3 w-3 bg-slate-400 rounded-full -mt-1.5" />
                ))}
             </div>
          </div>

          <div className="py-8 space-y-6">
             {/* Order Code Section */}
             <div className="flex flex-col items-center bg-slate-50 rounded-[24px] p-6 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Order Code</p>
                <p className="text-2xl font-mono font-bold text-slate-900 tracking-wider">
                  {lastOrderCode}
                </p>
             </div>

             {/* Items List Section */}
             <div className="py-6 border-y border-dashed border-slate-200 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Purchased Items</p>
                <div className="space-y-3">
                   {lastOrderItems.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-start text-[11px]">
                        <div className="flex-1 text-left pr-4">
                           <p className="font-bold text-slate-900">{item.name}</p>
                           <p className="text-slate-400 font-medium">{item.quantity} x ${Number(item.price).toFixed(2)}</p>
                        </div>
                        <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                     </div>
                   ))}
                </div>
             </div>

             {/* Meta Data Table */}
             <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center text-[10px]">
                   <span className="font-bold text-slate-400 uppercase tracking-widest text-left">Cashier</span>
                   <span className="font-bold text-slate-900">{profile?.full_name || 'System'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                   <span className="font-bold text-slate-400 uppercase tracking-widest text-left">Timestamp</span>
                   <span className="font-bold text-slate-900">{orderTime}</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                   <span className="font-bold text-slate-400 uppercase tracking-widest text-left">Payment</span>
                   <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{paymentMethod}</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                   </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-50">
                   <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Total Paid</span>
                      <span className="text-4xl font-black text-slate-900 tracking-tighter">${total.toFixed(2)}</span>
                   </div>
                   {paymentMethod === 'Cash' && (
                     <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-widest text-left">Change</span>
                        <span className="font-bold text-slate-900">${change.toFixed(2)}</span>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Bottom Branding */}
          <div className="pt-4 flex flex-col items-center opacity-30">
             <div className="h-px w-12 bg-slate-200 mb-4" />
             <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Powering your growth • gecko.io.vn</p>
          </div>

          {/* Bottom Zig-zag Edge */}
          <div className="absolute bottom-0 left-0 right-0 h-2 opacity-[0.03] flex">
            {Array.from({length: 20}).map((_, i) => (
              <div key={i} className="w-4 h-4 bg-slate-900 rotate-45 -mb-2" />
            ))}
          </div>
        </div>

        <button 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-16 rounded-[28px] font-bold text-xs uppercase tracking-[0.4em] transition-all active:scale-[0.98] shadow-2xl shadow-slate-900/20 flex items-center justify-center gap-3"
          onClick={handleNewOrder}
        >
          <Plus className="h-4 w-4" />
          Next Order
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Apple Style Cart Header */}
      <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900">
             <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Active Order</h2>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {cart.length} items added
            </p>
          </div>
        </div>
        {cart.length > 0 && (
          <button 
            onClick={clearCart}
            className="p-2 text-slate-400 hover:text-slate-900 transition-all"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Cart Items - Apple Style */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
            <ShoppingCart className="h-12 w-12 opacity-20" />
            <p className="font-medium text-xs uppercase tracking-widest text-slate-400">Cart is Empty</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartItemId} className="apple-card p-5 bg-white border border-slate-100/50">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <h4 className="font-semibold text-slate-900 text-sm leading-tight">{item.name}</h4>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">${Number(item.price).toFixed(2)} each</p>
                </div>
                <p className="font-semibold text-slate-900 text-sm">${(item.price * item.quantity).toFixed(2)}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1">
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center font-semibold text-slate-900 text-xs">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-900 uppercase tracking-wider transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Section - Apple Style */}
      <div className="bg-white border-t border-slate-100 p-6 space-y-6">
        
        {/* Customer Selector */}
        <div className="relative">
          {selectedCustomer ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center border border-slate-100">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-none">{selectedCustomer.full_name}</p>
                    <p className="text-[11px] font-medium text-slate-400 mt-1.5">{selectedCustomer.points || 0} Points</p>
                  </div>
                </div>
                <button onClick={() => setSelectedCustomer(null)} className="p-2 text-slate-400 hover:text-slate-900">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Point Redemption */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Redeem Points</span>
                  <span className="text-[11px] font-semibold text-slate-900">Max: {selectedCustomer.points || 0}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    max={selectedCustomer.points || 0}
                    min={0}
                    className="w-full bg-white border border-slate-200 rounded-xl h-10 px-4 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-slate-100 text-sm"
                    placeholder="Enter points..."
                    value={pointsToRedeem}
                    onChange={(e) => {
                      const val = Math.min(parseInt(e.target.value) || 0, selectedCustomer.points || 0);
                      setPointsToRedeem(val);
                    }}
                  />
                  <div className="shrink-0 font-semibold text-slate-900 text-xs">
                    -${discount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {!showCustomerSearch ? (
                <button 
                  onClick={() => setShowCustomerSearch(true)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-all border border-slate-200 border-dashed"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4 opacity-50" /> Add Member
                  </span>
                  <Plus className="h-4 w-4 opacity-50" />
                </button>
              ) : (
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    autoFocus
                    className="w-full pl-11 pr-10 h-12 bg-white border border-slate-900 rounded-2xl outline-none font-medium text-sm"
                    placeholder="Search phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  <button onClick={() => setShowCustomerSearch(false)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                  {filteredCustomers.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-3 bg-white border border-slate-100 rounded-[24px] shadow-2xl overflow-hidden z-50">
                      {filteredCustomers.map(c => (
                        <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }} className="w-full p-4 text-left hover:bg-slate-50 flex justify-between items-center group">
                          <div>
                            <p className="font-semibold text-slate-900">{c.full_name}</p>
                            <p className="text-[11px] text-slate-400">{c.phone}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Methods - Apple Style Tiles */}
        <div className="grid grid-cols-3 gap-3">
          {(['Cash', 'Card', 'QR Code'] as const).map((method) => {
            const Icon = method === 'Cash' ? Banknote : method === 'Card' ? CreditCard : QrCode;
            return (
              <button
                key={method}
                onClick={() => { setPaymentMethod(method); if (method !== 'Cash') setCashReceived(''); }}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 rounded-2xl transition-all duration-300 border",
                  paymentMethod === method
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                )}
              >
                <Icon className={cn("h-5 w-5", paymentMethod === method ? "text-white" : "text-slate-300")} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{method}</span>
              </button>
            );
          })}
        </div>

        {/* Cash Input Area */}
        {paymentMethod === 'Cash' && (
          <div className="space-y-4 animate-in fade-in duration-300">
             <div className="flex items-center gap-3">
                <div className="flex-1 space-y-2">
                   <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Received</label>
                   <input 
                     type="number"
                     className="w-full px-4 h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-semibold text-base"
                     placeholder="0.00"
                     value={cashReceived}
                     onChange={(e) => setCashReceived(e.target.value)}
                   />
                </div>
                <div className="flex-1 space-y-2">
                   <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-1">Change</label>
                   <div className={cn(
                     "h-11 flex items-center justify-end px-4 rounded-xl font-semibold text-lg border",
                     change >= 0 ? "bg-white border-slate-100 text-slate-900" : "bg-white border-rose-100 text-rose-500"
                   )}>
                      ${Math.abs(change).toFixed(2)}
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* Totals & Complete Button */}
        <div className="space-y-4">
          <div className="space-y-2 pt-2">
             <div className="flex justify-between items-center text-slate-400 font-medium text-xs">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
             </div>
             {discount > 0 && (
               <div className="flex justify-between items-center text-slate-900 font-medium text-xs">
                  <span>Loyalty Discount</span>
                  <span>-${discount.toFixed(2)}</span>
               </div>
             )}
          </div>
          
          <div className="flex justify-between items-end pb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Amount</span>
            <span className="text-4xl font-semibold text-slate-900 tracking-tight">${total.toFixed(2)}</span>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckingOut || (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived) < total))}
            className="apple-btn-primary w-full h-14 text-base uppercase tracking-widest disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isCheckingOut ? (
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            ) : (
              "Complete Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


