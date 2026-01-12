
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
  Lock,
  Settings as SettingsIcon,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, toCents } from '../utils';
import { AccountType, Account, UserRole } from '../types';

interface Props {
  role: UserRole;
  accounts: Account[];
  onSaveAccount: (account: Account) => Promise<void>;
  onAddLedgerEntry: (entry: any) => Promise<void>;
  ledgerEntries: any[];
}

const MoneyLabView: React.FC<Props> = ({ role, accounts, onSaveAccount, onAddLedgerEntry, ledgerEntries }) => {
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

  // Adjustment Form State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDesc, setAdjustDesc] = useState('Opening Balance Correction');
  const [adjustType, setAdjustType] = useState<'Income' | 'Expense'>('Income');

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

    // Create initial ledger entry
    await onAddLedgerEntry({
      id: Math.random().toString(36).substr(2, 9),
      desc: `Initial Balance / Account Created`,
      account: newAcc.name,
      type: 'Income',
      amount: balance,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      user: role,
      status: 'Posted'
    });

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

    // Record Ledger Entries for Transfer
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toLocaleTimeString();

    await onAddLedgerEntry({
      id: Math.random().toString(36).substr(2, 9),
      desc: `Transfer to ${toAcc.name}${transferNote ? ' (' + transferNote + ')' : ''}`,
      account: fromAcc.name,
      type: 'Expense',
      amount: amountCents,
      date,
      time,
      user: role,
      status: 'Posted'
    });

    await onAddLedgerEntry({
      id: Math.random().toString(36).substr(2, 9),
      desc: `Transfer from ${fromAcc.name}${transferNote ? ' (' + transferNote + ')' : ''}`,
      account: toAcc.name,
      type: 'Income',
      amount: amountCents,
      date,
      time,
      user: role,
      status: 'Posted'
    });

    setIsTransferModalOpen(false);
    setTransferAmount('');
    setTransferNote('');
    setTransferFrom('');
    setTransferTo('');
  };

  const handleAdjustBalance = async () => {
    if (!isAdmin || !selectedAccount) return;
    const amountCents = toCents(adjustAmount);
    if (amountCents <= 0) return;

    const newBalance = adjustType === 'Income'
      ? selectedAccount.currentBalance + amountCents
      : selectedAccount.currentBalance - amountCents;

    const updatedAccount = { ...selectedAccount, currentBalance: newBalance };

    await onSaveAccount(updatedAccount);

    // Record Ledger Entry
    await onAddLedgerEntry({
      id: Math.random().toString(36).substr(2, 9),
      desc: `MANUAL ADJUSTMENT: ${adjustDesc}`,
      account: selectedAccount.name,
      type: adjustType,
      amount: amountCents,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString(),
      user: role,
      status: 'Posted'
    });

    setSelectedAccount(updatedAccount);
    setIsAdjustModalOpen(false);
    setAdjustAmount('');
    setAdjustDesc('Opening Balance Correction');
    alert("Balance adjusted and ledger entry created.");
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
      case AccountType.PARTNER_RECEIVABLE: return <Zap size={20} />;
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
            {isAdmin && (
              <button
                onClick={() => setIsAdjustModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 py-4 rounded-2xl font-bold transition-all text-slate-300"
              >
                <SettingsIcon size={18} /> Adjust Balance
              </button>
            )}
          </div>
        </div>

        <div className="glass rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <span className="font-bold uppercase tracking-widest text-xs text-slate-400">Master Ledger Entries</span>
            <div className="flex items-center gap-4">
              {/* Ledger Audit Badge */}
              {(() => {
                const entries = (ledgerEntries || []).filter(e => e.account === selectedAccount.name);
                const ledgerSum = entries.reduce((acc, e) => {
                  return e.type === 'Income' ? acc + e.amount : acc - e.amount;
                }, 0);
                const diff = selectedAccount.currentBalance - ledgerSum;
                const isMatch = Math.abs(diff) < 1; // Precision check

                return (
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isMatch ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                      {isMatch ? (
                        <>
                          <Check size={10} /> Ledger Matches Balance
                        </>
                      ) : (
                        <>
                          <AlertCircle size={10} /> Discrepancy: {formatCurrency(Math.abs(diff))}
                        </>
                      )}
                    </span>
                    {!isMatch && isAdmin && (
                      <button
                        onClick={async () => {
                          const direction = diff > 0 ? 'Income' : 'Expense';
                          const absDiff = Math.abs(diff);

                          if (window.confirm(`Fix Ledger? This will add a ${direction} entry of ${formatCurrency(absDiff)} to match current balance.`)) {
                            await onAddLedgerEntry({
                              id: Math.random().toString(36).substr(2, 9),
                              desc: `SYSTEM RECONCILIATION: Balance Alignment`,
                              account: selectedAccount.name,
                              type: direction,
                              amount: absDiff,
                              date: new Date().toISOString().split('T')[0],
                              time: new Date().toLocaleTimeString(),
                              user: role,
                              status: 'Posted'
                            });
                            alert("Ledger aligned successfully!");
                          }
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
                      >
                        Reconcile Ledger
                      </button>
                    )}
                  </div>
                );
              })()}
              <span className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {(ledgerEntries || []).filter(e => e.account === selectedAccount.name).length} Transactions
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date/Time</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {(ledgerEntries || [])
                  .filter(e => e.account === selectedAccount.name)
                  .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
                  .map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-xs font-bold text-white">{entry.date}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{entry.time}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-300">
                        {entry.desc}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${entry.type === 'Income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-xs font-black ${entry.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                          {entry.type === 'Income' ? '+' : '-'}{formatCurrency(entry.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                {(ledgerEntries || []).filter(e => e.account === selectedAccount.name).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                      No transactions recorded yet in this ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
                    { type: AccountType.PARTNER_RECEIVABLE, label: 'Partner Receivable', icon: Zap },
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

      {/* Adjustment Modal */}
      {isAdjustModalOpen && selectedAccount && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="glass w-full max-w-lg rounded-[2.5rem] border-indigo-500/20 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-xl font-black text-white">Manual Balance Adjustment</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest">Adjustment Direction</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAdjustType('Income')}
                    className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${adjustType === 'Income' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    Add Funds (+)
                  </button>
                  <button
                    onClick={() => setAdjustType('Expense')}
                    className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all ${adjustType === 'Expense' ? 'bg-rose-500/10 border-rose-500 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                  >
                    Remove Funds (-)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest">Amount</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={e => setAdjustAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2 tracking-widest">Description / Reason</label>
                <input
                  type="text"
                  value={adjustDesc}
                  onChange={e => setAdjustDesc(e.target.value)}
                  placeholder="e.g. Initial balance upload correction"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold"
                />
              </div>

              <button
                onClick={handleAdjustBalance}
                className="w-full bg-indigo-600 hover:bg-indigo-500 py-6 rounded-3xl font-black text-white uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyLabView;
