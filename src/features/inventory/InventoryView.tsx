import { useState, useEffect } from 'react';
import { InventoryTable } from './InventoryTable';
import { Button } from '../../components/ui/button';
import { FileDown, Plus, History, Loader2, Package, AlertTriangle, XCircle, TrendingUp } from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';
import { Badge } from '../../components/ui/badge';
import { NewItemModal } from './NewItemModal';
import { AdjustmentHistoryModal } from './AdjustmentHistoryModal';
import { cn } from '../../lib/utils';

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
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-slate-500 font-medium">Preparing inventory data...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-[#F8FAFC] min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-1 bg-emerald-500 rounded-full" />
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Inventory Management</h2>
          </div>
          <p className="text-slate-500 font-medium">Monitor your stock levels, manage ingredients, and track adjustments.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-11 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
            onClick={() => setIsHistoryOpen(true)}
          >
            <History className="mr-2 h-4 w-4" />
            History Log
          </Button>

          {/* Export Dropdown */}
          <div className="relative">
            <Button 
              variant="outline" 
              className="h-11 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
              onClick={() => setIsExportOpen(!isExportOpen)}
            >
              <FileDown className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            
            {isExportOpen && (
              <>
                {/* Backdrop to close dropdown when clicking outside */}
                <div className="fixed inset-0 z-40" onClick={() => setIsExportOpen(false)} />
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <button 
                    onClick={() => {
                      console.log('Exporting CSV...');
                      handleExportCSV();
                      setIsExportOpen(false);
                    }}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 border-b border-slate-100"
                  >
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Export as CSV (.csv)
                  </button>
                  <button 
                    onClick={() => {
                      console.log('Exporting Excel...');
                      handleExportExcel();
                      setIsExportOpen(false);
                    }}
                    className="w-full px-4 py-3 text-sm text-left hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2"
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Export as Excel (.xls)
                  </button>
                </div>
              </>
            )}
          </div>

          <Button 
            className="h-11 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 px-6"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Add New Item
          </Button>
        </div>
      </div>

      {/* Summary Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Total Items Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Package className="h-24 w-24 text-slate-900" />
          </div>
          <div className="relative z-10">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4 text-slate-600">
              <Package className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Total Ingredients</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-900">{items.length}</p>
              <span className="text-emerald-500 text-xs font-bold flex items-center">
                <TrendingUp className="h-3 w-3 mr-0.5" />
                Live
              </span>
            </div>
          </div>
        </div>
        
        {/* Low Stock Card */}
        <div className={cn(
          "p-6 rounded-2xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300",
          lowStockCount > 0 ? "bg-amber-50/50 border-amber-200/60" : "bg-white border-slate-200/60"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-amber-600">
            <AlertTriangle className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
              lowStockCount > 0 ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"
            )}>
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-slate-900">{lowStockCount}</p>
              {lowStockCount > 0 && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold py-1">
                  Needs Reorder
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Out of Stock Card */}
        <div className={cn(
          "p-6 rounded-2xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300",
          outOfStockCount > 0 ? "bg-red-50/50 border-red-200/60" : "bg-white border-slate-200/60"
        )}>
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-red-600">
            <XCircle className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <div className={cn(
              "h-12 w-12 rounded-xl flex items-center justify-center mb-4",
              outOfStockCount > 0 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-400"
            )}>
              <XCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Critical Shortage</p>
            <div className="flex items-center gap-3">
              <p className="text-4xl font-black text-slate-900">{outOfStockCount}</p>
              {outOfStockCount > 0 && (
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold py-1">
                  Urgent
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <InventoryTable onEditItem={handleEditItem} />
      </div>
      
      {/* Modals */}
      <NewItemModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        editItem={selectedItem} 
      />
      <AdjustmentHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
    </div>
  );
}
