
import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CreditCard,
  Calendar as CalendarIcon,
  UserCircle,
  X,
  Lock,
  ArrowRight,
  TrendingUp,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Employee, UserRole, Account, AccountType } from '../types';
import { formatCurrency, toCents } from '../utils';

interface Props {
  role: UserRole;
  accounts: Account[];
}

const StaffHubView: React.FC<Props> = ({ role, accounts }) => {
  const isAdmin = role === UserRole.ADMIN;
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'payroll'>('directory');

  // Staff State
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<{ empId: string, date: string }[]>([]);

  // Modals
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [payrollAction, setPayrollAction] = useState<{ type: 'salary' | 'advance' | 'loan' | 'sc', emp: Employee } | null>(null);

  // New Staff Wizard State
  const [newStaff, setNewStaff] = useState({ name: '', role: '', salary: '', initialLoan: '' });

  // Payroll Modal Form State
  const [payrollFormData, setPayrollFormData] = useState({ amount: '', loanRepay: '', sourceAccount: accounts[0]?.id || '' });

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.role) return;
    const colors = ['#A78BFA', '#F87171', '#EF4444', '#FBBF24', '#34D399', '#60A5FA'];
    const emp: Employee = {
      id: Math.random().toString(36).substr(2, 9),
      name: newStaff.name,
      position: newStaff.role,
      basicSalary: toCents(newStaff.salary),
      loanBalance: toCents(newStaff.initialLoan),
      advances: 0,
      leaves: 0,
      color: colors[employees.length % colors.length]
    };
    setEmployees([...employees, emp]);
    setIsAddStaffModalOpen(false);
    setNewStaff({ name: '', role: '', salary: '', initialLoan: '' });
  };

  const handlePayrollSubmit = () => {
    if (!payrollAction) return;
    setPayrollAction(null);
    setPayrollFormData({ amount: '', loanRepay: '', sourceAccount: accounts[0]?.id || '' });
  };

  const toggleHoliday = (date: string) => {
    if (!selectedStaffId) return;
    const exists = attendanceRecords.some(r => r.empId === selectedStaffId && r.date === date);
    if (exists) {
      setAttendanceRecords(attendanceRecords.filter(r => !(r.empId === selectedStaffId && r.date === date)));
    } else {
      setAttendanceRecords([...attendanceRecords, { empId: selectedStaffId, date }]);
    }
  };

  const currentCycleRange = "15 DEC - 14 JAN";

  const calendarDays = useMemo(() => {
    const days = [];
    const baseDate = new Date(2025, 11, 15); // Dec 15
    for (let i = 0; i < 31; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const totalLoansOutstanding = employees.reduce((acc, e) => acc + e.loanBalance, 0);
  const totalAdvancesBooked = employees.reduce((acc, e) => acc + e.advances, 0);

  const renderDirectory = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="glass px-4 py-2 rounded-xl flex items-center gap-3">
          <CalendarIcon size={16} className="text-indigo-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cycle: {currentCycleRange}</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus size={20} /> Add Employee
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {employees.map(emp => (
          <div key={emp.id} className="glass rounded-[2.5rem] p-8 hover:border-indigo-500/50 transition-all duration-300 group">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-white text-2xl font-black shadow-lg" style={{ backgroundColor: emp.color }}>
                {emp.name[0]}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white leading-tight">{emp.name}</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800">{emp.position}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-slate-800/50">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Basic Salary</span>
                <span className="text-lg font-black text-slate-100">{formatCurrency(emp.basicSalary)}</span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-slate-800/50">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Loan Balance</span>
                <span className="text-lg font-black text-rose-400">{formatCurrency(emp.loanBalance)}</span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Leaves (Cycle)</span>
                <span className="text-lg font-black text-indigo-400">{emp.leaves} Days</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 glass p-8 rounded-[2.5rem] h-fit space-y-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-indigo-400" />
          <h3 className="text-xl font-black text-white">Roster</h3>
        </div>
        <p className="text-xs font-bold text-slate-400 leading-relaxed">Select a staff member to toggle holidays on the cycle calendar.</p>

        <div className="space-y-2">
          {employees.map(emp => (
            <button
              key={emp.id}
              onClick={() => setSelectedStaffId(emp.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${selectedStaffId === emp.id ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-slate-900/30 border-transparent hover:bg-slate-800'
                }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: emp.color }}>
                {emp.name[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-black text-slate-100">{emp.name}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{emp.position}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Other Staff Off</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Selected Staff Off</span>
          </div>
        </div>
      </div>

      <div className="lg:col-span-3 glass p-10 rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-3xl font-black text-white">Attendance Overview</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Cycle Ending January 2026</p>
          </div>
          <div className="flex items-center gap-6 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
            <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><ChevronLeft size={20} className="text-slate-400" /></button>
            <span className="text-xs font-black uppercase tracking-widest text-white">{currentCycleRange}</span>
            <button className="p-2 hover:bg-slate-800 rounded-xl transition-colors"><ChevronRight size={20} className="text-slate-400" /></button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="text-center text-[10px] font-black text-slate-500 tracking-widest pb-4">{day}</div>
          ))}
          {calendarDays.map((date, idx) => {
            const dayNum = new Date(date).getDate();
            const dayStaffRecords = attendanceRecords.filter(r => r.date === date);
            const isSelectedStaffOff = dayStaffRecords.some(r => r.empId === selectedStaffId);

            return (
              <div
                key={idx}
                onClick={() => toggleHoliday(date)}
                className={`relative h-24 rounded-3xl border transition-all hover:border-indigo-500/50 group flex flex-col items-center justify-center gap-2 ${isSelectedStaffOff ? 'bg-indigo-600/10 border-indigo-500/30 shadow-inner' : 'bg-slate-900/30 border-slate-800/50'
                  }`}
              >
                <span className={`text-xs font-black ${isSelectedStaffOff ? 'text-indigo-400' : 'text-slate-500'}`}>{dayNum}</span>
                <div className="flex flex-wrap gap-1 justify-center px-1">
                  {dayStaffRecords.map(r => (
                    <div
                      key={r.empId}
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-black"
                      style={{ backgroundColor: employees.find(e => e.id === r.empId)?.color }}
                    >
                      {employees.find(e => e.id === r.empId)?.name[0]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPayroll = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 glass p-10 rounded-[2.5rem]">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-emerald-600/10 text-emerald-400 rounded-2xl">
            <Wallet size={24} />
          </div>
          <h3 className="text-3xl font-black text-white">Payroll Center</h3>
        </div>

        <div className="space-y-4">
          {employees.map(emp => (
            <div key={emp.id} className="bg-slate-900/30 p-6 rounded-[2rem] border border-slate-800/50 flex flex-col md:flex-row items-center gap-6 group hover:bg-slate-800 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-md" style={{ backgroundColor: emp.color }}>
                  {emp.name[0]}
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">{emp.name}</h4>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{emp.position}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setPayrollAction({ type: 'advance', emp })}
                  className="px-4 py-2.5 bg-amber-600/10 text-amber-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/20 hover:bg-amber-600/20 transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Advance
                </button>
                <button
                  onClick={() => setPayrollAction({ type: 'loan', emp })}
                  className="px-4 py-2.5 bg-rose-600/10 text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-600/20 transition-all flex items-center gap-2"
                >
                  <Landmark size={14} /> Loan
                </button>
                <button
                  onClick={() => setPayrollAction({ type: 'salary', emp })}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all"
                >
                  Pay Salary
                </button>
                <button
                  onClick={() => setPayrollAction({ type: 'sc', emp })}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all"
                >
                  Pay SC
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-1 space-y-8">
        <div className="glass p-8 rounded-[2.5rem] space-y-8">
          <div className="flex items-center gap-3 text-indigo-400">
            <TrendingUp size={24} />
            <h3 className="text-xl font-black text-white">Operational Intel</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Total Advances Booked</p>
              <h4 className="text-4xl font-black tracking-tighter text-white">{formatCurrency(totalAdvancesBooked)}</h4>
            </div>
            <div className="bg-rose-600/10 p-8 rounded-[2rem] border border-rose-500/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">Total Loans Outstanding</p>
              <h4 className="text-4xl font-black tracking-tighter text-rose-400">{formatCurrency(totalLoansOutstanding)}</h4>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg"><ShieldCheck size={18} /></div>
              <p className="text-xs font-bold text-slate-400 leading-relaxed">Advances are auto-deducted from monthly payouts.</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg"><CheckCircle2 size={18} /></div>
              <p className="text-xs font-bold text-slate-400 leading-relaxed">Loans track long-term debt separate from basic salary.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tight">Staff Hub</h2>
          <p className="text-sm font-bold text-slate-500">Employee directory, attendance & payroll lifecycle.</p>
        </div>
        <div className="flex gap-2 p-1.5 glass rounded-2xl self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'directory' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >Directory</button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >Attendance</button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'payroll' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >Payroll</button>
        </div>
      </div>

      {activeTab === 'directory' && renderDirectory()}
      {activeTab === 'attendance' && renderAttendance()}
      {activeTab === 'payroll' && renderPayroll()}

      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsAddStaffModalOpen(false)}></div>
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 pb-4 flex items-center justify-between">
              <h3 className="text-3xl font-black text-white">Add Employee</h3>
              <button onClick={() => setIsAddStaffModalOpen(false)} className="p-3 text-slate-500 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>
            <div className="p-10 pt-4 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Full Name</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-6 py-4 font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Job Role</label>
                <input
                  type="text"
                  value={newStaff.role}
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                  placeholder="e.g. Head Chef"
                  className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-6 py-4 font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Basic Salary</label>
                  <input
                    type="number"
                    value={newStaff.salary}
                    onChange={e => setNewStaff({ ...newStaff, salary: e.target.value })}
                    placeholder="55000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-6 py-4 font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Initial Loan</label>
                  <input
                    type="number"
                    value={newStaff.initialLoan}
                    onChange={e => setNewStaff({ ...newStaff, initialLoan: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-6 py-4 font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                onClick={handleAddStaff}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-500/20 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
              >
                Complete Profile <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {payrollAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setPayrollAction(null)}></div>
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-600/10 px-3 py-1 rounded-lg">Staff Action</span>
                <button onClick={() => setPayrollAction(null)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <h3 className="text-3xl font-black text-white capitalize">
                {payrollAction.type === 'sc' ? 'Pay Service Charge' :
                  payrollAction.type === 'salary' ? 'Monthly Payout' :
                    payrollAction.type === 'advance' ? 'Issue Advance' : 'Issue Loan'}
              </h3>
              <p className="text-sm font-bold text-slate-400 mt-2">Processing for <span className="text-white">{payrollAction.emp.name}</span></p>
            </div>

            <div className="p-10 pt-4 space-y-6">
              {payrollAction.type === 'salary' && (
                <div className="bg-slate-950 p-6 rounded-2xl flex justify-between items-center mb-4 border border-slate-800">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Scheduled Basic</span>
                  <span className="text-xl font-black text-white">{formatCurrency(payrollAction.emp.basicSalary)}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">
                  {payrollAction.type === 'salary' ? 'Final Payment Amount' :
                    payrollAction.type === 'sc' ? 'SC Entitlement % / Amount' : 'Amount to Issue'}
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={payrollFormData.amount}
                    onChange={e => setPayrollFormData({ ...payrollFormData, amount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] pl-10 pr-6 py-4 font-black text-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {(payrollAction.type === 'salary' || payrollAction.type === 'sc') && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Loan Repayment (Manual Deduction)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      placeholder="Amount to deduct"
                      value={payrollFormData.loanRepay}
                      onChange={e => setPayrollFormData({ ...payrollFormData, loanRepay: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] pl-10 pr-6 py-4 font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  {payrollAction.emp.loanBalance > 0 && (
                    <p className="text-[10px] font-bold text-rose-400 px-2">Total Outstanding: {formatCurrency(payrollAction.emp.loanBalance)}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-2">Source of Funds</label>
                <select
                  value={payrollFormData.sourceAccount}
                  onChange={e => setPayrollFormData({ ...payrollFormData, sourceAccount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] px-6 py-4 font-black text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id} className="bg-slate-900">{acc.name} ({formatCurrency(acc.currentBalance)})</option>
                  ))}
                </select>
              </div>

              {(payrollAction.type === 'salary' || payrollAction.type === 'sc') && payrollAction.emp.advances > 0 && (
                <div className="p-4 bg-amber-600/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
                  <TrendingUp className="text-amber-400" size={18} />
                  <p className="text-[10px] font-bold text-amber-500 leading-tight">
                    Pending advances of <span className="font-black underline">{formatCurrency(payrollAction.emp.advances)}</span> will be auto-deducted from this transaction.
                  </p>
                </div>
              )}

              <button
                onClick={handlePayrollSubmit}
                className="w-full bg-white text-slate-950 hover:bg-slate-100 font-black py-5 rounded-[1.5rem] shadow-xl shadow-white/5 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-3"
              >
                Execute Staff Transaction <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffHubView;
