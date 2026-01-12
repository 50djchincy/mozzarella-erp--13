
import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Truck,
  Users,
  Megaphone,
  Plus,
  Save,
  History as HistoryIcon,
  Settings2,
  Trash2,
  Calendar,
  Tag,
  User,
  Layers,
  Clock,
  CheckSquare,
  Square,
  Search,
  ChevronDown,
  X,
  AlertTriangle,
  Zap,
  Activity,
  RefreshCw
} from 'lucide-react';
import ExpenseEntryForm from './ExpenseEntryForm';
import QuickExpenses from './QuickExpenses';
import { ExpenseCategory, Vendor, ExpenseTransaction, Account, UserRole, AccountType, ExpenseTemplate } from '../types';
import { formatCurrency, toCents } from '../utils';

interface Props {
  role: UserRole;
  accounts: Account[];
  currentUser: { name: string; id: string };
  expenses: ExpenseTransaction[];
  categories: ExpenseCategory[];
  vendors: Vendor[];
  templates: ExpenseTemplate[];
  onSaveExpense: (expense: ExpenseTransaction) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onSaveCategory: (category: ExpenseCategory) => Promise<void>;
  onSaveVendor: (vendor: Vendor) => Promise<void>;
  onSaveAccount: (account: Account) => Promise<void>;
  onAddLedgerEntry: (entry: any) => Promise<void>;
  onSaveTemplate: (template: ExpenseTemplate) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
}

const defaultCategories: ExpenseCategory[] = [
  { id: 'ops', name: 'Operational', subcategories: ['Utility', 'Rent', 'Repairs'] },
  { id: 'goods', name: 'Ingredients and goods to be sold', subcategories: ['Vegetables', 'Meat', 'Dairy', 'Packaging'] },
  { id: 'staff', name: 'Staff', subcategories: ['Meals', 'Uniforms', 'Training'] },
  { id: 'marketing', name: 'Marketing', subcategories: ['Social Media', 'Flyers', 'Events'] },
];

