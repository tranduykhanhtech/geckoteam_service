import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import {
  DollarSign, ShoppingBag, AlertTriangle, TrendingUp,
  Users, ArrowUpRight, Loader2, Search, CalendarDays,
  ReceiptText, BarChart2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────
type DateOption = 'today' | 'yesterday' | '2days' | '3days' | 'custom';

interface DaySummary {
  grossSale: number;   // all completed + voided orders total
  netSale: number;     // only completed orders total
  tc: number;          // transaction count (completed)
  ac: number;          // average check = netSale / tc
  voidedCount: number;
  voidedAmount: number;
}

interface CashierStats {
  id: string;
  name: string;
  grossSale: number;
  netSale: number;
  tc: number;
  ac: number;
}

interface MenuItemSale {
  product_id: string;
  name: string;
  qty: number;
  revenue: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function getDayRange(option: DateOption, customDate: string): { start: string; end: string; label: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const offset = option === 'today' ? 0 : option === 'yesterday' ? 1 : option === '2days' ? 2 : option === '3days' ? 3 : 0;

  let target: Date;
  if (option === 'custom' && customDate) {
    target = new Date(customDate + 'T00:00:00');
  } else {
    target = new Date(today);
    target.setDate(target.getDate() - offset);
  }

  const start = new Date(target);
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(23, 59, 59, 999);

  const labels: Record<DateOption, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '2days': '2 Days Ago',
    '3days': '3 Days Ago',
    custom: customDate || 'Custom',
  };

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: labels[option],
  };
}

const DATE_OPTIONS: { id: DateOption; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '2days', label: '2 Days Ago' },
  { id: '3days', label: '3 Days Ago' },
  { id: 'custom', label: 'Custom' },
];

