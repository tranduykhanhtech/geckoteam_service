import { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/posStore';
import { useCRMStore } from '../../store/crmStore';
import { Button } from '../../components/ui/button';
import { Trash2, Plus, Minus, ShoppingCart, CheckCircle2, Loader2, Banknote, CreditCard, QrCode, User, Search, X, Star } from 'lucide-react';
import { cn } from '../../lib/utils';

type PaymentMethod = 'Cash' | 'Card' | 'QR Code';

export function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, getTotal, checkout } = usePOSStore();
  const { customers, fetchCustomers, recordPurchase } = useCRMStore();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  
  // Customer Selection States
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Cash Management States
  const [cashReceived, setCashReceived] = useState<string>('');

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const total = getTotal();
  const change = cashReceived ? parseFloat(cashReceived) - total : 0;

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    
    try {
      await checkout();
      
      // If a customer is selected, record the purchase for points
      if (selectedCustomer) {
        await recordPurchase(selectedCustomer.id, total);
      }
      
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
        c.phone?.includes(customerSearch) ||
        c.email?.toLowerCase().includes(customerSearch.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleNewOrder = () => {
    setCheckoutSuccess(false);
    setCheckoutError(null);
    setPaymentMethod('Cash');
    setCashReceived('');
    setSelectedCustomer(null);
  };

  // If checkout was successful, show the success screen
  if (checkoutSuccess) {
    return (
      <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 items-center justify-center p-6 text-center">
        <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h2>
        <p className="text-slate-500 mb-6">
          Order has been sent to the kitchen.
        </p>
        
        <div className="bg-slate-50 w-full rounded-2xl p-6 mb-8 border border-slate-100">
          <div className="flex justify-between items-center mb-3 text-xs uppercase font-bold tracking-widest text-slate-400">
            <span>Payment Summary</span>
          </div>
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-slate-500">Method</span>
            <span className="font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded text-[10px]">{paymentMethod}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-4 pb-4 border-b border-slate-200/60">
            <span className="text-slate-500">Total Bill</span>
            <span className="text-xl font-black text-slate-900">${total.toFixed(2)}</span>
          </div>
          {paymentMethod === 'Cash' && cashReceived && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-slate-500">
                <span>Received</span>
                <span>${parseFloat(cashReceived).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-600">Change Back</span>
                <span className="text-2xl font-black text-emerald-600">${change.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <Button 
          className="w-full bg-slate-900 text-white hover:bg-slate-800 h-12 text-lg"
          onClick={handleNewOrder}
        >
          Start New Order
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      {/* Cart Header */}
      <div className="p-6 border-b border-slate-200/60 flex items-center justify-between bg-white z-20 shadow-sm relative">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center tracking-tight">
            <ShoppingCart className="mr-2 h-6 w-6 text-emerald-500" />
            Current Order
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-0.5 ml-8">
            {cart.length} {cart.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        {cart.length > 0 && (
          <button 
            onClick={clearCart}
            className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider bg-slate-50 hover:bg-red-50 px-3 py-1.5 rounded-full"
          >
            Clear
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-2">
              <ShoppingCart className="h-10 w-10 text-slate-300" />
            </div>
            <p className="font-medium text-slate-500">Scan or tap items to add</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.cartItemId} className="group flex flex-col p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 relative overflow-hidden">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-4">
                  <h4 className="font-bold text-slate-900 text-sm leading-tight mb-0.5">{item.name}</h4>
                  <p className="text-[11px] font-medium text-slate-400">${Number(item.price).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-base">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                <div className="flex items-center gap-1 bg-slate-50 rounded-full p-1 border border-slate-100">
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, -1)}
                    className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-slate-900">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, 1)}
                    className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.cartItemId)}
                  className="h-9 w-9 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Panel */}
      <div className="border-t border-slate-200/60 bg-white p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20">
        
        {/* Customer Selection */}
        <div className="mb-4">
          {selectedCustomer ? (
            <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-none">{selectedCustomer.full_name}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <Star className="h-2 w-2 fill-emerald-600" />
                    {selectedCustomer.points || 0} pts
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              {!showCustomerSearch ? (
                <button 
                  onClick={() => setShowCustomerSearch(true)}
                  className="w-full flex items-center justify-between p-2 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition-all text-xs font-bold"
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Add Customer for Points
                  </div>
                  <Plus className="h-3 w-3" />
                </button>
              ) : (
                <div className="space-y-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      autoFocus
                      className="w-full pl-9 pr-8 h-9 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                      placeholder="Search phone or name..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    <button 
                      onClick={() => {
                        setShowCustomerSearch(false);
                        setCustomerSearch('');
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  {filteredCustomers.length > 0 && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-50 animate-in slide-in-from-bottom-2 duration-200">
                      {filteredCustomers.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setShowCustomerSearch(false);
                            setCustomerSearch('');
                          }}
                          className="w-full p-3 text-left hover:bg-emerald-50 transition-colors group"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">{c.full_name}</p>
                              <p className="text-[10px] text-slate-500">{c.phone || c.email || 'No contact'}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black text-emerald-600">{c.points || 0} pts</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="mb-4">
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-xl">
            {([
              { id: 'Cash', icon: Banknote },
              { id: 'Card', icon: CreditCard },
              { id: 'QR Code', icon: QrCode },
            ] as const).map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setPaymentMethod(id);
                  if (id !== 'Cash') setCashReceived('');
                }}
                className={cn(
                  "py-2 flex items-center justify-center gap-2 rounded-lg text-[11px] font-black transition-all duration-300 uppercase tracking-tight",
                  paymentMethod === id
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                <Icon className={cn("h-4 w-4", paymentMethod === id ? "text-emerald-500" : "text-slate-400")} />
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Cash Input & Change (Only for Cash) */}
        {paymentMethod === 'Cash' && (
          <div className="mb-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Cash Received</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    className="w-full pl-7 pr-3 h-10 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-bold text-slate-900"
                    placeholder="0.00"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Change</label>
                <div className={cn(
                  "h-10 px-3 flex items-center justify-end rounded-xl font-black text-lg border",
                  change >= 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-red-50 border-red-100 text-red-600"
                )}>
                  ${Math.abs(change).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Quick Cash Buttons */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {[Math.ceil(total), 5, 10, 20, 50, 100].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setCashReceived(amount.toString())}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-500 hover:text-white text-[11px] font-bold text-slate-600 transition-all border border-slate-200/50 hover:border-emerald-500 shadow-sm"
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between items-end pt-1">
            <span className="text-sm font-bold text-slate-900">Total</span>
            <span className="text-[25px] font-extrabold tracking-tight text-slate-900 leading-none">${total.toFixed(2)}</span>
          </div>
        </div>

        {checkoutError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 font-medium text-center">
            {checkoutError}
          </div>
        )}

        {/* Checkout Button */}
        <button 
          onClick={handleCheckout}
          disabled={cart.length === 0 || isCheckingOut || (paymentMethod === 'Cash' && (!cashReceived || parseFloat(cashReceived) < total))}
          className="w-full relative group overflow-hidden rounded-xl p-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
        >
          {/* Gradient Border/Glow effect */}
          <span className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
          
          <div className="relative bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[10px] px-4 py-3 flex items-center justify-center gap-3 transition-transform duration-300 group-active:scale-[0.98]">
            {isCheckingOut ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <>
                <span className="text-lg font-black text-white tracking-wide uppercase">
                  {paymentMethod === 'Cash' && cashReceived ? 'Finish Order' : `Pay $${total.toFixed(2)}`}
                </span>
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}


