import React, { useState } from 'react';
import {
    Truck,
    ShoppingBag,
    Users,
    Megaphone,
    Calendar,
    Tag,
    User,
    Layers,
    CheckSquare,
    Square,
    Clock,
    Save,
    History as HistoryIcon,
    X
} from 'lucide-react';
import { ExpenseCategory, Vendor, ExpenseTransaction, Account, UserRole, AccountType, ExpenseTemplate } from '../types';
import { toCents } from '../utils';

interface Props {
    role: UserRole;
    accounts: Account[];
    currentUser: { name: string; id: string };
    categories: ExpenseCategory[];
    vendors: Vendor[];
    onSaveExpense: (expense: ExpenseTransaction) => Promise<void>;
    onSaveCategory: (category: ExpenseCategory) => Promise<void>;
    onSaveVendor: (vendor: Vendor) => Promise<void>;
    onSaveAccount: (account: Account) => Promise<void>;
    onAddLedgerEntry: (entry: any) => Promise<void>;
    onSaveTemplate?: (template: ExpenseTemplate) => Promise<void>;
    onSuccess?: () => void;
    onCancel?: () => void;
    lockSourceAccountId?: string;
    initialData?: any;
}

const ExpenseEntryForm: React.FC<Props> = ({
    role,
    accounts,
    currentUser,
    categories,
    vendors,
    onSaveExpense,
    onSaveCategory,
    onSaveVendor,
    onSaveAccount,
    onAddLedgerEntry,
    onSaveTemplate,
    onSuccess,
    onCancel,
    lockSourceAccountId,
    initialData
}) => {
    const [formData, setFormData] = useState({
        date: initialData?.date || new Date().toISOString().split('T')[0],
        amount: initialData?.amount || '',
        mainCategoryId: initialData?.mainCategoryId || 'ops',
        subcategory: initialData?.subcategory || '',
        newSubcategory: '',
        vendorId: initialData?.vendorId || '',
        newVendorName: '',
        sourceAccountId: lockSourceAccountId || initialData?.sourceAccountId || accounts.find(a => a.type === AccountType.PETTY_CASH)?.id || accounts[0]?.id || '',
        receivesStock: initialData?.receivesStock || false,
        isRecurring: initialData?.isRecurring || false,
        recurringFrequency: initialData?.recurringFrequency || 'Monthly' as any,
        details: initialData?.details || ''
    });
    const [isSaveTemplateInputVisible, setIsSaveTemplateInputVisible] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

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
            await onSaveExpense(newTx);

            // 2. Update Account Balance
            await onSaveAccount({
                ...sourceAcc,
                currentBalance: sourceAcc.currentBalance - amountCents
            });

            // 3. Create Ledger Entry
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

            if (onSuccess) onSuccess();

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
        if (!onSaveTemplate) return;

        if (!formData.amount) {
            alert("Please enter an amount first.");
            return;
        }

        if (!isSaveTemplateInputVisible) {
            setIsSaveTemplateInputVisible(true);
            return;
        }

        const name = templateName.trim();
        if (!name) {
            alert("Please enter a name for the template.");
            return;
        }

        setIsSavingTemplate(true);
        const mainCat = categories.find(c => c.id === formData.mainCategoryId);
        const template: ExpenseTemplate = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            amount: toCents(formData.amount),
            mainCategory: mainCat?.name || 'Uncategorized',
            subcategory: formData.newSubcategory || formData.subcategory || '',
            vendorId: formData.vendorId || '',
            vendorName: vendors.find(v => v.id === formData.vendorId)?.name || formData.newVendorName || '',
            sourceAccountId: formData.sourceAccountId,
            receivesStock: formData.receivesStock,
            details: formData.details || ''
        };

        try {
            await onSaveTemplate(template);
            alert(`Template "${name}" saved successfully!`);
            setIsSaveTemplateInputVisible(false);
            setTemplateName('');
        } catch (error) {
            console.error("Error saving template:", error);
            alert(`Failed to save template: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSavingTemplate(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass p-10 rounded-[3rem] space-y-10 border-indigo-500/20 relative">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="absolute top-8 right-8 p-2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                )}
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
                        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
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
                        {lockSourceAccountId ? (
                            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-6 py-6 text-white font-bold flex items-center gap-3">
                                <Layers className="text-indigo-400" size={20} />
                                <span>{accounts.find(a => a.id === lockSourceAccountId)?.name || 'Locked Account'}</span>
                            </div>
                        ) : (
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
                                </select>
                            </div>
                        )}
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

                <div className="flex flex-col gap-4">
                    {isSaveTemplateInputVisible && (
                        <div className="flex flex-col gap-3 p-6 bg-slate-900 border border-slate-800 rounded-3xl animate-in slide-in-from-bottom-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Template Name</label>
                            <div className="flex gap-4">
                                <input
                                    autoFocus
                                    type="text"
                                    value={templateName}
                                    onChange={e => setTemplateName(e.target.value)}
                                    placeholder="Enter template name..."
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                                    onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                                />
                                <button
                                    onClick={() => setIsSaveTemplateInputVisible(false)}
                                    className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-2xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-4">
                        <button
                            onClick={handleAddTransaction}
                            className="flex-[2] flex items-center justify-center gap-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black py-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 transition-all text-xl uppercase tracking-widest"
                        >
                            <Save size={28} /> Post Expense
                        </button>
                        {onSaveTemplate && (
                            <button
                                disabled={isSavingTemplate}
                                onClick={handleSaveTemplate}
                                className={`flex-1 flex items-center justify-center gap-3 ${isSaveTemplateInputVisible ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'} font-black py-8 rounded-[2.5rem] transition-all text-sm uppercase tracking-widest disabled:opacity-50`}
                            >
                                <HistoryIcon size={20} className={isSavingTemplate ? "animate-spin" : ""} />
                                {isSavingTemplate ? "Saving..." : isSaveTemplateInputVisible ? "Confirm Save" : "Save as Template"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseEntryForm;