const ExpensesView: React.FC<Props> = ({
  role,
  accounts,
  currentUser,
  expenses: remoteExpenses,
  categories: remoteCategories,
  vendors: remoteVendors,
  templates: remoteTemplates,
  onSaveExpense,
  onDeleteExpense,
  onSaveCategory,
  onSaveVendor,
  onSaveAccount,
  onAddLedgerEntry,
  onSaveTemplate,
  onDeleteTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'entry' | 'history' | 'categories' | 'vendors'>('quick');
  const isAdmin = role === UserRole.ADMIN;



  const categories = useMemo(() => {
    const merged = [...defaultCategories];
    (remoteCategories || []).forEach(remoteCat => {
      const index = merged.findIndex(c => c.id === remoteCat.id);
      if (index > -1) {
        merged[index] = remoteCat;
      } else {
        merged.push(remoteCat);
      }
    });
    return merged;
  }, [remoteCategories]);

  const vendors = remoteVendors;
  const transactions = remoteExpenses;
  const templates = remoteTemplates;

  const applyTemplate = (tmp: ExpenseTemplate) => {
    // This function is now mainly a pass-through or needed if we want to pre-fill the form 
    // when switching tabs programmatically. However, the QuickExpenses component handles the 
    // click and we pass this function to it. 
    // But wait, applyTemplate needs detailed form logic which is now inside ExpenseEntryForm.
    // We need to pass a way to set that form data.
    // Actually, simpler approach: The ExpenseEntryForm handles its own state. 
    // We need to refactor slightly: 
    // QuickExpenses emits an 'onApply' event. We need to switch tab to 'entry' AND 
    // pass the template data to ExpenseEntryForm.
    // So we'll add a state 'selectedTemplate' to ExpensesView and pass it down.
    setSelectedTemplate(tmp);
    setActiveTab('entry');
  };

  const [selectedTemplate, setSelectedTemplate] = useState<ExpenseTemplate | undefined>(undefined);

  const deleteTransaction = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense record? Note: This will not automatically reverse account balances.")) {
      await onDeleteExpense(id);
    }
  };

  const renderEntry = () => (
    <ExpenseEntryForm
      role={role}
      accounts={accounts}
      currentUser={currentUser}
      categories={categories}
      vendors={vendors}
      onSaveExpense={onSaveExpense}
      onSaveCategory={onSaveCategory}
      onSaveVendor={onSaveVendor}
      onSaveAccount={onSaveAccount}
      onAddLedgerEntry={onAddLedgerEntry}
      onSaveTemplate={onSaveTemplate}
      onSuccess={() => setActiveTab('history')}
      initialData={selectedTemplate ? {
        amount: (selectedTemplate.amount / 100).toString(),
        mainCategoryId: categories.find(c => c.name === selectedTemplate.mainCategory)?.id || 'ops',
        subcategory: selectedTemplate.subcategory,
        vendorId: selectedTemplate.vendorId,
        sourceAccountId: selectedTemplate.sourceAccountId,
        receivesStock: selectedTemplate.receivesStock,
        details: selectedTemplate.details
      } : undefined}
    />
  );

  const renderQuickExpenses = () => (
    <QuickExpenses
      templates={templates}
      onApply={applyTemplate}
      onDelete={onDeleteTemplate}
      isAdmin={role === UserRole.ADMIN}
    />
  );

  const renderHistory = () => (
    <div className="glass rounded-[2.5rem] overflow-hidden animate-in fade-in duration-500">
      <div className="p-8 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-2xl font-black text-white">Expense Ledger</h3>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input type="text" placeholder="Search..." className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs font-bold" />
          </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="p-24 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700">
            <ShoppingBag size={32} />
          </div>
          <p className="text-slate-500 font-bold">No transactions recorded in this session.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date / Cat</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Vendor & Details</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Source</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white">{tx.date}</span>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter truncate max-w-[120px]">{tx.mainCategory}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-slate-300">{tx.vendorName || 'No Vendor'}</span>
                      <span className="text-[10px] font-medium text-slate-500 truncate max-w-[200px]">{tx.details || 'No details'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${tx.isPendingPayable ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>
                      {accounts.find(a => a.id === tx.sourceAccountId)?.name || 'Payable'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-lg font-black text-white">{formatCurrency(tx.amount)}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderCategories = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass p-10 rounded-[3rem]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-indigo-600 rounded-3xl text-white">
            <Tag size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Expense Master Categories</h3>
            <p className="text-slate-500 text-sm font-medium">Manage top-level expense grouping for accurate reporting.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map(cat => (
            <div key={cat.id} className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-black text-white uppercase tracking-tight">{cat.name}</h4>
                <button className="text-slate-600 hover:text-white transition-colors"><Settings2 size={18} /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {cat.subcategories.map(sub => (
                  <span key={sub} className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400">{sub}</span>
                ))}
              </div>
            </div>
          ))}
          <button className="border-2 border-dashed border-slate-800 rounded-[2rem] flex items-center justify-center gap-3 text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-all py-10">
            <Plus size={24} /> Add Master Category
          </button>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-6 bg-amber-400/10 border border-amber-400/20 rounded-3xl flex items-start gap-4">
          <AlertTriangle className="text-amber-400 shrink-0" size={24} />
          <div>
            <h4 className="font-bold text-amber-400 mb-1 uppercase text-xs tracking-widest">Admin Privileges Only</h4>
            <p className="text-sm text-slate-400 italic">Master Category editing is restricted to administrators. Subcategories can still be added "on-the-fly" by any user during entry.</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderVendors = () => (
    <div className="glass p-10 rounded-[3rem] space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-600/10 text-emerald-400 rounded-3xl">
            <User size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white">Vendor Directory</h3>
            <p className="text-slate-500 text-sm font-medium">Whitelabel list of approved business suppliers.</p>
          </div>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
          <Plus size={18} /> New Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map(v => (
          <div key={v.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-[2rem] hover:border-emerald-500/30 transition-all flex items-center justify-between group">
            <div>
              <h4 className="text-lg font-black text-white">{v.name}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Partner</p>
            </div>
            <button className="p-2 text-slate-700 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
              <ChevronDown size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDiagnostics = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="glass p-10 rounded-[3rem] border-2 border-slate-800">
        <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
          <Activity size={24} className="text-indigo-400" /> System Diagnostics
        </h3>
        <p className="text-slate-400 mb-8 font-medium">Use these tools if you encounter permission errors when saving data.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">User Context</h4>
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-300 flex justify-between">
                <span>Display Name:</span> <span className="text-white">{currentUser.name}</span>
              </p>
              <p className="text-sm font-bold text-slate-300 flex justify-between">
                <span>UI Role:</span> <span className="text-indigo-400">{role}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={async () => {
                try {
                  const { db, auth } = await import('../firebase');
                  const { doc, setDoc } = await import('firebase/firestore');
                  if (!auth.currentUser) throw new Error("Not logged in");

                  await setDoc(doc(db, 'users', auth.currentUser.uid), {
                    name: auth.currentUser.displayName || currentUser.name,
                    role: role,
                    email: auth.currentUser.email,
                    lastSync: new Date().toISOString()
                  }, { merge: true });

                  alert("Profile synced successfully! Try saving templates again.");
                } catch (err: any) {
                  console.error("Manual sync failed:", err);
                  alert("Sync failed: " + err.message);
                }
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              <RefreshCw size={16} /> Fix My Firestore Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-4 p-1.5 glass rounded-2xl w-fit">
        <button onClick={() => setActiveTab('quick')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'quick' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Quick Expenses</button>
        <button onClick={() => setActiveTab('entry')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'entry' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>New Entry</button>
        <button onClick={() => setActiveTab('history')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>History</button>
        <button onClick={() => setActiveTab('categories')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Categories</button>
        <button onClick={() => setActiveTab('vendors')} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'vendors' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Vendors</button>
        <button onClick={() => setActiveTab('diag' as any)} className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'diag' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Diagnostics</button>
      </div>

      {activeTab === 'quick' && renderQuickExpenses()}
      {activeTab === 'entry' && renderEntry()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'categories' && renderCategories()}
      {activeTab === 'vendors' && renderVendors()}
      {activeTab === ('diag' as any) && renderDiagnostics()}
    </div>
  );
};

export default ExpensesView;
