
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
    remoteCategories.forEach(remoteCat => {
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

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    mainCategoryId: 'ops',
    subcategory: '',
    newSubcategory: '',
    vendorId: '',
    newVendorName: '',
    sourceAccountId: accounts.find(a => a.type === AccountType.PETTY_CASH)?.id || accounts[0]?.id || '',
    receivesStock: false,
    isRecurring: false,
    recurringFrequency: 'Monthly' as any,
    details: ''
  });

  const handleAddTransaction = async () => {
    if (!formData.amount) return;

    const mainCat = categories.find(c => c.id === formData.mainCategoryId);
    const sub = formData.newSubcategory || formData.subcategory;

    // On-the-fly subcategory addition
    if (formData.newSubcategory && mainCat) {
      const updatedCat = {
        ...mainCat,
        subcategories: [...new Set([...mainCat.subcategories, formData.newSubcategory])]
      };
      await onSaveCategory(updatedCat);
    }

    // On-the-fly vendor addition
    let finalVendorName = '';
    let finalVendorId = formData.vendorId;
    if (formData.newVendorName) {
      const newV: Vendor = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.newVendorName,
        payableBalance: 0
      };
      await onSaveVendor(newV);
      finalVendorId = newV.id;
      finalVendorName = newV.name;
    } else {
      finalVendorName = vendors.find(v => v.id === formData.vendorId)?.name || '';
    }

    const sourceAcc = accounts.find(a => a.id === formData.sourceAccountId);
    if (!sourceAcc) {
      alert("Please select a valid source of funds.");
      return;
    }

    const amountCents = toCents(formData.amount);
    const isPending = sourceAcc.type === AccountType.PAYABLE;

    const newTx: ExpenseTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: formData.date,
      amount: amountCents,
      mainCategory: mainCat?.name || '',
      subcategory: sub || '',
      vendorId: finalVendorId || '',
      vendorName: finalVendorName || '',
      sourceAccountId: formData.sourceAccountId,
      isPendingPayable: isPending,
      receivesStock: formData.receivesStock,
      isRecurring: formData.isRecurring,
      details: formData.details || '',
      user: currentUser.name
    };

    if (formData.isRecurring && formData.recurringFrequency) {
      newTx.recurringFrequency = formData.recurringFrequency;
    }

    try {
      // 1. Save Transaction
      console.log("Step 1: Saving transaction to Firestore...");
      await onSaveExpense(newTx);

      // 2. Update Account Balance
      console.log("Step 2: Updating account balance...");
      await onSaveAccount({
        ...sourceAcc,
        currentBalance: sourceAcc.currentBalance - amountCents
      });

      // 3. Create Ledger Entry
      console.log("Step 3: Creating ledger entry...");
      await onAddLedgerEntry({
        id: Math.random().toString(36).substr(2, 9),
        desc: `Expense: ${mainCat?.name}${sub ? ' - ' + sub : ''}${finalVendorName ? ' (' + finalVendorName + ')' : ''}`,
        account: sourceAcc.name,
        type: 'Expense',
        amount: amountCents,
        date: formData.date,
        time: new Date().toLocaleTimeString(),
        user: currentUser.name,
        status: 'Posted'
      });

      console.log("Success: Expense posted fully.");
      setActiveTab('history');

      // Reset form partially
      setFormData({
        ...formData,
        amount: '',
        newSubcategory: '',
        newVendorName: '',
        details: ''
      });
    } catch (error) {
      console.error("Critical error in handleAddTransaction:", error);
      alert(`Failed to post expense: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveTemplate = async () => {
    if (!formData.amount) {
      alert("Please enter an amount first.");
      return;
    }
    const name = window.prompt("Enter a name for this template (e.g., Office Rent, Daily Milk):");
    if (!name) return;

    const template: ExpenseTemplate = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      amount: toCents(formData.amount),
      mainCategory: categories.find(c => c.id === formData.mainCategoryId)?.name || '',
      subcategory: formData.newSubcategory || formData.subcategory || '',
      vendorId: formData.vendorId || '',
      vendorName: vendors.find(v => v.id === formData.vendorId)?.name || formData.newVendorName || '',
      sourceAccountId: formData.sourceAccountId,
      receivesStock: formData.receivesStock,
      details: formData.details || ''
    };

    console.log("Saving template payload:", template);

    try {
      await onSaveTemplate(template);
      console.log("Success: Template saved to Firestore.");
      alert("Template saved successfully!");
    } catch (error) {
      console.error("Error saving template to Firestore:", error);
      alert(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const applyTemplate = (tmp: ExpenseTemplate) => {
    const cat = categories.find(c => c.name === tmp.mainCategory);
    setFormData({
      ...formData,
      amount: (tmp.amount / 100).toString(),
      mainCategoryId: cat?.id || 'ops',
      subcategory: tmp.subcategory || '',
      newSubcategory: '',
      vendorId: tmp.vendorId || '',
      newVendorName: '',
      sourceAccountId: tmp.sourceAccountId,
      receivesStock: tmp.receivesStock,
      details: tmp.details
    });
    setActiveTab('entry');
  };

  const deleteTransaction = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this expense record? Note: This will not automatically reverse account balances.")) {
      await onDeleteExpense(id);
    }
  };

  const renderEntry = () => (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="glass p-10 rounded-[3rem] space-y-10 border-indigo-500/20">
        <div className="text-center space-y-2">
          <h3 className="text-3xl font-black text-white">Record New Expense</h3>
          <p className="text-slate-500 font-medium">Log your operational and inventory spend accurately.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Amount and Date */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Expense Amount</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-2xl">$</span>
              <input
                type="number"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-12 pr-8 py-6 text-3xl font-black text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Transaction Date</label>
            <div className="relative">
              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input
                type="date"
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-14 pr-8 py-6 text-xl font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Main Category</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, mainCategoryId: cat.id, subcategory: '', newSubcategory: '' })}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.mainCategoryId === cat.id
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                >
                  {cat.id === 'ops' && <Truck size={24} />}
                  {cat.id === 'goods' && <ShoppingBag size={24} />}
                  {cat.id === 'staff' && <Users size={24} />}
                  {cat.id === 'marketing' && <Megaphone size={24} />}
                  <span className="text-[9px] font-black uppercase text-center tracking-tight leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Subcategory</label>
            <div className="space-y-3">
              <select
                value={formData.subcategory}
                onChange={e => setFormData({ ...formData, subcategory: e.target.value, newSubcategory: '' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Existing Subcategory</option>
                {categories.find(c => c.id === formData.mainCategoryId)?.subcategories.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <div className="relative">
                <Tag className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={formData.newSubcategory}
                  onChange={e => setFormData({ ...formData, newSubcategory: e.target.value, subcategory: '' })}
                  placeholder="Or enter new subcategory..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Vendor */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Vendor (If applicable)</label>
            <div className="space-y-3">
              <select
                value={formData.vendorId}
                onChange={e => setFormData({ ...formData, vendorId: e.target.value, newVendorName: '' })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <div className="relative">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={formData.newVendorName}
                  onChange={e => setFormData({ ...formData, newVendorName: e.target.value, vendorId: '' })}
                  placeholder="Or create new vendor on the fly..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Source of Funds */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Source of Funds</label>
            <div className="relative">
              <Layers className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <select
                value={formData.sourceAccountId}
                onChange={e => setFormData({ ...formData, sourceAccountId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-6 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                ))}
                <option value="pending-payable">Pending (Payable)</option>
              </select>
            </div>
            {accounts.find(a => a.id === formData.sourceAccountId)?.type === 'Payable' && (
              <p className="text-[10px] font-bold text-amber-500 px-2 italic">Recorded as a liability (Pending payment).</p>
            )}
          </div>
        </div>

        {/* Checkboxes and Recurring */}
        <div className="space-y-8 pt-6 border-t border-slate-800/50">
          <div className="flex flex-wrap gap-8">
            <button
              onClick={() => setFormData({ ...formData, receivesStock: !formData.receivesStock })}
              className="flex items-center gap-3 group"
            >
              {formData.receivesStock ? <CheckSquare className="text-indigo-400" size={24} /> : <Square className="text-slate-700 group-hover:text-slate-500" size={24} />}
              <span className={`text-xs font-black uppercase tracking-widest ${formData.receivesStock ? 'text-white' : 'text-slate-500'}`}>Receives Stock</span>
            </button>

            <button
              onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
              className="flex items-center gap-3 group"
            >
              {formData.isRecurring ? <CheckSquare className="text-indigo-400" size={24} /> : <Square className="text-slate-700 group-hover:text-slate-500" size={24} />}
              <span className={`text-xs font-black uppercase tracking-widest ${formData.isRecurring ? 'text-white' : 'text-slate-500'}`}>Recurring Payment</span>
            </button>
          </div>

          {formData.isRecurring && (
            <div className="flex items-center gap-6 animate-in slide-in-from-left-4 duration-300">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                <Clock size={16} /> Frequency:
              </label>
              <div className="flex gap-2">
                {['Daily', 'Weekly', 'Monthly', 'Quarterly'].map(freq => (
                  <button
                    key={freq}
                    onClick={() => setFormData({ ...formData, recurringFrequency: freq as any })}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${formData.recurringFrequency === freq
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Details / Comments</label>
            <textarea
              value={formData.details}
              onChange={e => setFormData({ ...formData, details: e.target.value })}
              placeholder="Enter specific item details or reference numbers..."
              className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] px-8 py-6 text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleAddTransaction}
            className="flex-[2] flex items-center justify-center gap-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 transition-all text-xl uppercase tracking-widest"
          >
            <Save size={28} /> Post Expense
          </button>
          <button
            onClick={handleSaveTemplate}
            className="flex-1 flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-8 rounded-[2.5rem] transition-all text-sm uppercase tracking-widest"
          >
            <HistoryIcon size={20} /> Save as Template
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuickExpenses = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map(tmp => (
          <div key={tmp.id} className="glass p-8 rounded-[2.5rem] border-l-4 border-l-indigo-500 hover:border-indigo-500/50 transition-all group relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Delete this template?")) onDeleteTemplate(tmp.id);
              }}
              className="absolute top-6 right-6 p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={18} />
            </button>
            <div className="space-y-6">
              <div className="space-y-1">
                <h4 className="text-2xl font-black text-white">{tmp.name}</h4>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Tag size={12} /> {tmp.mainCategory} {tmp.subcategory && `• ${tmp.subcategory}`}
                </p>
              </div>
              <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimated Amount</p>
                <span className="text-2xl font-black text-white">{formatCurrency(tmp.amount)}</span>
              </div>
              <button
                onClick={() => applyTemplate(tmp)}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
              >
                <Plus size={18} /> Use Template
              </button>
            </div>
          </div>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full py-32 text-center glass rounded-[3rem] border-dashed border-2 border-slate-800">
            <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
              <Zap size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-400">No Templates Found</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2 font-medium">Save your recurring expenses as templates to speed up your daily workflow.</p>
          </div>
        )}
      </div>
    </div>
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
