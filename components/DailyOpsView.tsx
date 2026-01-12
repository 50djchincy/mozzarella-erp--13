
import React, { useState, useMemo } from 'react';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Coins,
  Calculator,
  Lock,
  Plus,
  ArrowRight,
  History,
  Settings2,
  ChevronRight,
  UserPlus,
  ArrowUpRight,
  Banknote,
  DollarSign,
  AlertTriangle,
  Zap
} from 'lucide-react';
import ExpenseEntryForm from './ExpenseEntryForm';
import QuickExpenses from './QuickExpenses';
// Fixed: Removed non-existent DailyOpsSession from imports
import { UserRole, Account, Customer, AccountType, DailyOpsConfig, ExpenseCategory, Vendor, ExpenseTemplate, ExpenseTransaction } from '../types';
import { formatCurrency, toCents } from '../utils';

interface Props {
  role: UserRole;
  accounts: Account[];
  customers: Customer[];
  config?: DailyOpsConfig;
  currentUser?: { name: string; id: string };
  categories?: ExpenseCategory[];
  vendors?: Vendor[];
  templates?: ExpenseTemplate[];
  onSaveConfig?: (config: DailyOpsConfig) => Promise<void>;
  onSaveAccount?: (account: Account) => Promise<void>;
  onSaveCustomer?: (customer: Customer) => Promise<void>;
  onAddLedgerEntry?: (entry: any) => Promise<void>;
  onSaveExpense?: (expense: ExpenseTransaction) => Promise<void>;
  onSaveCategory?: (category: ExpenseCategory) => Promise<void>;
  onSaveVendor?: (vendor: Vendor) => Promise<void>;
  onSaveTemplate?: (template: ExpenseTemplate) => Promise<void>;
}

