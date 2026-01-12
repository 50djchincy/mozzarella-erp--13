import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Zap, Send } from 'lucide-react';
import { ExpenseTemplate } from '../types';
import { formatCurrency } from '../utils';

interface Props {
    templates: ExpenseTemplate[];
    onApply: (template: ExpenseTemplate) => void;
    onQuickPost?: (template: ExpenseTemplate, amount: number) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    isAdmin?: boolean;
}

const QuickExpenses: React.FC<Props> = ({ templates, onApply, onQuickPost, onDelete, isAdmin }) => {
    const [amounts, setAmounts] = useState<{ [key: string]: string }>({});
    const [isPosting, setIsPosting] = useState<{ [key: string]: boolean }>({});

    // Initialize amounts from templates
    useEffect(() => {
        const initialAmounts: { [key: string]: string } = {};
        templates.forEach(t => {
            if (amounts[t.id] === undefined) {
                initialAmounts[t.id] = (t.amount / 100).toString();
            }
        });
        if (Object.keys(initialAmounts).length > 0) {
            setAmounts(prev => ({ ...prev, ...initialAmounts }));
        }
    }, [templates]);

    const handleQuickPost = async (tmp: ExpenseTemplate) => {
        if (!onQuickPost) return;
        const amountStr = amounts[tmp.id];
        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            alert("Please enter a valid amount.");
            return;
        }

        setIsPosting(prev => ({ ...prev, [tmp.id]: true }));
        try {
            await onQuickPost(tmp, amount);
        } catch (error) {
            console.error("Error in quick post:", error);
        } finally {
            setIsPosting(prev => ({ ...prev, [tmp.id]: false }));
        }
    };

    if (templates.length === 0) {
        return (
            <div className="py-20 text-center glass rounded-[3rem] border-dashed border-2 border-slate-800">
                <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-700">
                    <Zap size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No Templates Found</h3>
                <p className="text-slate-500 max-w-xs mx-auto">Create templates in the "New Entry" tab to speed up your daily records.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {templates.map(tmp => (
                <div key={tmp.id} className="glass p-8 rounded-[2.5rem] border-l-4 border-l-indigo-500 hover:border-indigo-500/50 transition-all group relative">
                    {isAdmin && onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Delete this template?')) onDelete(tmp.id);
                            }}
                            className="absolute top-6 right-6 p-2 text-slate-700 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <h4 className="text-xl font-black text-white leading-tight">{tmp.name}</h4>
                            <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{tmp.mainCategory} / {tmp.subcategory}</p>
                        </div>

                        <div className="py-4 border-y border-slate-800/50 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase">Saved Vendor</span>
                                <span className="text-xs font-black text-slate-300 truncate max-w-[120px]">{tmp.vendorName || 'N/A'}</span>
                            </div>
                            <div className="relative mt-2">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                                <input
                                    type="number"
                                    value={amounts[tmp.id] || ''}
                                    onChange={e => setAmounts({ ...amounts, [tmp.id]: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white font-black text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {onQuickPost && (
                                <button
                                    onClick={() => handleQuickPost(tmp)}
                                    disabled={isPosting[tmp.id]}
                                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] disabled:opacity-50"
                                >
                                    <Send size={14} className={isPosting[tmp.id] ? "animate-spin" : ""} />
                                    {isPosting[tmp.id] ? "Posting..." : "Quick Post"}
                                </button>
                            )}
                            <button
                                onClick={() => onApply(tmp)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                                title="Open in full form"
                            >
                                <Plus size={14} /> Full
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuickExpenses;
