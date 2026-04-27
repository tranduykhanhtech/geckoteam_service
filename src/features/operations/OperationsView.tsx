import { useState, useEffect } from 'react';
import { usePOSStore } from '../../store/posStore';
import { useAuthStore } from '../../store/authStore';
import { AddProductForm } from './AddProductForm';
import { VoidBillForm } from './VoidBillForm';
import { StoreSettings } from './StoreSettings';
import {
  Ban, PackagePlus, LayoutGrid,
  ShieldAlert, Sliders, Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';

import { ProductManagementTable } from './ProductManagementTable';

type OperationTab = 'menu-management' | 'order-management' | 'store-settings';

export function OperationsView() {
  const { profile } = useAuthStore();
  const { fetchProductsAndCategories, categories, voidOrder } = usePOSStore();
  const [activeTab, setActiveTab] = useState<OperationTab>('menu-management');

  useEffect(() => {
    // When managing menu, fetch all products including unavailable ones
    fetchProductsAndCategories(activeTab === 'menu-management');
  }, [fetchProductsAndCategories, activeTab]);

  // Only allow admin and manager roles
  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
        <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-slate-500 text-center max-w-md mt-2 font-medium">
          Command operations are reserved for privileged accounts. Please contact your administrator.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: 'menu-management', label: 'Menu Catalog', icon: LayoutGrid },
    { id: 'order-management', label: 'Order Overrides', icon: Activity },
    ...(profile.role === 'admin' ? [{ id: 'store-settings', label: 'Global Config', icon: Sliders }] : []),
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Apple Style Header */}
      <div className="p-8 pb-0 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Settings</h2>
        </div>
        <p className="text-slate-500 font-medium text-sm mt-1">Configure your store and menu.</p>

        {/* Minimalist Tabs */}
        <div className="mt-8 flex items-center overflow-x-auto no-scrollbar">
          <div className="flex gap-2 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as OperationTab)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                <tab.icon className={cn("h-4 w-4", activeTab === tab.id ? "text-white" : "text-slate-400")} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
        <div className="max-w-4xl mx-auto space-y-8">
          {activeTab === 'menu-management' && (
            <>
              <div className="apple-card overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-lg tracking-tight">
                    <PackagePlus className="h-5 w-5 text-slate-900" />
                    New Product
                  </h3>
                </div>
                <div className="p-6">
                  <AddProductForm categories={categories} onSuccess={() => fetchProductsAndCategories(true)} />
                </div>
              </div>

              <div className="apple-card overflow-hidden bg-white">
                <div className="p-6 border-b border-slate-50">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-lg tracking-tight">
                    <LayoutGrid className="h-5 w-5 text-slate-900" />
                    Catalog
                  </h3>
                </div>
                <div className="p-6 overflow-x-auto">
                  <ProductManagementTable />
                </div>
              </div>
            </>
          )}

          {activeTab === 'order-management' && (
            <div className="apple-card overflow-hidden bg-white">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-lg tracking-tight">
                  <Ban className="h-5 w-5 text-slate-900" />
                  Void Order
                </h3>
              </div>
              <div className="p-6">
                <VoidBillForm voidOrder={voidOrder} />
              </div>
            </div>
          )}

          {activeTab === 'store-settings' && (
            <div className="apple-card overflow-hidden bg-white">
              <div className="p-6 border-b border-slate-50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-lg tracking-tight">
                  <Sliders className="h-5 w-5 text-slate-900" />
                  Configurations
                </h3>
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
