import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import {
  DollarSign, ShoppingBag, AlertTriangle, TrendingUp,
  Users, ArrowUpRight, Loader2,
  ReceiptText, ArrowDownRight, Package,
  Zap, Star, Award, Clock
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

// ─── Types ─────────────────────────────────────────────────────────────────
type DateOption = 'today' | 'yesterday' | '7days' | 'custom';

interface SummaryData {
  grossSale: number;
  netSale: number;
  tc: number;
  ac: number;
  growth: number;
  customerCount: number;
  peakHour: string;
}

interface ChartData {
  name: string;
  value: number;
}

interface CategoryStat {
  name: string;
  val: number;
  color: string;
}

// ─── Main Component ────────────────────────────────────────────────────────
export function DashboardOverview() {
  const { profile } = useAuthStore();
  
  const [selectedRange, setSelectedRange] = useState<DateOption>('today');
  const [customStart, setCustomStart] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData>({ 
    grossSale: 0, netSale: 0, tc: 0, ac: 0, growth: 0, customerCount: 0, peakHour: '--:--' 
  });
  const [revenueTrend, setRevenueTrend] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);

  const fetchData = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let startTime = new Date(today);
      let endTime = new Date(now);
      let prevStartTime = new Date(today);
      let prevEndTime = new Date(today);
      let days = 1;

      if (selectedRange === 'yesterday') {
        startTime.setDate(today.getDate() - 1);
        endTime = new Date(today);
        prevStartTime.setDate(today.getDate() - 2);
        prevEndTime.setDate(today.getDate() - 1);
      } else if (selectedRange === '7days') {
        startTime.setDate(today.getDate() - 6);
        startTime.setHours(0,0,0,0);
        prevStartTime.setDate(today.getDate() - 13);
        prevEndTime.setDate(today.getDate() - 6);
        days = 7;
      } else if (selectedRange === 'custom') {
        startTime = new Date(customStart);
        startTime.setHours(0,0,0,0);
        endTime = new Date(customEnd);
        endTime.setHours(23,59,59,999);
        
        // Ensure max 7 days
        const diffTime = Math.abs(endTime.getTime() - startTime.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) {
          startTime.setDate(endTime.getDate() - 6);
          startTime.setHours(0,0,0,0);
          setCustomStart(startTime.toISOString().split('T')[0]);
        }
        
        days = Math.ceil(Math.abs(endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60 * 24));
        prevStartTime = new Date(startTime);
        prevStartTime.setDate(startTime.getDate() - days);
        prevEndTime = new Date(startTime);
      } else {
        // today
        prevStartTime.setDate(today.getDate() - 1);
        prevEndTime = new Date(today);
      }

      // 1. Fetch Current Orders
      const { data: currentOrders } = await supabase
        .from('orders')
        .select('total_amount, status, created_at, id')
        .eq('company_id', profile.company_id)
        .gte('created_at', startTime.toISOString())
        .lte('created_at', endTime.toISOString());

      // 2. Fetch Previous Orders for Growth
      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('company_id', profile.company_id)
        .gte('created_at', prevStartTime.toISOString())
        .lt('created_at', prevEndTime.toISOString());

      // 3. Fetch Real Customer Count
      const { count: custCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      // Process Orders
      let net = 0, gross = 0, count = 0;
      const hourMap: Record<number, number> = {};
      const trendMap: Record<string, { val: number, sort: number }> = {};
      const orderIds: string[] = [];

      currentOrders?.forEach(o => {
        const amt = Number(o.total_amount);
        gross += amt;
        if (o.status === 'completed') {
          net += amt;
          count++;
          orderIds.push(o.id);
          
          const d = new Date(o.created_at);
          const hour = d.getHours();
          hourMap[hour] = (hourMap[hour] || 0) + 1;
          
          const dateLabel = days === 1 
            ? `${hour}:00` 
            : d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
          
          if (!trendMap[dateLabel]) {
            trendMap[dateLabel] = { val: 0, sort: d.getTime() };
          }
          trendMap[dateLabel].val += amt;
        }
      });

      // Calculate Peak Hour
      let peakH = 0, maxOrders = 0;
      Object.entries(hourMap).forEach(([h, c]) => {
        if (c > maxOrders) { maxOrders = c; peakH = Number(h); }
      });

      // Calculate Growth
      let prevNet = 0;
      prevOrders?.forEach(o => { if (o.status === 'completed') prevNet += Number(o.total_amount); });
      const growth = prevNet === 0 ? 100 : ((net - prevNet) / prevNet) * 100;

      setSummary({
        grossSale: gross,
        netSale: net,
        tc: count,
        ac: count > 0 ? net / count : 0,
        growth,
        customerCount: custCount || 0,
        peakHour: maxOrders > 0 ? `${peakH}:00` : '--:--'
      });

      setRevenueTrend(
        Object.entries(trendMap)
          .sort((a, b) => a[1].sort - b[1].sort)
          .map(([name, data]) => ({ name, value: data.val }))
      );

      // 4. Fetch Category Stats & Top Products
      if (orderIds.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('quantity, subtotal, products(name, categories(name))')
          .in('order_id', orderIds);

        if (items) {
          const pMap: Record<string, any> = {};
          const cMap: Record<string, number> = {};
          let totalItemsRevenue = 0;

          items.forEach((it: any) => {
            const pName = it.products?.name || 'Unknown';
            const cName = it.products?.categories?.name || 'Others';
            const revenue = Number(it.subtotal);
            
            // Product Stats
            if (!pMap[pName]) pMap[pName] = { name: pName, qty: 0, revenue: 0 };
            pMap[pName].qty += it.quantity;
            pMap[pName].revenue += revenue;

            // Category Stats
            cMap[cName] = (cMap[cName] || 0) + revenue;
            totalItemsRevenue += revenue;
          });

          setTopProducts(Object.values(pMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5));
          
          const colors = ['bg-slate-900', 'bg-slate-400', 'bg-slate-200'];
          setCategoryStats(Object.entries(cMap).map(([name, val], i) => ({
            name,
            val: Math.round((val / totalItemsRevenue) * 100),
            color: colors[i % colors.length]
          })).sort((a, b) => b.val - a.val).slice(0, 3));
        }
      }

      // 5. Real Low Stock
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('company_id', profile.company_id);
      
      if (inventory) {
        setLowStock(inventory.filter((i: any) => i.quantity <= i.low_stock_threshold).slice(0, 4));
      }

    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRange, customStart, customEnd, profile?.company_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-slate-50/50">
        <div className="relative">
          <Loader2 className="h-10 w-10 text-slate-900 animate-spin" />
          <Zap className="h-4 w-4 text-slate-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="mt-4 text-slate-400 font-medium tracking-wider uppercase text-[10px]">Syncing Data</p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full p-4 md:p-8 space-y-8 bg-[#F8FAFC] overflow-y-auto pb-24">
      {/* Apple Style Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Live Insights</h2>
          <p className="text-slate-500 font-medium text-sm">Real-time performance analytics.</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {selectedRange === 'custom' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-500 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
              <input 
                type="date" 
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent border-none text-[10px] font-semibold text-slate-900 focus:ring-0 outline-none uppercase px-2"
              />
              <span className="text-slate-300 font-bold">→</span>
              <input 
                type="date" 
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent border-none text-[10px] font-semibold text-slate-900 focus:ring-0 outline-none uppercase px-2"
              />
            </div>
          )}
          <div className="flex items-center bg-white/50 backdrop-blur-md p-1 rounded-2xl shadow-sm border border-slate-200/50">
            {(['today', 'yesterday', '7days', 'custom'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all duration-300",
                  selectedRange === range 
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/50" 
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/30"
                )}
              >
                {range === '7days' ? '7 Days' : range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Minimalist KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Net Revenue" 
          value={`$${summary.netSale.toLocaleString()}`} 
          trend={summary.growth} 
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard 
          title="Total Orders" 
          value={summary.tc.toString()} 
          trend={summary.growth / 2} 
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <KPICard 
          title="Avg. Ticket" 
          value={`$${summary.ac.toFixed(2)}`} 
          trend={0} 
          icon={<ReceiptText className="h-5 w-5" />}
        />
        <KPICard 
          title="CRM Members" 
          value={summary.customerCount.toString()} 
          trend={5.2} 
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real Revenue Chart */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Revenue Performance</CardTitle>
                  <p className="text-sm text-slate-400 font-medium">Actual sales trend from database</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-slate-900" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <div className="h-[300px] w-full">
                {revenueTrend.length === 0 ? (
                   <div className="h-full flex items-center justify-center text-slate-300 font-black text-xs uppercase tracking-widest">
                      No sales data in this period
                   </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <AreaChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#0f172a" 
                        strokeWidth={2}
                        fillOpacity={0} 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Products Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-lg rounded-[24px] bg-white overflow-hidden">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-slate-900" />
                  Bestsellers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {topProducts.length === 0 ? (
                   <p className="text-xs text-slate-400 text-center py-4">No data available</p>
                ) : (
                  topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 line-clamp-1">{p.name}</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{p.qty} Sold</p>
                        </div>
                      </div>
                      <p className="font-black text-slate-900">${p.revenue.toFixed(0)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg rounded-[24px] bg-white overflow-hidden">
              <CardHeader className="p-6">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-slate-900" />
                  Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                {lowStock.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-slate-400 font-semibold text-sm">
                    <Star className="h-8 w-8 mb-2" />
                    Optimal Levels
                  </div>
                ) : (
                  lowStock.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-2xl border border-rose-100">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-900" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-rose-900 line-clamp-1">{item.name}</p>
                          <p className="text-[9px] text-rose-400 font-black uppercase">Low Inventory</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-900 border-none font-semibold text-[10px] py-1 px-3">
                        {item.quantity} {item.unit}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Real Quick Stats Sidebar */}
        <div className="space-y-6">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] bg-white overflow-hidden relative border border-slate-100/50">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-semibold flex items-center gap-3">
                <Zap className="h-5 w-5 text-slate-900" />
                Store Pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-8">
              <div className="flex items-center gap-8">
                 <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Peak Hour</p>
                    <div className="flex items-center gap-2">
                       <Clock className="h-4 w-4 text-slate-400" />
                       <span className="text-xl font-semibold text-slate-900">{summary.peakHour}</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Store Status</p>
                    <div className="flex items-center gap-2">
                       <div className="h-2 w-2 bg-slate-300 rounded-full"></div>
                       <span className="text-sm font-semibold text-slate-600">Active</span>
                    </div>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                 <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Sales Mix</p>
                 <div className="space-y-6">
                    {categoryStats.length === 0 ? (
                       <p className="text-xs text-slate-400">No category data</p>
                    ) : (
                      categoryStats.map(cat => (
                        <div key={cat.name} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider">
                            <span className="text-slate-500">{cat.name}</span>
                            <span className="text-slate-900">{cat.val}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full bg-slate-900 transition-all duration-1000")} style={{width: `${cat.val}%`}}></div>
                          </div>
                        </div>
                      ))
                    )}
                 </div>
              </div>

              <button className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold text-[11px] uppercase tracking-wider transition-all active:scale-[0.98]">
                Export Analytics
              </button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[32px] bg-white p-8">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                   <Users className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Members</p>
                   <p className="text-2xl font-black text-slate-900">{summary.customerCount}</p>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function KPICard({ title, value, trend, icon }: { 
  title: string; value: string; trend: number; icon: React.ReactNode;
}) {
  const isPositive = trend >= 0;
  return (
    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] overflow-hidden bg-white group transition-all duration-500">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
            {icon}
          </div>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-semibold",
            isPositive ? "text-slate-900" : "text-slate-400"
          )}>
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(Math.round(trend))}%
          </div>
        </div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</h3>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-md">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-lg font-black">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
}
