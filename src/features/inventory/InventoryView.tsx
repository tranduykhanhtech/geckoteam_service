import { useState, useEffect } from 'react';
import { InventoryTable } from './InventoryTable';
import { 
  FileDown, Plus, History, Loader2, Package, 
  AlertTriangle, XCircle, 
  ChevronRight, Layers
} from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';
import { NewItemModal } from './NewItemModal';
import { AdjustmentHistoryModal } from './AdjustmentHistoryModal';

export function InventoryView() {
  const { items, isLoading, fetchItems, fetchCategories } = useInventoryStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => { 
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

  const handleEditItem = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleExportCSV = () => {
    if (items.length === 0) return;
    const headers = ['ID', 'Name', 'Category', 'Quantity', 'Unit', 'Threshold'];
    const csvContent = [
      headers.join(','),
      ...items.map(item => [
        item.id,
        `"${item.name}"`,
        item.category_name,
        item.quantity,
        item.unit,
        item.threshold
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (items.length === 0) return;
    let tableHtml = '<html><head><meta charset="utf-8"></head><body><table><thead><tr>';
    ['ID', 'Name', 'Category', 'Quantity', 'Unit', 'Threshold'].forEach(h => tableHtml += `<th>${h}</th>`);
    tableHtml += '</tr></thead><tbody>';
    items.forEach(item => {
      tableHtml += `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.category_name}</td><td>${item.quantity}</td><td>${item.unit}</td><td>${item.threshold}</td></tr>`;
    });
    tableHtml += '</tbody></table></body></html>';
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const lowStockCount = items.filter(item => item.quantity <= item.threshold && item.quantity > 0).length;
  const outOfStockCount = items.filter(item => item.quantity === 0).length;

  if (isLoading && items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50/50">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-slate-900 animate-spin" />
          <Package className="h-4 w-4 text-slate-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 text-slate-400 font-medium tracking-wider uppercase text-[10px]">Auditing Stock</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full space-y-8 p-4 md:p-8 bg-slate-50 overflow-y-auto pb-24">
      {/* Apple Style Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Inventory</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Unified supply chain management.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            className="apple-btn-secondary h-11 px-6 text-sm flex items-center gap-2"
            onClick={() => setIsHistoryOpen(true)}
          >
            <History className="h-4 w-4" />
            Logs
          </button>

          <div className="relative">
            <button 
              className="apple-btn-secondary h-11 px-6 text-sm flex items-center gap-2"
              onClick={() => setIsExportOpen(!isExportOpen)}
            >
              <FileDown className="h-4 w-4" />
              Export
            </button>
            
            {isExportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                <div className="absolute right-0 top-full mt-3 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1.5 animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => { handleExportCSV(); setIsExportOpen(false); }}
                    className="w-full px-4 py-2.5 text-xs text-left hover:bg-slate-50 text-slate-900 font-semibold flex items-center justify-between rounded-xl group transition-all"
                  >
                    CSV Format
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </button>
                  <button 
                    onClick={() => { handleExportExcel(); setIsExportOpen(false); }}
                    className="w-full px-4 py-2.5 text-xs text-left hover:bg-slate-50 text-slate-900 font-semibold flex items-center justify-between rounded-xl group transition-all"
                  >
                    Excel Sheet
                    <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                  </button>
                </div>
              </>
            )}
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="apple-btn-primary h-11 px-6 text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Material
          </button>
        </div>
      </div>

      {/* Minimalist Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Stock Items" 
          value={items.length.toString()} 
          icon={<Package className="h-5 w-5" />}
          subtitle="Total SKUs tracked"
        />
        <MetricCard 
          title="Low Warning" 
          value={lowStockCount.toString()} 
          icon={<AlertTriangle className="h-5 w-5" />}
          subtitle={lowStockCount > 0 ? "Items need restock" : "All levels optimal"}
        />
        <MetricCard 
          title="Out of Stock" 
          value={outOfStockCount.toString()} 
          icon={<XCircle className="h-5 w-5" />}
          subtitle="Zero quantity"
        />
      </div>

      {/* Main Content Area */}
      <div className="apple-card overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                 <Layers className="h-4 w-4 text-slate-900" />
              </div>
              <h3 className="font-semibold text-lg text-slate-900 tracking-tight">Active Ledger</h3>
           </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <InventoryTable onEditItem={handleEditItem} />
        </div>
      </div>
      
      <NewItemModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        editItem={selectedItem} 
      />
      <AdjustmentHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function MetricCard({ title, value, icon, subtitle }: any) {
  return (
    <div className="apple-card p-8 bg-white group border border-slate-100/50">
       <div className="flex justify-between items-start mb-6">
          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
             {icon}
          </div>
       </div>
       
       <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-slate-900 tracking-tight mb-1">{value}</h3>
          <p className="text-[11px] font-medium text-slate-400">{subtitle}</p>
       </div>
    </div>
  );
}

