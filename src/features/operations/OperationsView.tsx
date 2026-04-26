import { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';
import { AddProductForm } from './AddProductForm';
import { VoidBillForm } from './VoidBillForm';
import { StoreSettings } from './StoreSettings';
import { Settings, Ban, PackagePlus } from 'lucide-react';
import { cn } from '../../lib/utils';

type OperationTab = 'menu-management' | 'order-management' | 'store-settings';

export function OperationsView() {
  const { profile } = useAuthStore();
  const { fetchProductsAndCategories, categories, voidOrder } = usePOSStore();
  const [activeTab, setActiveTab] = useState<OperationTab>('menu-management');

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  // Only allow admin and manager roles
  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50">
        <Ban className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-slate-500 text-center max-w-md mt-2">
          You do not have permission to view this page. Operations are restricted to Managers and Admins.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      <div className="p-8 pb-6 border-b border-slate-200 bg-white">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-indigo-500" />
          Store Operations
        </h2>
        <p className="text-slate-500 mt-2">Manage your POS menu, pricing, and administrative overrides.</p>
        
        <div className="flex gap-8 mt-8 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('menu-management')}
            className={cn(
              "pb-4 text-sm font-bold transition-colors relative",
              activeTab === 'menu-management' ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
            )}
          >
            Menu Management
            {activeTab === 'menu-management' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('order-management')}
            className={cn(
              "pb-4 text-sm font-bold transition-colors relative",
              activeTab === 'order-management' ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
            )}
          >
            Order Management
            {activeTab === 'order-management' && (
              <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </button>
          {profile.role === 'admin' && (
            <button
              onClick={() => setActiveTab('store-settings')}
              className={cn(
                "pb-4 text-sm font-bold transition-colors relative",
                activeTab === 'store-settings' ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Store Settings
              {activeTab === 'store-settings' && (
                <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl">
          {activeTab === 'menu-management' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <PackagePlus className="h-5 w-5 text-amber-500" />
                    Add Menu Item
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">New Product</p>
                </div>
              </div>
              <div className="p-6">
                <AddProductForm categories={categories} onSuccess={fetchProductsAndCategories} />
              </div>
            </div>
          )}

          {activeTab === 'order-management' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Ban className="h-5 w-5 text-red-500" />
                    Void Completed Bill
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Administrative Override</p>
                </div>
              </div>
              <div className="p-6">
                <VoidBillForm voidOrder={voidOrder} />
              </div>
            </div>
          )}

          {activeTab === 'store-settings' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-indigo-500" />
                    Global Settings
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">Configuration</p>
                </div>
              </div>
              <div className="p-6">
                <StoreSettings />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