// ─── Main Component ────────────────────────────────────────────────────────
export function DashboardOverview() {
  const { profile } = useAuthStore();
  const isAdmin = profile?.role === 'admin';

  // Date selection
  const [selectedDate, setSelectedDate] = useState<DateOption>('today');
  const [customDate, setCustomDate] = useState('');

  // Summary
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [menuItemSales, setMenuItemSales] = useState<MenuItemSale[]>([]);
  const [loading, setLoading] = useState(true);

  // Cashier search
  const [cashierSearch, setCashierSearch] = useState('');
  const [cashierStats, setCashierStats] = useState<CashierStats | null>(null);
  const [cashierLoading, setCashierLoading] = useState(false);
  const [cashierError, setCashierError] = useState<string | null>(null);

  const { start, end, label } = getDayRange(selectedDate, customDate);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all orders (completed + voided) within the day
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .in('status', ['completed', 'voided'])
        .gte('created_at', start)
        .lte('created_at', end);

      if (ordersError) throw ordersError;

      let grossSale = 0;
      let netSale = 0;
      let tc = 0;
      let voidedCount = 0;
      let voidedAmount = 0;

      (orders || []).forEach(o => {
        const amt = Number(o.total_amount);
        grossSale += amt;
        if (o.status === 'completed') { netSale += amt; tc++; }
        if (o.status === 'voided') { voidedCount++; voidedAmount += amt; }
      });

      setSummary({ grossSale, netSale, tc, ac: tc > 0 ? netSale / tc : 0, voidedCount, voidedAmount });

      // 2. Menu Item Sales — join via order_items → products
      if (orders && orders.length > 0) {
        const orderIds = orders.filter(o => o.status === 'completed').map(o => o.id);
        if (orderIds.length > 0) {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('quantity, subtotal, product_id, products(name)')
            .in('order_id', orderIds);

          if (!itemsError && items) {
            const map: Record<string, MenuItemSale> = {};
            items.forEach((it: any) => {
              const pid = it.product_id;
              const name = it.products?.name || 'Unknown';
              if (!map[pid]) map[pid] = { product_id: pid, name, qty: 0, revenue: 0 };
              map[pid].qty += Number(it.quantity);
              map[pid].revenue += Number(it.subtotal);
            });
            setMenuItemSales(Object.values(map).sort((a, b) => b.qty - a.qty));
          }
        } else {
          setMenuItemSales([]);
        }
      } else {
        setMenuItemSales([]);
      }

      // 3. Low stock
      const { data: inventory } = await supabase.from('inventory_items').select('*');
      if (inventory) {
        setLowStockItems(inventory.filter((i: any) => Number(i.quantity) <= Number(i.low_stock_threshold)));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Cashier search handler
  const handleCashierSearch = async () => {
    const q = cashierSearch.trim();
    if (!q) return;
    setCashierLoading(true);
    setCashierError(null);
    setCashierStats(null);

    try {
      // Helper: given a profile id, fetch their order stats for the selected period
      const fetchStats = async (profileId: string, profileName: string) => {
        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount, status')
          .eq('staff_id', profileId)
          .in('status', ['completed', 'voided'])
          .gte('created_at', start)
          .lte('created_at', end);

        let netSale = 0, grossSale = 0, tc = 0;
        (orders || []).forEach((o: any) => {
          const amt = Number(o.total_amount);
          grossSale += amt;
          if (o.status === 'completed') { netSale += amt; tc++; }
        });
        setCashierStats({ id: profileId, name: profileName, grossSale, netSale, tc, ac: tc > 0 ? netSale / tc : 0 });
      };

      // 1. staff_code exact match (e.g. "CSH-001") — primary / most user-friendly
      const staffCodeRegex = /^CSH-\d+$/i;
      if (staffCodeRegex.test(q)) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, staff_code')
          .ilike('staff_code', q)
          .single();

        if (error || !data) throw new Error(`No cashier found with code "${q.toUpperCase()}".`);
        await fetchStats(data.id, `${data.full_name} (${data.staff_code})`);
        return;
      }

      // 2. Full UUID exact match
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(q)) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, staff_code')
          .eq('id', q)
          .single();

        if (error || !data) throw new Error('No cashier found with that ID.');
        await fetchStats(data.id, `${data.full_name} (${data.staff_code ?? data.id.slice(0, 8)})`);
        return;
      }

      // 3. Search by full_name (case-insensitive)
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, staff_code')
        .ilike('full_name', `%${q}%`)
        .limit(1)
        .single();

      if (error || !data) throw new Error('No cashier found with that name.');
      await fetchStats(data.id, `${data.full_name} (${data.staff_code ?? ''})`);

    } catch (err: any) {
      setCashierError(err.message);
    } finally {
      setCashierLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-5 bg-slate-50 min-h-full">
      {/* Header + Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sales Report</h2>
          <p className="text-sm text-slate-500 mt-0.5">Viewing data for: <span className="font-semibold text-slate-700">{label}</span></p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DATE_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedDate(opt.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border',
                selectedDate === opt.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              )}
            >
              <CalendarDays className="inline h-3 w-3 mr-1 -mt-0.5" />
              {opt.label}
            </button>
          ))}
          {selectedDate === 'custom' && (
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              className="border border-slate-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Gross Sale"
              value={`$${summary?.grossSale.toFixed(2) ?? '0.00'}`}
              sub="All orders (incl. voided)"
              icon={<DollarSign className="h-4 w-4" />}
              color="slate"
            />
            <KPICard
              title="Net Sale"
              value={`$${summary?.netSale.toFixed(2) ?? '0.00'}`}
              sub="Completed orders only"
              icon={<TrendingUp className="h-4 w-4" />}
              color="emerald"
            />
            <KPICard
              title="TC"
              value={String(summary?.tc ?? 0)}
              sub="Transaction Count"
              icon={<ShoppingBag className="h-4 w-4" />}
              color="blue"
            />
            <KPICard
              title="AC"
              value={`$${summary?.ac.toFixed(2) ?? '0.00'}`}
              sub="Average Check"
              icon={<ReceiptText className="h-4 w-4" />}
              color="violet"
            />
          </div>

          {/* Voided Summary */}
          {(summary?.voidedCount ?? 0) > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-red-700">
                <strong>{summary!.voidedCount}</strong> voided bill(s) worth <strong>${summary!.voidedAmount.toFixed(2)}</strong> excluded from Net Sale
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Item Sales */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-slate-900 flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-slate-500" />
                  Menu Item Sales
                </CardTitle>
              </CardHeader>
              <CardContent>
                {menuItemSales.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <ShoppingBag className="h-10 w-10 mx-auto opacity-20 mb-2" />
                    <p className="text-sm">No sales data for this period.</p>
                  </div>
                ) : (
                  <>
                    {/* Bar chart for top 5 */}
                    <div className="h-40 mb-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={menuItemSales.slice(0, 5)}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                          <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `${v}`} />
                          <Tooltip
                            formatter={(val: any) => [`${val} sold`, 'Qty']}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                          />
                          <Bar dataKey="qty" fill="#0f172a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-500 border-b">
                            <th className="text-left py-2 font-medium">Item</th>
                            <th className="text-right py-2 font-medium">Qty Sold</th>
                            <th className="text-right py-2 font-medium">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {menuItemSales.map((item, i) => (
                            <tr key={item.product_id} className="hover:bg-slate-50/50">
                              <td className="py-2 text-slate-800 flex items-center gap-2">
                                <span className="text-xs text-slate-400 w-5">{i + 1}</span>
                                {item.name}
                              </td>
                              <td className="py-2 text-right font-semibold text-slate-900">{item.qty}</td>
                              <td className="py-2 text-right text-emerald-600 font-semibold">${item.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Right column: low stock + cashier search */}
            <div className="space-y-4">
              {/* Cashier Search — admin only */}
              {isAdmin && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-slate-900 flex items-center gap-2">
                      <Users className="h-5 w-5 text-slate-500" />
                      Cashier Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search by name or ID…"
                        value={cashierSearch}
                        onChange={e => { setCashierSearch(e.target.value); setCashierStats(null); setCashierError(null); }}
                        onKeyDown={e => e.key === 'Enter' && handleCashierSearch()}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
                      />
                      <button
                        onClick={handleCashierSearch}
                        disabled={cashierLoading}
                        className="px-3 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
                      >
                        {cashierLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </button>
                    </div>

                    {cashierError && (
                      <p className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">{cashierError}</p>
                    )}

                    {cashierStats && (
                      <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-slate-900 text-sm">{cashierStats.name}</p>
                          <Badge variant="secondary" className="text-[10px] font-mono">{cashierStats.id.slice(0, 8)}</Badge>
                        </div>
                        <StatRow label="Gross Sale" value={`$${cashierStats.grossSale.toFixed(2)}`} />
                        <StatRow label="Net Sale" value={`$${cashierStats.netSale.toFixed(2)}`} highlight />
                        <StatRow label="TC" value={String(cashierStats.tc)} />
                        <StatRow label="AC" value={`$${cashierStats.ac.toFixed(2)}`} />
                      </div>
                    )}

                    {!cashierStats && !cashierError && (
                      <p className="text-xs text-slate-400 text-center py-4">Enter a cashier's name or ID to view their stats for the selected date.</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Low Stock Alerts */}
              <Card className={lowStockItems.length > 0 ? 'border-amber-200' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-slate-900 flex items-center gap-2">
                    <AlertTriangle className={cn("h-5 w-5", lowStockItems.length > 0 ? 'text-amber-500' : 'text-slate-400')} />
                    Low Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lowStockItems.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-600">
                      <ArrowUpRight className="h-4 w-4" />
                      All stock levels are healthy.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lowStockItems.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-400">Min: {item.low_stock_threshold}{item.unit}</p>
                          </div>
                          <Badge variant="destructive" className="font-mono text-xs">
                            {Number(item.quantity).toFixed(1)}{item.unit}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Sub components ────────────────────────────────────────────────────────

function KPICard({ title, value, sub, icon, color }: {
  title: string; value: string; sub: string; icon: React.ReactNode;
  color: 'slate' | 'emerald' | 'blue' | 'violet';
}) {
  const colors = {
    slate: 'bg-slate-900 text-white',
    emerald: 'bg-emerald-500 text-white',
    blue: 'bg-blue-600 text-white',
    violet: 'bg-violet-600 text-white',
  };
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className={cn('px-5 py-4 flex items-center justify-between', colors[color])}>
          <p className="text-sm font-semibold opacity-90">{title}</p>
          <span className="opacity-80">{icon}</span>
        </div>
        <div className="px-5 py-3">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500">{label}</span>
      <span className={cn('font-semibold', highlight ? 'text-emerald-600' : 'text-slate-900')}>{value}</span>
    </div>
  );
}
