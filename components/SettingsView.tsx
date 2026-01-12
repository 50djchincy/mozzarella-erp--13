
import React, { useState } from 'react';
import {
  Users as UsersIcon,
  ShieldCheck,
  UserPlus,
  ChevronRight,
  Lock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { UserRole, User, Customer } from '../types';
import { formatCurrency, toCents } from '../utils';

interface Props {
  currentUser: User;
  onUpdateRole: (role: UserRole) => void;
  customers: Customer[];
  onSaveCustomer: (customer: Customer) => Promise<void>;
  onDeleteCustomer?: (id: string) => Promise<void>;
}

const SettingsView: React.FC<Props> = ({ currentUser, onUpdateRole, customers, onSaveCustomer, onDeleteCustomer }) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'privileges'>('privileges');
  const [newCustName, setNewCustName] = useState('');
  const [newCustBalance, setNewCustBalance] = useState('');

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const handleAddCustomer = async () => {
    if (!newCustName.trim()) return;
    const newCust: Customer = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCustName,
      outstandingBalance: toCents(newCustBalance),
    };
    await onSaveCustomer(newCust);
    setNewCustName('');
    setNewCustBalance('');
  };

  const removeCustomer = async (id: string) => {
    if (onDeleteCustomer) {
      if (window.confirm("Are you sure you want to delete this customer?")) {
        await onDeleteCustomer(id);
      }
    }
  };

  const privilegeMatrix = [
    { section: 'Staff Hub', action: 'Add/Delete Employees', admin: true, manager: false },
    { section: 'Money Lab', action: 'Add/Delete Accounts', admin: true, manager: false },
    { section: 'Daily Ops', action: 'Edit Master Config (Editor)', admin: true, manager: false },
    { section: 'Settlement Hub', action: 'Edit Settlement Rules', admin: true, manager: false },
    { section: 'Expenses', action: 'Record Transactions', admin: true, manager: true },
    { section: 'Reports', action: 'Export/View Data', admin: true, manager: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-4 p-1 bg-slate-900 rounded-2xl w-fit border border-slate-800">
        <button
          onClick={() => setActiveTab('privileges')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'privileges' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <ShieldCheck size={18} /> Privileges
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'customers' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <UserPlus size={18} /> Customers
        </button>
      </div>

      {activeTab === 'privileges' && (
        <div className="space-y-8">
          <section className="glass p-8 rounded-[2.5rem]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div>
                <h3 className="text-2xl font-black mb-1">User Roles & Privileges</h3>
                <p className="text-slate-500 text-sm">Define what managers and admins can access in the Mozzarella ecosystem.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Testing Role Toggle</p>
                  <p className="text-xs text-indigo-400 font-bold">Current: {currentUser.role}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onUpdateRole(UserRole.ADMIN)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${currentUser.role === UserRole.ADMIN ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >Admin</button>
                  <button
                    onClick={() => onUpdateRole(UserRole.MANAGER)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase ${currentUser.role === UserRole.MANAGER ? 'bg-indigo-600' : 'bg-slate-800'}`}
                  >Manager</button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-800">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Section</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest">Permission / Action</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Admin</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {privilegeMatrix.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-5">
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-400">{item.section}</span>
                      </td>
                      <td className="px-6 py-5 font-bold text-slate-300">{item.action}</td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          {item.admin ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Lock size={18} className="text-slate-700" />}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-center">
                          {item.manager ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Lock size={18} className="text-rose-500/50" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isAdmin && (
              <div className="mt-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start gap-4">
                <AlertTriangle className="text-rose-500 shrink-0" size={24} />
                <div className="space-y-1">
                  <p className="font-black text-rose-500 uppercase tracking-widest text-xs">Access Restricted</p>
                  <p className="text-sm text-slate-400">Privilege management is only available for Admin accounts. Manager accounts are view-only here.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-1 glass p-8 rounded-[2.5rem] h-fit">
            <h3 className="text-xl font-black mb-6">Create Customer</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Full Name / Entity</label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Starting Credit Balance</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    value={newCustBalance}
                    onChange={(e) => setNewCustBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-6 py-4 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleAddCustomer}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Add Customer
              </button>
            </div>
            <div className="mt-8 p-4 bg-slate-800/30 rounded-2xl border border-slate-800/50 flex gap-3">
              <Info size={18} className="text-slate-500 shrink-0 mt-1" />
              <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                Customers created here will appear in the Daily Ops "Customer Receivable" section for credit tracking.
              </p>
            </div>
          </div>

          {/* List */}
          <div className="lg:col-span-2 glass p-8 rounded-[2.5rem]">
            <h3 className="text-xl font-black mb-6">Existing Customers</h3>
            {customers.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-600">
                <UserPlus size={48} className="mb-4 opacity-20" />
                <p className="font-bold">No customers registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {customers.map(cust => (
                  <div key={cust.id} className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 group hover:border-indigo-500/50 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                        <UsersIcon size={24} />
                      </div>
                      <button
                        onClick={() => removeCustomer(cust.id)}
                        className="p-2 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <h4 className="text-lg font-black truncate">{cust.name}</h4>
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Outstanding Balance</p>
                    <p className="text-xl font-black text-amber-400 mt-1">{formatCurrency(cust.outstandingBalance)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
