
import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Activity, 
  Download, 
  Search, 
  Filter, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  User,
  Clock,
  Shield,
  Briefcase,
  Layers,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { formatCurrency } from '../utils';

type ReportTab = 'ledger' | 'activity';

const ReportsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('ledger');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Master Ledger Data (Financial Movements)
  const ledgerEntries = useMemo(() => [
    { id: 'L1', date: '2025-01-14', time: '14:22', account: 'Chase Business', type: 'Transfer', desc: 'Bank deposit from Petty Cash', amount: 450000, user: 'Admin', status: 'Verified' },
    { id: 'L2', date: '2025-01-14', time: '12:05', account: 'Main Till', type: 'Income', desc: 'Daily Shift Closure #442', amount: 89450, user: 'Manager', status: 'Verified' },
    { id: 'L3', date: '2025-01-13', time: '17:45', account: 'UberEats Receivable', type: 'Settlement', desc: 'Partner Payout Reconciled', amount: 125000, user: 'Admin', status: 'Pending' },
    { id: 'L4', date: '2025-01-13', time: '10:30', account: 'Main Till', type: 'Expense', desc: 'Staff Meal Allowance', amount: -4500, user: 'Manager', status: 'Verified' },
    { id: 'L5', date: '2025-01-12', time: '16:20', account: 'Terminal Receivable', type: 'Income', desc: 'Card Sales Batch #99', amount: 245000, user: 'System', status: 'Verified' },
    { id: 'L6', date: '2025-01-12', time: '09:00', account: 'Chase Business', type: 'Expense', desc: 'Monthly Rent Payment', amount: -1500000, user: 'Admin', status: 'Verified' },
  ], []);

  // Mock Activity Log Data (System Events)
  const activityLogs = useMemo(() => [
    { id: 'A1', time: '15:10', user: 'Admin', action: 'Account Created', category: 'Security', detail: 'Created new Asset Account: "Emergency Fund"' },
    { id: 'A2', time: '14:22', user: 'Admin', action: 'Transfer Executed', category: 'Financial', detail: 'Moved $4,500.00 from Main Till to Chase Business' },
    { id: 'A3', time: '13:05', user: 'Manager', action: 'Shift Opened', category: 'Ops', detail: 'Started Daily Shift for 2025-01-14' },
    { id: 'A4', time: '11:50', user: 'Admin', action: 'Staff Added', category: 'HR', detail: 'Registered new employee: "Sarah Connor"' },
    { id: 'A5', time: '09:15', user: 'Manager', action: 'Login Success', category: 'Security', detail: 'Manager session initiated from Terminal 01' },
    { id: 'A6', time: 'Yesterday', user: 'System', action: 'Auto-Settlement', category: 'Financial', detail: 'UberEats daily batch successfully matched' },
  ], []);

  const filteredLedger = ledgerEntries.filter(e => 
    e.desc.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.account.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActivity = activityLogs.filter(a => 
    a.detail.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEntryIcon = (type: string) => {
    switch(type) {
      case 'Income': return <ArrowDownLeft size={16} className="text-emerald-400" />;
      case 'Expense': return <ArrowUpRight size={16} className="text-rose-400" />;
      case 'Transfer': return <ArrowRightLeft size={16} className="text-indigo-400" />;
      default: return <FileText size={16} className="text-slate-400" />;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
      case 'Security': return <Shield size={16} className="text-rose-400" />;
      case 'HR': return <Briefcase size={16} className="text-amber-400" />;
      case 'Financial': return <Layers size={16} className="text-indigo-400" />;
      default: return <Activity size={16} className="text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      {/* View Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-wrap gap-2 p-1.5 glass rounded-3xl w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileText size={16} /> Master Ledger
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'activity' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Activity size={16} /> Activity Log
          </button>
        </div>

        <button className="w-full md:w-auto flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-3.5 rounded-2xl transition-all uppercase text-[10px] tracking-widest border border-slate-700/50">
          <Download size={18} /> Export Current View
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass p-6 rounded-[2.5rem] flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab === 'ledger' ? 'transactions' : 'system events'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-6 py-3.5 font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-white">
             <Calendar size={16} /> Jan 2025 <ChevronDown size={14} />
           </button>
           <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-white">
             <Filter size={16} /> Filters
           </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass rounded-[3rem] overflow-hidden border-indigo-500/10 shadow-2xl">
        {activeTab === 'ledger' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/80 backdrop-blur-xl">
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Entry Detail</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Target Account</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Type</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 bg-slate-900/20">
                {filteredLedger.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors group cursor-pointer">
                    <td className="px-8 py-6">
                       <div className="space-y-1">
                          <p className="text-sm font-black text-white">{entry.desc}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                             <Clock size={12} /> {entry.date} at {entry.time}
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 px-3 py-1.5 rounded-lg border border-slate-700/50">
                         {entry.account}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          {getEntryIcon(entry.type)}
                          <span className="text-xs font-black uppercase tracking-widest text-slate-300">{entry.type}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className={`text-lg font-black ${entry.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                         {formatCurrency(Math.abs(entry.amount))}
                       </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-indigo-400">{entry.user}</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{entry.status}</span>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 space-y-6">
             {filteredActivity.map((log, idx) => (
               <div key={log.id} className="relative flex gap-8 group">
                  {/* Timeline Line */}
                  {idx !== filteredActivity.length - 1 && (
                    <div className="absolute left-6 top-10 bottom-0 w-px bg-slate-800 group-hover:bg-indigo-500/30 transition-colors"></div>
                  )}
                  
                  {/* Icon */}
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg group-hover:border-indigo-500/50 transition-all">
                     {getCategoryIcon(log.category)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-10">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                           <h4 className="text-lg font-black text-white">{log.action}</h4>
                           <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-800 text-slate-500 rounded border border-slate-700/50">{log.category}</span>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{log.time}</span>
                     </div>
                     <p className="text-slate-400 text-sm font-medium leading-relaxed">{log.detail}</p>
                     <div className="mt-3 flex items-center gap-2">
                        <User size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{log.user}</span>
                     </div>
                  </div>

                  <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-600 hover:text-white transition-all">
                    <MoreVertical size={18} />
                  </button>
               </div>
             ))}
          </div>
        )}

        {/* Empty States */}
        {((activeTab === 'ledger' && filteredLedger.length === 0) || (activeTab === 'activity' && filteredActivity.length === 0)) && (
          <div className="py-32 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto text-slate-700">
               {activeTab === 'ledger' ? <Layers size={32} /> : <Activity size={32} />}
             </div>
             <div>
               <p className="text-white font-black text-xl">No results found</p>
               <p className="text-slate-500 font-bold">Try adjusting your filters or search query.</p>
             </div>
          </div>
        )}
      </div>

      {/* Audit Insight Card */}
      <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] flex items-start gap-6">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
          <Shield size={28} />
        </div>
        <div>
          <h4 className="text-xl font-black text-white mb-2">Immutable Audit Trail</h4>
          <p className="text-slate-400 font-medium leading-relaxed">
            The Mozzarella Ledger utilizes absolute integer logic to prevent precision errors. Every entry shown here is cross-referenced with the Master Daily Ops database. Unauthorized deletions are strictly restricted at the database level.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
