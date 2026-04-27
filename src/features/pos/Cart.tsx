import { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/posStore';
import { useCRMStore } from '../../store/crmStore';
import { Button } from '../../components/ui/button';
import { 
  Trash2, Plus, Minus, ShoppingCart, CheckCircle2, 
  Loader2, Banknote, CreditCard, QrCode, User, 
  Search, X, Star, ChevronRight, Receipt, Wallet
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Badge } from '../../components/ui/badge';

type PaymentMethod = 'Cash' | 'Card' | 'QR Code';

export function Cart() {
  const { 
    cart, updateQuantity, removeFromCart, clearCart, 
    getSubtotal, getLoyaltyDiscount, getTotal, 
    checkout, selectedCustomer, setSelectedCustomer,
    pointsToRedeem, setPointsToRedeem, loyaltyConfig
  } = usePOSStore();
  const { customers, fetchCustomers } = useCRMStore();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
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
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      await checkout();
      setCheckoutSuccess(true);
    } catch (err: any) {
      setCheckoutError(err.message || "Failed to process order.");
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
    setCheckoutError(null);
    setPaymentMethod('Cash');
    setCashReceived('');
    setSelectedCustomer(null);
    setPointsToRedeem(0);
  };

  if (checkoutSuccess) {
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-500">
        <div className="mb-8">
           <div className="h-20 w-20 bg-slate-900 rounded-[28px] flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="h-10 w-10 text-white" />
           </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">Order Confirmed</h2>
        <p className="text-slate-400 text-sm font-medium mb-10">Transaction completed successfully.</p>
        
        <div className="bg-slate-50 w-full rounded-3xl p-8 mb-10 border border-slate-100 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full border border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Receipt Summary
          </div>
          <div className="space-y-6">
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold uppercase tracking-wider">Method</span>
                <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-semibold uppercase tracking-wider text-[10px]">{paymentMethod}</span>
             </div>
             <div className="flex justify-between items-center py-6 border-y border-slate-200/50">
                <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Total Bill</span>
                <span className="text-3xl font-semibold text-slate-900 tracking-tight">${total.toFixed(2)}</span>
             </div>
             {paymentMethod === 'Cash' && (
               <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Change Back</span>
                  <span className="text-xl font-semibold text-slate-900 tracking-tight">${change.toFixed(2)}</span>
               </div>
             )}
          </div>
        </div>

        <button 
          className="w-full bg-slate-900 hover:bg-slate-800 text-white h-14 rounded-2xl font-semibold text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98]"
          onClick={handleNewOrder}
        >
          Start New Order
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


