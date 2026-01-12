
import React, { useState, useMemo } from 'react';
import {
  Smartphone,
  CreditCard,
  Building,
  Banknote,
  Settings2,
  X,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Plus,
  History,
  Layers,
  Landmark,
  ArrowRightLeft,
  Search,
  ChevronRight,
  Calculator,
  Percent,
  Lock
} from 'lucide-react';
import { UserRole, Account, Customer, Vendor, AccountType, ReceivableTransaction, PayableBill, SettlementConfig } from '../types';
import { formatCurrency, toCents } from '../utils';

interface Props {
  role: UserRole;
  accounts: Account[];
  customers: Customer[];
  config?: SettlementConfig;
  onSaveConfig?: (config: SettlementConfig) => Promise<void>;
  receivableTransactions?: ReceivableTransaction[];
  onUpdateReceivable?: (tx: ReceivableTransaction) => Promise<void>;
  onSaveAccount?: (account: Account) => Promise<void>;
  onAddLedgerEntry?: (entry: any) => Promise<void>;
  onSaveCustomer?: (customer: Customer) => Promise<void>;
}

const SettlementView: React.FC<Props> = ({
  role,
  accounts,
  customers,
  config,
  onSaveConfig,
  receivableTransactions = [],
  onUpdateReceivable,
  onSaveAccount,
  onAddLedgerEntry,
  onSaveCustomer
}) => {
  const isAdmin = role === UserRole.ADMIN;
  const [activeTab, setActiveTab] = useState<'partners' | 'cards' | 'customers' | 'payables' | 'bank' | 'editor'>('partners');

  // Use props for data
  const pendingPartnerTxs = useMemo(() => receivableTransactions.filter(tx =>
    tx.source !== 'Visa/Master' && tx.source !== 'Amex' && tx.status === 'Pending'
  ), [receivableTransactions]);

  const pendingCardTxs = useMemo(() => receivableTransactions.filter(tx =>
    (tx.source === 'Visa/Master' || tx.source === 'Amex') && tx.status === 'Pending'
  ), [receivableTransactions]);

  const [payableBills, setPayableBills] = useState<PayableBill[]>([]);
  // Editor Config State
  const [partnerSalesRecAcc, setPartnerSalesRecAcc] = useState(config?.partnerSalesRecAccId || '');
  const [settlementCardAcc, setSettlementCardAcc] = useState(config?.settlementCardAccId || '');
  const [cardSettlementAccs, setCardSettlementAccs] = useState<string[]>(config?.autoFeeAccIds || []);
  const [partnerNameLabel, setPartnerNameLabel] = useState(config?.partnerNameLabel || 'Partner Sales');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveConfig = async () => {
    if (!onSaveConfig) return;

    setIsSaving(true);
    try {
      await onSaveConfig({
        partnerSalesRecAccId: partnerSalesRecAcc,
        settlementCardAccId: settlementCardAcc,
        autoFeeAccIds: cardSettlementAccs,
        partnerNameLabel
      });
      alert(`✅ Configuration Saved Successfully!\n\nPartner Label: ${partnerNameLabel}\nPartner Account: ${accounts.find(a => a.id === partnerSalesRecAcc)?.name || 'Not Set'}\nCard Account: ${accounts.find(a => a.id === settlementCardAcc)?.name || 'Not Set'}`);
    } catch (e) {
      console.error("Save failed", e);
      alert("Failed to save settings. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };



  // Selection States
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [selectedCustId, setSelectedCustId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Settlement Form State
  const [form, setForm] = useState({
    cash: '',
    card: '',
    expense: '',
    serviceCharge: '',
    bankTransfer: '',
    bankAccount: accounts.find(a => a.type === AccountType.ASSETS)?.id || '',
    cardAccount: settlementCardAcc,
    sourceAccount: accounts.find(a => a.type === AccountType.PETTY_CASH)?.id || '',
  });

  const selectedTx = useMemo(() => receivableTransactions.find(t => t.id === selectedTxId), [selectedTxId, receivableTransactions]);
  const selectedCust = useMemo(() => customers.find(c => c.id === selectedCustId), [selectedCustId, customers]);

  const scPercentage = useMemo(() => {
    if (!selectedTx || !form.serviceCharge) return 0;
    const scCents = toCents(form.serviceCharge);
    return ((scCents / selectedTx.amount) * 100).toFixed(1);
  }, [selectedTx, form.serviceCharge]);

  const cardSettlementTotal = useMemo(() => {
    return receivableTransactions.filter(tx => selectedTxIds.includes(tx.id)).reduce((acc, tx) => acc + tx.amount, 0);
  }, [selectedTxIds, receivableTransactions]);

  const handlePartnerSettle = async () => {

    // DEBUG: Explicitly check for missing props
    if (!selectedTxId) { alert("Error: No Transaction ID selected"); return; }
    if (!selectedTx) { alert("Error: Transaction object not found in memory"); return; }
    if (!onUpdateReceivable) { alert("Error: Update capability missing (onUpdateReceivable)"); return; }
    if (!onSaveAccount) { alert("Error: Account save capability missing (onSaveAccount)"); return; }
    if (!onAddLedgerEntry) { alert("Error: Ledger capability missing (onAddLedgerEntry)"); return; }

    const cashAmount = toCents(form.cash); // Fix: Use correct field for cash
    const cardAmount = toCents(form.card);
    const expenseAmount = toCents(form.expense);
    const serviceChargeAmount = toCents(form.serviceCharge);



    // Validation: Total check
    const totalAllocated = cashAmount + cardAmount + expenseAmount + serviceChargeAmount;

    if (totalAllocated !== selectedTx.amount) {
      if (!confirm(`Warning: The allocated amount (${formatCurrency(totalAllocated)}) does not match the transaction amount (${formatCurrency(selectedTx.amount)}). Proceed?`)) {
        return;
      }
    }

    // 1. Get Accounts
    const pettyCashAcc = accounts.find(a => a.type === AccountType.PETTY_CASH); // Cash goes here
    const partnerAcc = accounts.find(a => a.id === config?.partnerSalesRecAccId); // The pending asset account
    const cardTargetAcc = accounts.find(a => a.id === config?.settlementCardAccId); // The account where card payments go



    if (!partnerAcc) {
      alert("Please ensure Partner Account is configured.");
      return;
    }

    if (cashAmount > 0 && !pettyCashAcc) {
      alert("No Petty Cash account found to receive funds.");
      return;
    }

    try {
      // 2. Credit Pending Account (Reduce Asset) - FULL AMOUNT
      // We reduce the full amount because the transaction is fully settled.
      // Expenses are just "money we didn't get", so they are implicitly accounted for by reducing the asset.
      await onSaveAccount({ ...partnerAcc, currentBalance: partnerAcc.currentBalance - selectedTx.amount });

      // 3. Debit Petty Cash (Increase Asset) - CASH PORTION
      if (cashAmount > 0 && pettyCashAcc) {
        await onSaveAccount({ ...pettyCashAcc, currentBalance: pettyCashAcc.currentBalance + cashAmount });
      }

      // 4. Handle Card Payment Portion
      if (cardAmount > 0 && cardTargetAcc) {
        // Increase balance of target card account (Asset)
        await onSaveAccount({ ...cardTargetAcc, currentBalance: cardTargetAcc.currentBalance + cardAmount });

        // Create NEW Pending Transaction for this Card Amount
        await onUpdateReceivable({
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString().split('T')[0],
          source: `Partner Split: ${selectedTx.source}`,
          amount: cardAmount,
          status: 'Pending',
          accountId: cardTargetAcc.id
        });
      }

      // Note: We do NOT credit any separate expense account for 'expenseAmount' or 'serviceChargeAmount'
      // because the user requested they remain within the partner receivable context (deduction).

      // 5. Update Original Transaction Status
      await onUpdateReceivable({ ...selectedTx, status: 'Settled' });

      // 6. Ledger Entries
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString();

      if (cashAmount > 0 && pettyCashAcc) {
        await onAddLedgerEntry({
          id: Math.random().toString(36).substr(2, 9),
          desc: `Settlement Cash: ${selectedTx.source}`,
          account: pettyCashAcc.name,
          type: 'Income',
          amount: cashAmount,
          date,
          time,
          user: role,
          status: 'Posted'
        });
      }

      if (cardAmount > 0 && cardTargetAcc) {
        await onAddLedgerEntry({
          id: Math.random().toString(36).substr(2, 9),
          desc: `Settlement Card Split: ${selectedTx.source}`,
          account: cardTargetAcc.name,
          type: 'Income',
          amount: cardAmount,
          date,
          time,
          user: role,
          status: 'Posted'
        });
      }

      // We still record the "Payout" from the Partner Account to track that it was cleared
      // This entry represents the asset reduction.
      await onAddLedgerEntry({
        id: Math.random().toString(36).substr(2, 9),
        desc: `Settlement Cleared: ${selectedTx.source}`,
        account: partnerAcc.name,
        type: 'Expense',
        amount: selectedTx.amount,
        date,
        time,
        user: role,
        status: 'Posted'
      });

      setSelectedTxId(null);
      setForm({ ...form, cash: '', card: '', expense: '', serviceCharge: '', bankTransfer: '' });
      setTimeout(() => {
        alert(`Settled! \nCash: ${formatCurrency(cashAmount)}\nCard Pending: ${formatCurrency(cardAmount)}\nDeductions: ${formatCurrency(expenseAmount + serviceChargeAmount)}`);
      }, 50);

    } catch (e: any) {
      console.error("Settlement Error:", e);
      // Show actual error to user for debugging
      alert(`Error processing settlement: ${e.message || JSON.stringify(e)}`);
    } finally {
      // We need to define setIsSettling state first, but for now let's just ensure we catch errors visibly.
      // Ideally I'd add the state logic, but let's see exactly what the error IS first.
    }
  };

  const handleCardSettle = async () => {
    if (!onUpdateReceivable || !onSaveAccount || !onAddLedgerEntry) return;

    // Logic: Total selected amount vs Amount hitting bank
    const totalAmount = cardSettlementTotal;
    const receivedAmount = toCents(form.cash); // Using 'cash' field for 'Amount Received' in UI
    const feeAmount = totalAmount - receivedAmount;

    // 1. Get Accounts
    // For cards, usually Settled to Bank, from "Card Pending"
    const bankAcc = accounts.find(a => a.id === form.cardAccount); // Renaming field in head, assuming user picks target here
    // Wait, form.cardAccount is likely the TARGET. 
    // We need the SOURCE pending account. 
    // In DailyOps we saved to 'cardAcc' -> 'config.cardAccountId'.
    // In SettlementConfig we have 'settlementCardAccId' which might be the TARGET or SOURCE.
    // Let's assume config.settlementCardAccId is the TARGET (Bank) where money lands?
    // Actually, looking at Editor, 'settlementCardAccId' is labeled "Target Card Payment Account". 
    // So the PENDING account must be the one from Daily Ops... which we might not have purely from Settlement Config.
    // However, the Transaction object has `accountId` stored on it! We should use that.

    const targetAcc = accounts.find(a => a.id === form.cardAccount); // User selected target

    if (!targetAcc) {
      alert("Please select a target account.");
      return;
    }

    try {
      // Batch Process
      for (const id of selectedTxIds) {
        const tx = receivableTransactions.find(t => t.id === id);
        if (tx) {
          // Credit Pending Account (Source)
          const sourceAcc = accounts.find(a => a.id === tx.accountId);
          if (sourceAcc) {
            await onSaveAccount({ ...sourceAcc, currentBalance: sourceAcc.currentBalance - tx.amount });

            // Record source side ledger entry
            await onAddLedgerEntry({
              id: Math.random().toString(36).substr(2, 9),
              desc: `Card Settlement: -> ${targetAcc.name}`,
              account: sourceAcc.name,
              type: 'Expense',
              amount: tx.amount,
              date: new Date().toISOString().split('T')[0],
              time: new Date().toLocaleTimeString(),
              user: role,
              status: 'Posted'
            });
          }
          await onUpdateReceivable({ ...tx, status: 'Settled' });
        }
      }

      // Debit Target Account (Bank) - Net Amount
      await onSaveAccount({ ...targetAcc, currentBalance: targetAcc.currentBalance + receivedAmount });

      // 3. Ledger Entry for Target Account
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString();

      await onAddLedgerEntry({
        id: Math.random().toString(36).substr(2, 9),
        desc: `Card Settlement Batch Received (${selectedTxIds.length} txs)`,
        account: targetAcc.name,
        type: 'Income',
        amount: receivedAmount,
        date,
        time,
        user: role,
        status: 'Posted'
      });

      setSelectedTxIds([]);
      setForm({ ...form, cash: '' });
      alert("Card Payment Reconciled!");
    } catch (e) {
      console.error(e);
      alert("Error settling cards.");
    }
  };

  const handleCustSettle = async () => {
    if (!selectedCustId || !selectedCust || !onSaveCustomer || !onSaveAccount || !onAddLedgerEntry) return;

    const paymentAmount = toCents(form.cash);
    if (paymentAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    // 1. Get Accounts
    // Target: Where is the money going? (Bank/Cash)
    const targetAcc = accounts.find(a => a.id === form.bankAccount);
    // Source Account: "Customer Credit Receivable" (Asset) - configured in DailyOps, but maybe we need it here too?
    // Let's rely on finding a general "Receivable" account if not strictly configured, or just update the Customer object primarily.
    // Ideally, we debit Cash, Credit Receivable.

    // We need to know which Receivable Account tracks this customer's debt. 
    // For now, let's find the first generic Receivable account if specific one isn't in config.
    const receivableAcc = accounts.find(a => a.type === AccountType.RECEIVABLE); // Fallback

    if (!targetAcc) {
      alert("Please select a target Bank/Cash account.");
      return;
    }

    try {
      // 2. Update Customer Debt (Reduce)
      await onSaveCustomer({
        ...selectedCust,
        outstandingBalance: Math.max(0, selectedCust.outstandingBalance - paymentAmount),
        lastActive: new Date().toISOString()
      });

      // 3. Update Financial Accounts
      // Debit Cash/Bank
      await onSaveAccount({ ...targetAcc, currentBalance: targetAcc.currentBalance + paymentAmount });

      // Credit Receivable Control Account
      if (receivableAcc) {
        await onSaveAccount({ ...receivableAcc, currentBalance: receivableAcc.currentBalance - paymentAmount });
      }

      // 4. Ledger Entries
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString();

      await onAddLedgerEntry({
        id: Math.random().toString(36).substr(2, 9),
        desc: `Customer Payment Received: ${selectedCust.name}`,
        account: targetAcc.name,
        type: 'Income',
        amount: paymentAmount,
        date,
        time,
        user: role,
        status: 'Posted'
      });

      if (receivableAcc) {
        await onAddLedgerEntry({
          id: Math.random().toString(36).substr(2, 9),
          desc: `Customer Credit Paid Off: ${selectedCust.name}`,
          account: receivableAcc.name,
          type: 'Expense',
          amount: paymentAmount,
          date,
          time,
          user: role,
          status: 'Posted'
        });
      }

      setSelectedCustId(null);
      setForm({ ...form, cash: '' });
      alert(`Payment Received: ${formatCurrency(paymentAmount)}\nNew Balance: ${formatCurrency(Math.max(0, selectedCust.outstandingBalance - paymentAmount))}`);

    } catch (e) {
      console.error(e);
      alert("Failed to process payment.");
    }
  };

  const handlePayableSettle = async () => {
    if (!selectedVendorId || !onSaveAccount || !onAddLedgerEntry) return;

    const amountCents = toCents(form.bankTransfer);
    const sourceAcc = accounts.find(a => a.id === form.bankAccount);
    const vendorAcc = accounts.find(a => a.id === selectedVendorId); // Actually this might be a vendor object, but types.ts says payable bills are tied to vendors.

    if (!sourceAcc || amountCents <= 0) {
      alert("Please select a valid source account and amount.");
      return;
    }

    try {
      // 1. Update Source Account (Decrease Asset/Cash)
      await onSaveAccount({ ...sourceAcc, currentBalance: sourceAcc.currentBalance - amountCents });

      // 2. Update Payable Account if exists
      // If the bill was from a PAYABLE type account, we should reduce its liability.
      const payableAcc = accounts.find(a => a.id === selectedVendorId && a.type === AccountType.PAYABLE);
      if (payableAcc) {
        await onSaveAccount({ ...payableAcc, currentBalance: payableAcc.currentBalance - amountCents });
      }

      // 3. Ledger Entries
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString();

      await onAddLedgerEntry({
        id: Math.random().toString(36).substr(2, 9),
        desc: `Bill Payment to Vendor`,
        account: sourceAcc.name,
        type: 'Expense',
        amount: amountCents,
        date,
        time,
        user: role,
        status: 'Posted'
      });

      if (payableAcc) {
        await onAddLedgerEntry({
          id: Math.random().toString(36).substr(2, 9),
          desc: `Liability Settlement: Paid from ${sourceAcc.name}`,
          account: payableAcc.name,
          type: 'Income', // Reducing liability is like "Income" for the account balance in this simplified model
          amount: amountCents,
          date,
          time,
          user: role,
          status: 'Posted'
        });
      }

      setSelectedVendorId(null);
      setForm({ ...form, cash: '', bankTransfer: '' });
      alert("Payment Successful!");
    } catch (e) {
      console.error(e);
      alert("Error processing payment.");
    }
  };

  const handleBankMoney = async () => {
    if (!onSaveAccount || !onAddLedgerEntry) return;

    const amountCents = toCents(form.cash);
    const pettyCashAcc = accounts.find(a => a.type === AccountType.PETTY_CASH);
    const targetAcc = accounts.find(a => a.id === form.bankAccount);

    if (!pettyCashAcc || !targetAcc || amountCents <= 0) {
      alert("Please select a valid target account and amount.");
      return;
    }

    try {
      // 1. Update Petty Cash (Decrease)
      await onSaveAccount({ ...pettyCashAcc, currentBalance: pettyCashAcc.currentBalance - amountCents });

      // 2. Update Target Bank Account (Increase)
      await onSaveAccount({ ...targetAcc, currentBalance: targetAcc.currentBalance + amountCents });

      // 3. Ledger Entries
      const date = new Date().toISOString().split('T')[0];
      const time = new Date().toLocaleTimeString();

      await onAddLedgerEntry({
        id: Math.random().toString(36).substr(2, 9),
        desc: `Bank Deposit: To ${targetAcc.name}`,
        account: pettyCashAcc.name,
        type: 'Expense',
        amount: amountCents,
        date,
        time,
        user: role,
        status: 'Posted'
      });

      await onAddLedgerEntry({
        id: Math.random().toString(36).substr(2, 9),
        desc: `Deposit from Petty Cash`,
        account: targetAcc.name,
        type: 'Income',
        amount: amountCents,
        date,
        time,
        user: role,
        status: 'Posted'
      });

      setForm({ ...form, cash: '' });
      alert("Bank Deposit Recorded!");
    } catch (e) {
      console.error(e);
      alert("Error recording deposit.");
    }
  };

  const renderPartners = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="glass p-8 rounded-[2.5rem] space-y-6">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <Smartphone className="text-indigo-400" /> Pending {partnerNameLabel} Sales
        </h3>
        <div className="space-y-3">
          {pendingPartnerTxs.length === 0 && (
            <p className="text-slate-500 text-sm">No pending {partnerNameLabel} transactions found.</p>
          )}
          {pendingPartnerTxs.map(tx => (
            <button
              key={tx.id}
              onClick={() => setSelectedTxId(tx.id)}
              className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${selectedTxId === tx.id ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-500/20' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
            >
              <div className="text-left">
                <p className={`text-xs font-black uppercase tracking-widest ${selectedTxId === tx.id ? 'text-indigo-200' : 'text-slate-500'}`}>{tx.date}</p>
                <p className="text-lg font-black text-white">{tx.source}</p>
              </div>
              <p className="text-xl font-black text-white">{formatCurrency(tx.amount)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem]">
        {selectedTx ? (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-black text-white">Settle {selectedTx.source}</h4>
              <button onClick={() => setSelectedTxId(null)}><X className="text-slate-500 hover:text-white" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Cash Received (to Petty Cash)</label>
                <input type="number" value={form.cash} onChange={e => setForm({ ...form, cash: e.target.value })} placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Card Payment</label>
                <input type="number" value={form.card} onChange={e => setForm({ ...form, card: e.target.value })} placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Partner Owed (Expense)</label>
                <input type="number" value={form.expense} onChange={e => setForm({ ...form, expense: e.target.value })} placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Service Charge (Expense)</label>
                <div className="relative">
                  <input type="number" value={form.serviceCharge} onChange={e => setForm({ ...form, serviceCharge: e.target.value })} placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">
                    {scPercentage}%
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <Calculator size={16} className="text-indigo-400" />
                <p className="text-[10px] font-bold text-slate-400">Card payment will be settled to: <span className="text-indigo-300 font-black">{accounts.find(a => a.id === settlementCardAcc)?.name}</span></p>
              </div>

              {(() => {
                const totalAllocated = toCents(form.cash) + toCents(form.card) + toCents(form.expense) + toCents(form.serviceCharge);
                const remaining = selectedTx.amount - totalAllocated;
                const matches = remaining === 0;

                return (
                  <div className={`p-4 rounded-xl border-l-4 ${matches ? 'bg-emerald-500/10 border-emerald-500' : 'bg-amber-500/10 border-amber-500'}`}>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400">Unallocated Amount</span>
                      <span className={`text-xl font-black ${matches ? 'text-emerald-400' : 'text-amber-400'}`}>{formatCurrency(remaining)}</span>
                    </div>
                  </div>
                );
              })()}

              <button onClick={handlePartnerSettle} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all uppercase tracking-widest text-xs">Finalize Settlement</button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <Smartphone size={48} />
            <p className="text-sm font-bold max-w-xs">Select a pending partner transaction to begin reconciliation.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCards = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="glass p-8 rounded-[2.5rem] space-y-6">
        <div className="bg-slate-800 text-slate-300 p-4 mb-6 rounded-xl font-mono text-xs overflow-x-auto border border-slate-700">
          <p className="font-bold text-white mb-2">DEBUG DIAGNOSTICS:</p>
          <p>Total Raw Transactions: {receivableTransactions.length}</p>
          <p>Partner Pending: {pendingPartnerTxs.length}</p>
          <p>Card Pending: {pendingCardTxs.length}</p>
          {receivableTransactions.length > 0 && (
            <div className="mt-2 p-2 bg-black rounded">
              <p className="text-emerald-400">First Transaction Raw Data:</p>
              <pre>{JSON.stringify(receivableTransactions[0], null, 2)}</pre>
            </div>
          )}
        </div>
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <CreditCard className="text-emerald-400" /> Terminal Payments
        </h3>
        <div className="space-y-3">
          {pendingCardTxs.map(tx => (
            <button
              key={tx.id}
              onClick={() => {
                if (selectedTxIds.includes(tx.id)) setSelectedTxIds(selectedTxIds.filter(id => id !== tx.id));
                else setSelectedTxIds([...selectedTxIds, tx.id]);
              }}
              className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${selectedTxIds.includes(tx.id) ? 'bg-emerald-600 border-emerald-500 shadow-xl shadow-emerald-500/20' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
            >
              <div className="text-left">
                <p className={`text-xs font-black uppercase tracking-widest ${selectedTxIds.includes(tx.id) ? 'text-emerald-200' : 'text-slate-500'}`}>{tx.date}</p>
                <p className="text-lg font-black text-white">{tx.source}</p>
              </div>
              <p className="text-xl font-black text-white">{formatCurrency(tx.amount)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem]">
        {selectedTxIds.length > 0 ? (
          <div className="space-y-8">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Selected for Settlement</p>
              <h4 className="text-4xl font-black text-white">{formatCurrency(cardSettlementTotal)}</h4>
            </div>

            <div className="space-y-4 bg-slate-950 p-6 rounded-3xl border border-slate-800">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Net Cash Received to Bank</label>
                <input
                  type="number"
                  value={form.cash}
                  onChange={e => setForm({ ...form, cash: e.target.value })}
                  placeholder="Enter final statement amount"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-2xl font-black text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {form.cash && (
                <div className="flex justify-between items-center px-2 py-4 border-t border-slate-800 animate-in fade-in">
                  <span className="text-xs font-bold text-slate-400">Calculated Bank Fees (Expense):</span>
                  <span className="text-lg font-black text-rose-400">{formatCurrency(Math.max(0, cardSettlementTotal - toCents(form.cash)))}</span>
                </div>
              )}
            </div>

            <button onClick={handleCardSettle} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all uppercase tracking-widest text-xs">Reconcile Terminal Sales</button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <CreditCard size={48} />
            <p className="text-sm font-bold max-w-xs">Select terminal transactions to reconcile with bank statement.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="glass p-8 rounded-[2.5rem] space-y-6">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <Building className="text-amber-400" /> Credit Customers
        </h3>
        <div className="space-y-3">
          {customers.filter(c => c.outstandingBalance > 0).map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCustId(c.id)}
              className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${selectedCustId === c.id ? 'bg-amber-600 border-amber-500 shadow-xl shadow-amber-500/20' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
            >
              <div className="text-left">
                <p className="text-lg font-black text-white">{c.name}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest ${selectedCustId === c.id ? 'text-amber-200' : 'text-slate-500'}`}>Corporate ID: #{c.id.slice(-4)}</p>
              </div>
              <p className="text-xl font-black text-white">{formatCurrency(c.outstandingBalance)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem]">
        {selectedCust ? (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Outstanding Balance for {selectedCust.name}</p>
              <h4 className="text-4xl font-black text-white">{formatCurrency(selectedCust.outstandingBalance)}</h4>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 px-2">Cash (to Petty Cash)</label>
                  <input type="number" value={form.cash} onChange={e => setForm({ ...form, cash: e.target.value })} placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 px-2">Bank Transfer Amount</label>
                  <input type="number" value={form.bankTransfer} onChange={e => setForm({ ...form, bankTransfer: e.target.value })} placeholder="0.00" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Deposit to Asset Account</label>
                <select
                  value={form.bankAccount}
                  onChange={e => setForm({ ...form, bankAccount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold"
                >
                  {accounts.filter(a => a.type === AccountType.ASSETS).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.currentBalance)})</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleCustSettle} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 transition-all uppercase tracking-widest text-xs">Record Collection</button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <Building size={48} />
            <p className="text-sm font-bold max-w-xs">Select a customer with outstanding balance to settle payments.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPayables = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="glass p-8 rounded-[2.5rem] space-y-6">
        <h3 className="text-2xl font-black text-white flex items-center gap-3">
          <Layers className="text-rose-400" /> Pending Payables
        </h3>
        <div className="space-y-3">
          {payableBills.map(bill => (
            <button
              key={bill.id}
              onClick={() => setSelectedVendorId(bill.id)}
              className={`w-full flex items-center justify-between p-6 rounded-2xl border transition-all ${selectedVendorId === bill.id ? 'bg-rose-600 border-rose-500 shadow-xl shadow-rose-500/20' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
            >
              <div className="text-left">
                <p className="text-lg font-black text-white">{bill.vendorName}</p>
                <div className="flex gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${selectedVendorId === bill.id ? 'bg-rose-800 text-white' : 'bg-slate-800 text-slate-400'}`}>Due: {bill.dueDate}</span>
                  {bill.isRecurring && <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${selectedVendorId === bill.id ? 'bg-rose-800 text-white' : 'bg-rose-500/20 text-rose-400'}`}>RECURRING</span>}
                </div>
              </div>
              <p className="text-xl font-black text-white">{formatCurrency(bill.amount)}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem]">
        {selectedVendorId ? (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-black text-white">Bill Payment</h4>
              <button onClick={() => setSelectedVendorId(null)}><X className="text-slate-500" /></button>
            </div>

            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Payment Amount</label>
                <input type="number" value={form.bankTransfer} onChange={e => setForm({ ...form, bankTransfer: e.target.value })} placeholder="0.00" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-2xl font-black text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Source of Funds</label>
                <select
                  value={form.bankAccount}
                  onChange={e => setForm({ ...form, bankAccount: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white font-bold"
                >
                  {accounts.filter(a => a.type === AccountType.ASSETS || a.type === AccountType.PETTY_CASH).map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.currentBalance)})</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handlePayableSettle} className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-rose-500/20 transition-all uppercase tracking-widest text-xs">Execute Payment</button>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <Layers size={48} />
            <p className="text-sm font-bold max-w-xs">Select a bill or recurring payment to settle from your assets.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderBank = () => (
    <div className="max-w-2xl mx-auto glass p-10 rounded-[3rem] space-y-10 animate-in zoom-in-95 duration-500 border-indigo-500/20">
      <div className="text-center space-y-2">
        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
          <Banknote size={40} className="text-white" />
        </div>
        <h3 className="text-3xl font-black text-white">Bank Cash Deposit</h3>
        <p className="text-slate-500 font-medium">Transfer accumulated physical cash from till to bank account.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Petty Cash Balance</p>
          <h4 className="text-3xl font-black text-indigo-400">{formatCurrency(accounts.find(a => a.type === AccountType.PETTY_CASH)?.currentBalance || 0)}</h4>
        </div>
        <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center">
          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Amount Banked (Today)</p>
          <h4 className="text-3xl font-black text-emerald-400">{formatCurrency(0)}</h4>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 px-2">Deposit Amount</label>
          <div className="relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-black text-2xl">$</span>
            <input
              type="number"
              value={form.cash}
              onChange={e => setForm({ ...form, cash: e.target.value })}
              placeholder="0.00"
              className="w-full bg-slate-950 border border-slate-800 rounded-3xl pl-12 pr-6 py-6 text-3xl font-black text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-slate-500 px-2">Destination Asset Account</label>
          <select
            value={form.bankAccount}
            onChange={e => setForm({ ...form, bankAccount: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 font-black text-white text-lg focus:ring-2 focus:ring-indigo-500"
          >
            {accounts.filter(a => a.type === AccountType.ASSETS).map(a => (
              <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.currentBalance)})</option>
            ))}
          </select>
        </div>

        <button onClick={handleBankMoney} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-3xl shadow-xl shadow-indigo-500/20 transition-all text-lg uppercase tracking-widest">Post Bank Deposit</button>
      </div>
    </div>
  );

  const renderEditor = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="glass p-10 rounded-[3rem] space-y-10">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 rounded-2xl text-white"><Settings2 size={24} /></div>
          <div>
            <h3 className="text-2xl font-black text-white">Settlement Configuration</h3>
            <p className="text-slate-500 text-sm">Define account routing for various reconciliation workflows.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest">Partner Sales (Uber/Deliveroo)</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Partner Receivable Holder</label>
                <select value={partnerSalesRecAcc} onChange={e => setPartnerSalesRecAcc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold">
                  {accounts.filter(a => a.type === AccountType.PARTNER_RECEIVABLE).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 px-2">Target Card Payment Account</label>
                <select value={settlementCardAcc} onChange={e => setSettlementCardAcc(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-bold">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-widest">Card Payment Reconciliation</h4>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 px-2">Apply Auto-Fee Logic to Accounts</label>
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800 max-h-[120px] overflow-y-auto">
                {accounts.filter(a => a.type === AccountType.RECEIVABLE).map(a => (
                  <label key={a.id} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={cardSettlementAccs.includes(a.id)}
                      onChange={() => {
                        if (cardSettlementAccs.includes(a.id)) setCardSettlementAccs(cardSettlementAccs.filter(id => id !== a.id));
                        else setCardSettlementAccs([...cardSettlementAccs, a.id]);
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-emerald-500"
                    />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-white">{a.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveConfig}
          disabled={isSaving}
          className={`w-full ${isSaving ? 'bg-slate-700 cursor-wait' : 'bg-slate-800 hover:bg-slate-700'} text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2`}
        >
          {isSaving ? 'Saving Changes...' : 'Save Settlement Rules'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-wrap gap-2 p-1.5 glass rounded-[2rem] w-fit">
        {[
          { id: 'partners', label: 'Partners', icon: Smartphone },
          { id: 'cards', label: 'Cards', icon: CreditCard },
          { id: 'customers', label: 'Customers', icon: Building },
          { id: 'payables', label: 'Payables', icon: Layers },
          { id: 'bank', label: 'Bank Money', icon: Banknote },
          ...(isAdmin ? [{ id: 'editor', label: 'Editor', icon: Settings2 }] : []),
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'partners' && renderPartners()}
      {activeTab === 'cards' && renderCards()}
      {activeTab === 'customers' && renderCustomers()}
      {activeTab === 'payables' && renderPayables()}
      {activeTab === 'bank' && renderBank()}
      {activeTab === 'editor' && isAdmin && renderEditor()}
      {activeTab === 'editor' && !isAdmin && (
        <div className="py-20 text-center glass rounded-3xl border-rose-500/20">
          <Lock size={40} className="mx-auto mb-4 text-rose-500 opacity-50" />
          <h3 className="text-xl font-bold">Access Denied</h3>
          <p className="text-slate-500">Settlement Configuration is restricted to Administrators.</p>
        </div>
      )}
    </div>
  );
}

export default SettlementView;
