
import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Coins,
  Wallet,
  Zap,
  ArrowLeft,
  Calendar,
  Download,
  ArrowRightLeft,
  Check,
  Lock
} from 'lucide-react';
import { formatCurrency, toCents } from '../utils';
import { AccountType, Account, UserRole } from '../types';

interface Props {
  role: UserRole;
  accounts: Account[];
  onSaveAccount: (account: Account) => Promise<void>;
}

const MoneyLabView: React.FC<Props> = ({ role, accounts, onSaveAccount }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // New Account Form State
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [newType, setNewType] = useState<AccountType>(AccountType.ASSETS);

  // Transfer Form State
  const [transferFrom, setTransferFrom] = useState<string>('');
  const [transferTo, setTransferTo] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');

  const isAdmin = role === UserRole.ADMIN;

  const handleCreateAccount = async () => {
    if (!isAdmin) return;
    if (!newName.trim()) return;
    const balance = toCents(newBalance);
    const newAcc: Account = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      type: newType,
      startingBalance: balance,
      currentBalance: balance,
    };

    await onSaveAccount(newAcc);

    setIsModalOpen(false);
    setNewName('');
    setNewBalance('');
    setNewType(AccountType.ASSETS);
  };

  const handleTransfer = async () => {
    const amountCents = toCents(transferAmount);
    if (amountCents <= 0 || !transferFrom || !transferTo || transferFrom === transferTo) return;

    const fromAcc = accounts.find(a => a.id === transferFrom);
    const toAcc = accounts.find(a => a.id === transferTo);

    if (!fromAcc || !toAcc) return;

    const updatedFrom = { ...fromAcc, currentBalance: fromAcc.currentBalance - amountCents };
    const updatedTo = { ...toAcc, currentBalance: toAcc.currentBalance + amountCents };

    await Promise.all([
      onSaveAccount(updatedFrom),
      onSaveAccount(updatedTo)
    ]);

    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferNote('');
    setTransferFrom('');
    setTransferTo('');
  };

  const openTransferModal = (fromId?: string) => {
    if (fromId) setTransferFrom(fromId);
    setIsTransferModalOpen(true);
  };

  const getIconForType = (type: AccountType) => {
    switch (type) {
      case AccountType.RECEIVABLE: return <ArrowDownLeft size={20} />;
      case AccountType.INCOME: return <Coins size={20} />;
      case AccountType.PAYABLE: return <ArrowUpRight size={20} />;
      case AccountType.ASSETS: return <Layers size={20} />;
      case AccountType.PETTY_CASH: return <Wallet size={20} />;
      case AccountType.DAILY_OPS: return <Zap size={20} />;
    }
  };

  if (selectedAccount) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedAccount(null)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-bold uppercase tracking-widest text-xs">Back to Accounts</span>
          </button>
          <div className="flex gap-2">
            <button className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Calendar size={18} /></button>
            <button className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white"><Download size={18} /></button>
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border-l-4 border-l-indigo-500">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  {getIconForType(selectedAccount.type)}
                </span>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{selectedAccount.type}</span>
              </div>
              <h2 className="text-3xl font-black text-white">{selectedAccount.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">Total Balance</p>
              <h3 className="text-4xl font-black text-white">{formatCurrency(selectedAccount.currentBalance)}</h3>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => openTransferModal(selectedAccount.id)}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-bold transition-all text-white"
            >
              <ArrowRightLeft size={18} /> Transfer Funds
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 font-bold uppercase tracking-widest text-xs text-slate-400">Master Ledger Entries</div>
          <div className="p-12 text-center text-slate-500 italic">
            No transactions recorded yet in this ledger.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-md:max-w-none max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search accounts..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openTransferModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-bold transition-all"
          >
            <ArrowRightLeft size={18} />
            Transfer
          </button>
          {isAdmin ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus size={18} />
              Add Account
            </button>
          ) : (
            <button
              disabled
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 text-slate-500 px-6 py-3 rounded-2xl font-bold opacity-50 cursor-not-allowed"
            >
              <Lock size={16} />
              Add Account
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            onClick={() => setSelectedAccount(acc)}
            className="glass p-6 rounded-3xl hover:border-indigo-500/50 transition-all cursor-pointer group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-slate-800 rounded-2xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {getIconForType(acc.type)}
              </div>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-slate-500 hover:text-white transition-colors"
              >
                <MoreHorizontal size={20} />
              </button>
            </div>

            <h3 className="text-xl font-bold mb-1 text-white group-hover:text-indigo-300 transition-colors">{acc.name}</h3>
            <p className="text-slate-500 text-[10px] mb-6 uppercase tracking-widest font-black">{acc.type}</p>

            <div className="pt-6 border-t border-slate-800">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Current Balance</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-white">{formatCurrency(acc.currentBalance)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* New Account Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 text-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black">New Account</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 pt-0 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Account Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Main Sales"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Starting Balance</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-6 py-4 text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: AccountType.RECEIVABLE, label: 'Receivables', icon: ArrowDownLeft },
                    { type: AccountType.INCOME, label: 'Income', icon: Coins },
                    { type: AccountType.PAYABLE, label: 'Payables', icon: ArrowUpRight },
                    { type: AccountType.ASSETS, label: 'Asset', icon: Layers },
                    { type: AccountType.PETTY_CASH, label: 'Petty Cash', icon: Wallet },
                    { type: AccountType.DAILY_OPS, label: 'Daily Ops', icon: Zap },
                  ].map((item) => (
                    <button
                      key={item.type}
                      onClick={() => setNewType(item.type)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${newType === item.type
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:bg-slate-800'
                        }`}
                    >
                      <item.icon size={18} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateAccount}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all text-lg"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Money Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsTransferModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 text-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex items-center justify-between">
              <h3 className="text-2xl font-black text-white">Transfer Money</h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 pt-0 space-y-6">
              <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-3xl border border-slate-800">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block px-2">From</label>
                  <select
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-indigo-500"
                  >
                    <option value="" className="bg-slate-900">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.name} ({formatCurrency(acc.currentBalance)})</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4 text-slate-700">
                  <ArrowRightLeft size={20} />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block px-2">To</label>
                  <select
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-indigo-500"
                  >
                    <option value="" className="bg-slate-900">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Transfer Amount</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-6 py-4 text-white font-black text-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Reference / Note</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="e.g. Restocking petty cash"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleTransfer}
                disabled={!transferFrom || !transferTo || !transferAmount || transferFrom === transferTo}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all text-lg flex items-center justify-center gap-3"
              >
                <Check size={24} /> Execute Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyLabView;
