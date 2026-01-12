import React from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { ExpenseTemplate } from '../types';
import { formatCurrency } from '../utils';

interface Props {
    templates: ExpenseTemplate[];
    onApply: (template: ExpenseTemplate) => void;
    onDelete?: (id: string) => Promise<void>;
    isAdmin?: boolean;
}

const QuickExpenses: React.FC<Props> = ({ templates, onApply, onDelete, isAdmin }) => {
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

                        <div className="py-4 border-y border-slate-800/50 flex items-center justify-between">
                            <span className="text-2xl font-black text-white">{formatCurrency(tmp.amount)}</span>
                            <div className="text-right">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Vendor</p>
                                <p className="text-xs font-black text-slate-300 truncate max-w-[120px]">{tmp.vendorName || 'N/A'}</p>
                            </div>
                        </div>

                        <button
                            onClick={() => onApply(tmp)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                            <Plus size={18} /> Use Template
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuickExpenses;
