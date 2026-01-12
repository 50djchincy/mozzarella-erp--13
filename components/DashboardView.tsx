
import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Scale,
  Wallet,
  ArrowRight,
  Info
} from 'lucide-react';
import { formatCurrency } from '../utils';
import { Account, AccountType } from '../types';

type Period = 'today' | 'week' | 'month' | 'custom';

interface Props {
  accounts?: Account[];
}

const DashboardView: React.FC<Props> = ({ accounts = [] }) => {
  const [period, setPeriod] = useState<Period>('week');

  // Real Financial Data from Accounts
  // Note: For P&L (Revenue/Expenses), we would need a transactions list.
  // For now, we default these to 0 until transaction history is implemented.
  const financialData = useMemo(() => {
    return {
      revenue: 0,
      expenses: 0,
      income: 0,
      prevRevenue: 0
    };
  }, [period]);

  const liabilities = useMemo(() => {
    return accounts
      .filter(a => a.type === AccountType.PAYABLE)
      .reduce((sum, a) => sum + a.currentBalance, 0);
  }, [accounts]);

  const receivables = useMemo(() => {
    return accounts
      .filter(a => a.type === AccountType.RECEIVABLE)
      .reduce((sum, a) => sum + a.currentBalance, 0);
  }, [accounts]);

  const profit = financialData.revenue - financialData.expenses;
  const profitMargin = financialData.revenue > 0 ? ((profit / financialData.revenue) * 100).toFixed(1) : '0';
  const revenueGrowth = financialData.prevRevenue > 0 ? (((financialData.revenue - financialData.prevRevenue) / financialData.prevRevenue) * 100).toFixed(1) : '0';

  const costSplit = [
    { label: 'Ingredients & Goods', value: 0, cents: 0, color: 'bg-emerald-500' },
    { label: 'Staff Hub (Salary/SC)', value: 0, cents: 0, color: 'bg-indigo-500' },
    { label: 'Operational (Rent/Utils)', value: 0, cents: 0, color: 'bg-amber-500' },
    { label: 'Marketing', value: 0, cents: 0, color: 'bg-rose-500' },
  ];

  const salesVsIncomePoints = [
    { day: 'Mon', sales: 0, income: 0 },
    { day: 'Tue', sales: 0, income: 0 },
    { day: 'Wed', sales: 0, income: 0 },
    { day: 'Thu', sales: 0, income: 0 },
    { day: 'Fri', sales: 0, income: 0 },
    { day: 'Sat', sales: 0, income: 0 },
    { day: 'Sun', sales: 0, income: 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Dashboard Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">Executive Dashboard</h2>
          <p className="text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Real-time Financial Intel</p>
        </div>

        <div className="flex items-center gap-2 p-1.5 glass rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['today', 'week', 'month', 'custom'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${period === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Main Stats Row: P&L Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-[2.5rem] p-10 bg-indigo-600/5 border-indigo-500/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg">Profit & Loss Center</span>
                <h3 className="text-5xl font-black text-white tracking-tighter">{formatCurrency(profit)}</h3>
                <p className="text-slate-400 font-bold text-sm">Net Profit for the current {period}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xl">
                  <TrendingUp size={24} /> {profitMargin}%
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Net Margin</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-slate-800/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                  <ArrowDownRight size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Sales</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(financialData.revenue)}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-400">
                  <ArrowUpRight size={28} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Expenses</p>
                  <p className="text-2xl font-black text-white">{formatCurrency(financialData.expenses)}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px]"></div>
        </div>

        <div className="glass rounded-[2.5rem] p-10 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Performance Delta</span>
            <h4 className="text-3xl font-black text-white">Net Sales Comparison</h4>
          </div>

          <div className="py-8">
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${parseFloat(revenueGrowth) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {parseFloat(revenueGrowth) > 0 ? '+' : ''}{revenueGrowth}%
              </span>
              <span className="text-slate-500 font-bold text-sm">vs prev. {period}</span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${parseFloat(revenueGrowth) >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, Math.abs(parseFloat(revenueGrowth)))}%` }}
              ></div>
            </div>
          </div>

          <button className="w-full bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
            Download Detailed Comparison <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Secondary Row: Sales vs Income & Cost Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-[2.5rem] p-10 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-white">Sales vs. Income</h3>
              <p className="text-xs font-bold text-slate-500">Comparison of POS output vs. actual cash collected.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actual Income</span>
              </div>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-4 px-2 h-64">
            {salesVsIncomePoints.map((pt, i) => (
              <div key={i} className="flex-1 flex items-end gap-1.5 h-full group">
                <div className="flex-1 flex flex-col justify-end gap-1 h-full">
                  <div className="relative flex flex-col items-center group/bar1" style={{ height: `${(pt.sales / 1000) * 100}%` }}>
                    <div className="absolute -top-8 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover/bar1:opacity-100 transition-opacity whitespace-nowrap z-20">${pt.sales}k</div>
                    <div className="w-full bg-indigo-500/20 group-hover:bg-indigo-500/40 rounded-t-lg transition-all h-full"></div>
                  </div>
                  <div className="relative flex flex-col items-center group/bar2" style={{ height: `${(pt.income / 1000) * 100}%` }}>
                    <div className="absolute -top-8 bg-emerald-600 text-white text-[9px] font-black px-2 py-1 rounded opacity-0 group-hover/bar2:opacity-100 transition-opacity whitespace-nowrap z-20">${pt.income}k</div>
                    <div className="w-full bg-emerald-500 rounded-t-lg transition-all h-full"></div>
                  </div>
                </div>
                <p className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-[10px] font-black text-slate-600 uppercase tracking-tighter">{pt.day}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 h-px bg-slate-800"></div>
        </div>

        <div className="glass rounded-[2.5rem] p-10 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-white">Cost Split</h3>
            <PieChartIcon className="text-slate-500" />
          </div>

          <div className="space-y-6">
            {costSplit.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{item.label}</span>
                  <span className="text-xs font-black text-white">{formatCurrency(item.cents)}</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  <div
                    className={`${item.color} h-full transition-all duration-1000 delay-${idx * 100}`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-950/50 rounded-3xl border border-slate-800 space-y-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Info size={14} /> Insight</p>
            <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
              Data will appear here once you start categorizing expenses.
            </p>
          </div>
        </div>
      </div>

      {/* Tertiary Row: Liquidity & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass rounded-[2.5rem] p-10 border-l-4 border-rose-500 space-y-6">
          <div className="flex items-center gap-3 text-rose-400">
            <Scale size={24} />
            <h4 className="text-xl font-black text-white">Total Liabilities</h4>
          </div>
          <div className="space-y-1">
            <h5 className="text-4xl font-black text-white tracking-tighter">{formatCurrency(liabilities)}</h5>
            <p className="text-xs font-bold text-slate-500">Payables (Calculated from Accounts)</p>
          </div>
          <div className="pt-6 border-t border-slate-800">
            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors flex items-center gap-2">Manage Settlement Hub <ArrowRight size={14} /></button>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-10 border-l-4 border-indigo-500 space-y-6">
          <div className="flex items-center gap-3 text-indigo-400">
            <Wallet size={24} />
            <h4 className="text-xl font-black text-white">Total Receivables</h4>
          </div>
          <div className="space-y-1">
            <h5 className="text-4xl font-black text-white tracking-tighter">{formatCurrency(receivables)}</h5>
            <p className="text-xs font-bold text-slate-500">Receivables (Calculated from Accounts)</p>
          </div>
          <div className="pt-6 border-t border-slate-800">
            <button className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors flex items-center gap-2">Open Money Lab <ArrowRight size={14} /></button>
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-10 flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="text-xl font-black text-white mb-6">Expense Heatmap</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20">
                <p className="text-[8px] font-black uppercase tracking-widest text-rose-400 mb-1">Highest Leakage</p>
                <p className="text-sm font-black text-white">-</p>
              </div>
              <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 mb-1">Most Efficient</p>
                <p className="text-sm font-black text-white">-</p>
              </div>
            </div>
          </div>
          <BarChart3 size={120} className="absolute -bottom-6 -right-6 text-indigo-500/5 rotate-12" />
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