const DailyOpsView: React.FC<Props> = ({
  role,
  accounts,
  customers,
  config: remoteConfig,
  currentUser,
  categories = [],
  vendors = [],
  templates = [],
  onSaveConfig,
  onSaveAccount,
  onSaveCustomer,
  onAddLedgerEntry,
  onSaveExpense,
  onSaveCategory,
  onSaveVendor,
  onSaveTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'wizard' | 'history' | 'editor'>('wizard');
  const [step, setStep] = useState(1);
  const isAdmin = role === UserRole.ADMIN;

  // Configuration Mapping
  const [config, setConfig] = useState<DailyOpsConfig>({
    incomeAccountId: remoteConfig?.incomeAccountId || accounts.find(a => a.type === AccountType.INCOME)?.id || '',
    cardAccountId: remoteConfig?.cardAccountId || accounts.find(a => a.type === AccountType.RECEIVABLE)?.id || '',
    partnerAccountId: remoteConfig?.partnerAccountId || accounts.find(a => a.type === AccountType.RECEIVABLE)?.id || '',
    foreignCurrencyAccountId: remoteConfig?.foreignCurrencyAccountId || accounts.find(a => a.type === AccountType.ASSETS)?.id || '',
    customerReceivableAccountId: remoteConfig?.customerReceivableAccountId || accounts.find(a => a.type === AccountType.RECEIVABLE)?.id || ''
  });

  // Update local state when remote config changes
  React.useEffect(() => {
    if (remoteConfig) {
      setConfig(prev => ({
        ...prev,
        ...remoteConfig
      }));
    }
  }, [remoteConfig]);

  const handleSaveConfig = async () => {
    if (onSaveConfig) {
      await onSaveConfig(config);
      // Optional: Show success toast or notification
    }
  };

  // Wizard Data State
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [businessDate, setBusinessDate] = useState(new Date().toISOString().split('T')[0]);
  const [moneyAdded, setMoneyAdded] = useState(0);
  const [selectedAssetSource, setSelectedAssetSource] = useState('');

  const [totalSales, setTotalSales] = useState(0);
  const [cardPayments, setCardPayments] = useState(0);
  const [partnerSales, setPartnerSales] = useState(0);
  const [foreignCurrency, setForeignCurrency] = useState(0);
  const [fcNote, setFcNote] = useState('');
  const [showCustomExpense, setShowCustomExpense] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ExpenseTemplate | undefined>(undefined);
  // Track expenses added this session for display
  const [sessionExpenses, setSessionExpenses] = useState<ExpenseTransaction[]>([]);

  const [customerCredits, setCustomerCredits] = useState<{ custId: string, amount: number }[]>([]);

  // Denomination State (in units, not cents)
  const [counts, setCounts] = useState<Record<string, number>>({
    '5000': 0, '2000': 0, '1000': 0, '500': 0, '100': 0, '50': 0, '20': 0, 'coins': 0
  });

  // Calculated Logic
  const pettyCashAccount = accounts.find(a => a.type === AccountType.PETTY_CASH);
  const openingBalance = pettyCashAccount?.currentBalance || 0;

  const totalCustomerCredit = useMemo(() => customerCredits.reduce((acc, c) => acc + c.amount, 0), [customerCredits]);

  const handleSaveExpense = async (expense: ExpenseTransaction) => {
    if (onSaveExpense) {
      await onSaveExpense(expense);
      setSessionExpenses(prev => [...prev, expense]);
    }
  };
  const sessionExpensesTotal = sessionExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const handleCloseShift = async () => {
    if (!config || !onSaveAccount || !onAddLedgerEntry) {
      alert("Configuration or save handlers missing. Please contact admin.");
      return;
    }

    // 1. Calculate Totals
    // Since expenses are now real-time, accounts.find(current) already reflects the deducted amount.
    // So Theoretical Cash = Current Balance + Cash Sales (not yet posted) + Money Added.
    // Note: This assumes Total Sales entered in wizard have NOT yet been posted to the account.


    // These variables (grossSales, physicalCount, expenses) are not defined in the current scope.
    // Assuming they should come from the state variables already defined:
    // totalSales, physicalTotal (from counts), expensesTotal
    const grossSales = totalSales;
    const physicalCount = physicalTotal;
    // Expenses are tracked in real-time now, so we don't pass a manual total for the shift summary unless we want to sum up what was added during this session.
    // For the closure report, we might want to know "Expenses Paid: $X".
    // but the balance check relies on the Account Balance.
    const expenses = 0; // Placeholder, or we can calculate from local tracking if needed.

    const totalSalesCents = grossSales;
    const cardTotal = cardPayments;
    const partnerTotal = partnerSales;
    const expensesTotalCents = 0;
    const physicalTotalCents = physicalCount;
    const creditTotal = totalCustomerCredit;

    const cashSales = totalSalesCents - cardTotal - partnerTotal - creditTotal;
    const theoreticalCash = openingBalance + cashSales - expensesTotalCents;
    const variance = physicalTotalCents - theoreticalCash;

    console.log("DEBUG: DailyOps Close Shift Calculation", {
      totalSalesCents,
      cardTotal,
      partnerTotal,
      creditTotal,
      expensesTotalCents,
      physicalTotalCents,
      cashSales,
      theoreticalCash,
      variance,
      openingBalance
    });

    // 2. Identify Accounts
    const incomeAcc = accounts.find(a => a.id === config.incomeAccountId);
    const cardAcc = accounts.find(a => a.id === config.cardAccountId);
    const partnerAcc = accounts.find(a => a.id === config.partnerAccountId);
    const customerRecAcc = accounts.find(a => a.id === config.customerReceivableAccountId);
    const pettyCashAcc = accounts.find(a => a.type === AccountType.PETTY_CASH);

    if (!incomeAcc || !pettyCashAcc) {
      console.error("DEBUG: Critical Failure - Missing Accounts", { incomeAcc, pettyCashAcc });
      alert("Critical accounts missing (Income or Petty Cash). Cannot close shift.");
      return;
    }

    try {
      // 3. Update Income Account (Credit Sales)
      await onSaveAccount({ ...incomeAcc, currentBalance: incomeAcc.currentBalance + totalSalesCents });

      // 4. Update Asset Accounts (Receivables)
      if (cardAcc && cardTotal > 0) {
        await onSaveAccount({ ...cardAcc, currentBalance: cardAcc.currentBalance + cardTotal });
      }
      if (partnerAcc && partnerTotal > 0) {
        await onSaveAccount({ ...partnerAcc, currentBalance: partnerAcc.currentBalance + partnerTotal });
      }
      if (customerRecAcc && creditTotal > 0) {
        await onSaveAccount({ ...customerRecAcc, currentBalance: customerRecAcc.currentBalance + creditTotal });
      }

      // 5. Update Individual Customers
      if (onSaveCustomer && customerCredits.length > 0) {
        for (const cred of customerCredits) {
          if (cred.custId && cred.amount > 0) {
            const customer = customers.find(c => c.id === cred.custId);
            if (customer) {
              await onSaveCustomer({
                ...customer,
                outstandingBalance: (customer.outstandingBalance || 0) + cred.amount
              });
            }
          }
        }
      }

      // 6. Update Petty Cash (The Truth)
      await onSaveAccount({ ...pettyCashAcc, currentBalance: physicalTotalCents });

      // 7. Create Ledger Entries
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString();

      // Entry 1: Record Sales Revenue
      await onAddLedgerEntry({
        id: Math.random().toString(36).substr(2, 9),
        desc: `Daily Ops Sales (${date})`,
        account: incomeAcc.name,
        type: 'Income',
        amount: totalSalesCents,
        date,
        time,
        user: role,
        status: 'Posted'
      });

      // Entry 2: Record Customer Credits
      if (creditTotal > 0) {
        await onAddLedgerEntry({
          id: Math.random().toString(36).substr(2, 9),
          desc: `Daily Ops Customer Credits (${date})`,
          account: customerRecAcc?.name || 'Customer Receivables',
          type: 'Income',
          amount: creditTotal,
          date,
          time,
          user: role,
          status: 'Posted'
        });
      }

      // Entry 3: Record Cash Variance
      if (variance !== 0) {
        await onAddLedgerEntry({
          id: Math.random().toString(36).substr(2, 9),
          desc: `Cash Variance (${date})`,
          account: pettyCashAcc.name,
          type: variance > 0 ? 'Income' : 'Expense',
          amount: Math.abs(variance),
          date,
          time,
          user: role,
          status: 'Posted'
        });
      }

      alert("Shift Closed Successfully. Accounts and Customers Updated.");
      setStep(1);
      setIsShiftOpen(false);
    } catch (e) {
      console.error("DEBUG: Error closing shift:", e);
      alert("Failed to save shift data. See console for details.");
    }
  };
  const targetRegisterBalance = useMemo(() => {
    // Formula: (Petty cash balance + money added + Total Sales) - (card payments + Partner sales + Customer Credit + Foreign currency)
    // Expenses are real-time, so openingBalance reflects them.
    return (openingBalance + moneyAdded + totalSales) - (cardPayments + partnerSales + totalCustomerCredit + foreignCurrency);
  }, [openingBalance, moneyAdded, totalSales, cardPayments, partnerSales, totalCustomerCredit, foreignCurrency]);

  // Fixed: Explicitly cast Object.entries to resolve 'unknown' type errors during arithmetic operations
  const physicalTotal = useMemo(() => {
    return (Object.entries(counts) as [string, number][]).reduce((acc, [den, count]) => {
      if (den === 'coins') return acc + count; // assumed coins entered as total cents/val
      return acc + (parseInt(den) * count);
    }, 0);
  }, [counts]);

  const variance = physicalTotal - targetRegisterBalance;

  const handleOpenShift = () => {
    setIsShiftOpen(true);
    setStep(2);
  };

  const addCustomerCreditRow = () => {
    setCustomerCredits([...customerCredits, { custId: '', amount: 0 }]);
  };

  const updateCustomerCredit = (index: number, field: 'custId' | 'amount', value: any) => {
    const updated = [...customerCredits];
    updated[index] = { ...updated[index], [field]: value };
    setCustomerCredits(updated);
  };

  const renderWizard = () => {
    if (!isShiftOpen) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center glass rounded-[3rem] space-y-8 animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative group">
            <Play size={40} className="text-white fill-white group-hover:scale-110 transition-transform" />
            <div className="absolute inset-0 bg-indigo-500 rounded-3xl animate-ping opacity-20"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black">Daily Shift is Closed</h2>
            <p className="text-slate-400 max-w-sm mx-auto">Initialize today's register to start recording sales and expenses.</p>
          </div>
          <button
            onClick={handleOpenShift}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-12 py-5 rounded-[2rem] shadow-xl shadow-indigo-500/20 transition-all flex items-center gap-4 text-xl"
          >
            Open Shift <ArrowRight size={24} />
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
        {/* Wizard Header */}
        <div className="flex items-center justify-between glass p-6 rounded-[2rem]">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <div key={s} className={`h-2 w-12 rounded-full transition-all ${step >= s ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
            ))}
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Step {step} of 5</span>
        </div>

        <div className="glass p-8 rounded-[3rem] shadow-2xl relative">
          {/* Step 1: Open Shift details (re-entering context if needed) */}
          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-3xl font-black">Open Shift Initialization</h3>
                <p className="text-slate-500 mt-2">Verify starting petty cash and business date.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Petty Cash Balance</p>
                  <p className="text-3xl font-black text-white">{formatCurrency(openingBalance)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Business Date</label>
                  <input type="date" value={businessDate} onChange={e => setBusinessDate(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="glass p-8 rounded-3xl border-2 border-dashed border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="font-black uppercase tracking-widest text-sm flex items-center gap-2">
                    <Plus size={18} className="text-indigo-400" /> Add Money to Petty Cash
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-2">Source (Asset Accounts)</label>
                    <select
                      value={selectedAssetSource}
                      onChange={e => setSelectedAssetSource(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 font-bold text-sm"
                    >
                      <option value="">Select Asset Source</option>
                      {accounts.filter(a => a.type === AccountType.ASSETS).map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.currentBalance)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase px-2">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        onChange={e => setMoneyAdded(toCents(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-8 pr-4 py-3 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Expenses */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              {showCustomExpense ? (
                <ExpenseEntryForm
                  role={role}
                  accounts={accounts}
                  currentUser={currentUser!}
                  categories={categories || []}
                  vendors={vendors || []}
                  onSaveExpense={handleSaveExpense}
                  onSaveCategory={onSaveCategory!}
                  onSaveVendor={onSaveVendor!}
                  onSaveAccount={onSaveAccount!}
                  onAddLedgerEntry={onAddLedgerEntry!}
                  onSaveTemplate={onSaveTemplate!}
                  lockSourceAccountId={pettyCashAccount?.id}
                  initialData={selectedTemplate ? {
                    amount: (selectedTemplate.amount / 100).toString(),
                    mainCategoryId: categories?.find(c => c.name === selectedTemplate.mainCategory)?.id || 'ops',
                    subcategory: selectedTemplate.subcategory,
                    vendorId: selectedTemplate.vendorId,
                    sourceAccountId: selectedTemplate.sourceAccountId,
                    receivesStock: selectedTemplate.receivesStock,
                    details: selectedTemplate.details
                  } : undefined}
                  onCancel={() => { setShowCustomExpense(false); setSelectedTemplate(undefined); }}
                  onSuccess={() => { setShowCustomExpense(false); setSelectedTemplate(undefined); }}
                />
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h3 className="text-3xl font-black text-white">Quick Expenses</h3>
                    <p className="text-slate-500 mt-2 font-medium">Select a recurring expense or add a custom one.</p>
                  </div>

                  <QuickExpenses
                    templates={templates || []}
                    onApply={(tmp) => { setSelectedTemplate(tmp); setShowCustomExpense(true); }}
                  />

                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setShowCustomExpense(true)}
                      className="flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg"
                    >
                      <Plus size={20} /> Add Custom Expense
                    </button>
                  </div>
                </>
              )}

              {sessionExpenses.length > 0 && !showCustomExpense && (
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex justify-between items-center animate-in slide-in-from-bottom-2">
                  <div>
                    <p className="text-xs font-black uppercase text-slate-500 tracking-widest">Session Expenses</p>
                    <p className="text-slate-400 text-xs mt-1">{sessionExpenses.length} items added just now</p>
                  </div>
                  <p className="text-2xl font-black text-white">{formatCurrency(sessionExpensesTotal)}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Money Distribution */}
          {step === 4 && (
            <div className="space-y-10">
              <div className="text-center">
                <h3 className="text-3xl font-black">Money Distribution</h3>
                <p className="text-slate-500 mt-2">Categorize today's revenue streams.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest px-2">Total Gross Sales (POS)</label>
                    <input type="number" onChange={e => setTotalSales(toCents(e.target.value))} placeholder="0.00" className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-xl font-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Card Payments</label>
                    <input type="number" onChange={e => setCardPayments(toCents(e.target.value))} placeholder="0.00" className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Partner Sales (Uber/Deliveroo)</label>
                    <input type="number" onChange={e => setPartnerSales(toCents(e.target.value))} placeholder="0.00" className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Foreign Currency</label>
                    <div className="flex gap-2">
                      <input type="number" onChange={e => setForeignCurrency(toCents(e.target.value))} placeholder="Amount" className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold" />
                      <input type="text" placeholder="Currency/Note" onChange={e => setFcNote(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Customer Credit Entries</label>
                    <button onClick={addCustomerCreditRow} className="text-indigo-400 font-bold text-xs flex items-center gap-1 hover:underline">
                      <Plus size={14} /> Add Line
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {customerCredits.map((cred, idx) => (
                      <div key={idx} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                        <select
                          value={cred.custId}
                          onChange={e => updateCustomerCredit(idx, 'custId', e.target.value)}
                          className="flex-[2] bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold"
                        >
                          <option value="">Select Customer</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="Amount"
                          onChange={e => updateCustomerCredit(idx, 'amount', toCents(e.target.value))}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold"
                        />
                      </div>
                    ))}
                    {customerCredits.length === 0 && <p className="text-slate-600 text-xs text-center py-4 border border-dashed border-slate-800 rounded-xl">No credit entries</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Logic & Counter */}
          {step === 5 && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-3xl font-black">Final Cash Count</h3>
                <p className="text-slate-500 mt-2">Count your physical cash and check for variance.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Calculator */}
                <div className="grid grid-cols-2 gap-4">
                  {[5000, 2000, 1000, 500, 100, 50, 20].map(den => (
                    <div key={den} className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex flex-col items-center group">
                      <span className="text-indigo-400 font-black mb-2">${den / 100}</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={counts[den.toString()] || ''}
                        onChange={e => setCounts({ ...counts, [den.toString()]: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border-none rounded-2xl py-3 text-center text-xl font-black outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                  <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 flex flex-col items-center">
                    <span className="text-emerald-400 font-black mb-2 uppercase text-[10px] tracking-widest">Coins Total</span>
                    <input
                      type="number"
                      placeholder="Total Value"
                      onChange={e => setCounts({ ...counts, coins: toCents(e.target.value) })}
                      className="w-full bg-slate-950 border-none rounded-2xl py-3 text-center text-xl font-black outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-6">
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem]">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Expected Balance (Formula)</span>
                      <span className="text-lg font-black text-white">{formatCurrency(targetRegisterBalance)}</span>
                    </div>

                    {/* Math Breakdown */}
                    <div className="mb-8 p-4 bg-slate-800/50 rounded-xl border border-dashed border-slate-700 space-y-2 text-[10px] text-slate-400 font-medium">
                      <div className="flex justify-between">
                        <span>Opening Balance (Live):</span>
                        <span>{formatCurrency(openingBalance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Money Added:</span>
                        <span>{formatCurrency(moneyAdded)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Gross Sales:</span>
                        <span>{formatCurrency(totalSales)}</span>
                      </div>
                      <div className="flex justify-between text-rose-400">
                        <span>- Non-Cash Payments:</span>
                        <span>({formatCurrency(cardPayments + partnerSales + totalCustomerCredit + foreignCurrency)})</span>
                      </div>

                      {/* Session Expenses Breakdown */}
                      {sessionExpenses.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-slate-700/50 space-y-1">
                          <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1">Expenses (Included in Opening)</p>
                          {(Object.entries(sessionExpenses.reduce((acc, curr) => {
                            const cat = curr.mainCategory || 'Uncategorized';
                            acc[cat] = (acc[cat] || 0) + curr.amount;
                            return acc;
                          }, {} as Record<string, number>)) as [string, number][]).map(([cat, amt]) => (
                            <div key={cat} className="flex justify-between text-slate-300">
                              <span>- {cat}</span>
                              <span>{formatCurrency(amt)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-slate-600 pt-2 flex justify-between font-bold text-white">
                        <span>= Target Cash:</span>
                        <span>{formatCurrency(targetRegisterBalance)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-800">
                      <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Physical Count</span>
                      <span className="text-lg font-black text-white">{formatCurrency(physicalTotal)}</span>
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Variance</p>
                      <h4 className={`text-5xl font-black ${variance === 0 ? 'text-emerald-400' : variance > 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                        {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                      </h4>
                      {variance !== 0 && (
                        <p className="text-xs font-bold text-slate-500 mt-4 flex items-center justify-center gap-2">
                          <AlertTriangle size={14} className="text-amber-500" /> Variance transaction will be recorded.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-3xl">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1 text-center">Final Petty Cash Post-Close</p>
                    <p className="text-3xl font-black text-center text-white">{formatCurrency(physicalTotal)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            {step > 2 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-5 text-slate-400 font-black uppercase tracking-widest text-xs border border-slate-800 rounded-3xl hover:text-white"
              >
                Back
              </button>
            )}
            <button
              onClick={() => step === 5 ? setIsShiftOpen(false) : setStep(step + 1)}
              className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-500/20 transition-all text-lg uppercase tracking-widest"
            >
              {step === 5 ? 'Close Shift & Post to Ledger' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => (
    <div className="glass rounded-[2.5rem] overflow-hidden animate-in fade-in duration-500">
      <div className="p-8 border-b border-slate-800 flex items-center justify-between">
        <h3 className="text-2xl font-black">Shift History</h3>
        <button className="p-3 bg-slate-900 rounded-2xl text-slate-500 hover:text-white"><History size={20} /></button>
      </div>
      <div className="p-20 text-center space-y-4">
        <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto text-slate-700">
          <Calculator size={32} />
        </div>
        <p className="text-slate-500 font-bold">No historical shifts recorded yet.</p>
      </div>
    </div>
  );

  const renderEditor = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass p-10 rounded-[3rem]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-4 bg-indigo-600 rounded-3xl text-white">
            <Settings2 size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-black">Daily Ops Configuration</h3>
            <p className="text-slate-500 text-sm">Map business events to specific ledger accounts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Primary Income Account</label>
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold"
              value={config.incomeAccountId}
              onChange={e => setConfig({ ...config, incomeAccountId: e.target.value })}
            >
              <option value="">Select Income Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Card Payments Asset</label>
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold"
              value={config.cardAccountId}
              onChange={e => setConfig({ ...config, cardAccountId: e.target.value })}
            >
              <option value="">Select Asset Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Partner Sales Receivable</label>
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold"
              value={config.partnerAccountId}
              onChange={e => setConfig({ ...config, partnerAccountId: e.target.value })}
            >
              <option value="">Select Receivable Account</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Foreign Currency Holder</label>
            <select
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 font-bold"
              value={config.foreignCurrencyAccountId}
              onChange={e => setConfig({ ...config, foreignCurrencyAccountId: e.target.value })}
            >
              <option value="">Select Foreign Currency Asset</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          className="mt-12 w-full bg-slate-800 hover:bg-slate-700 py-5 rounded-3xl font-black uppercase tracking-widest transition-all text-white"
        >
          Save Mapping Configuration
        </button>
      </div>

      <div className="p-6 bg-amber-400/10 border border-amber-400/20 rounded-3xl flex items-start gap-4">
        <AlertCircle className="text-amber-400 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-amber-400 mb-1 uppercase text-xs tracking-widest">Editor Access Only</h4>
          <p className="text-sm text-slate-400 italic">This mapping defines where money flows during shift closure. Changes affect all future shift records.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-4 p-1 bg-slate-900 rounded-3xl w-fit border border-slate-800 mb-4">
        <button onClick={() => setActiveTab('wizard')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'wizard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <Zap size={16} /> Wizard
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
          <History size={16} /> History
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('editor')} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
            <Settings2 size={16} /> Editor
          </button>
        )}
      </div>

      {activeTab === 'wizard' && renderWizard()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'editor' && isAdmin && renderEditor()}
      {activeTab === 'editor' && !isAdmin && (
        <div className="py-20 text-center glass rounded-3xl border-rose-500/20">
          <Lock size={40} className="mx-auto mb-4 text-rose-500 opacity-50" />
          <h3 className="text-xl font-bold">Access Denied</h3>
          <p className="text-slate-500">Daily Ops Editor is restricted to Administrators.</p>
        </div>
      )}
    </div>
  );
};

export default DailyOpsView;
