
export enum AccountType {
  PETTY_CASH = 'Petty cash',
  INCOME = 'Income',
  RECEIVABLE = 'Receivable',
  PAYABLE = 'Payable',
  ASSETS = 'Assets',
  PARTNER_RECEIVABLE = 'Partner Receivable'
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  startingBalance: number; // Stored as integer (cents)
  currentBalance: number; // Stored as integer (cents)
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  basicSalary: number; // integer cents
  loanBalance: number; // integer cents
  advances: number; // integer cents
  leaves: number; // current cycle 15th-15th
  color: string; // For calendar visualization
}

export interface AttendanceRecord {
  employeeId: string;
  date: string; // ISO format
}

export interface Customer {
  id: string;
  name: string;
  outstandingBalance: number; // integer cents
}

export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
}

export interface DailyOpsConfig {
  incomeAccountId: string;
  cardAccountId: string;
  partnerAccountId: string;
  foreignCurrencyAccountId: string;
  customerReceivableAccountId: string;
}

export interface SettlementConfig {
  partnerSalesRecAccId: string;
  settlementCardAccId: string;
  autoFeeAccIds: string[];
  partnerNameLabel: string; // e.g. "Hiking Bar"
}

export interface Vendor {
  id: string;
  name: string;
  contact?: string;
  payableBalance: number; // cents
}

export interface ReceivableTransaction {
  id: string;
  date: string;
  source: string; // Partner Name or Card Type
  amount: number; // cents
  status: 'Pending' | 'Settled';
  accountId: string;
}

export interface PayableBill {
  id: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
  frequency?: string;
  status: 'Pending' | 'Paid';
}

export interface ExpenseCategory {
  id: string;
  name: string;
  subcategories: string[];
}

export interface ExpenseTransaction {
  id: string;
  date: string;
  amount: number; // cents
  mainCategory: string;
  subcategory?: string;
  vendorId?: string;
  vendorName?: string; // For on-the-fly
  sourceAccountId: string;
  isPendingPayable: boolean;
  receivesStock: boolean;
  isRecurring: boolean;
  recurringFrequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly';
  details: string;
  user: string;
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  amount: number;
  mainCategory: string;
  subcategory?: string;
  vendorId?: string;
  vendorName?: string;
  sourceAccountId: string;
  receivesStock: boolean;
  details: string;
}

export interface DailyOpsSession {
  id: string;
  date: string;
  closedAt: string;
  openingBalance: number;
  grossSales: number;
  cardSales: number;
  partnerSales: number;
  customerCredit: number;
  expenses: number;
  moneyAdded: number;
  foreignCurrency: number;
  fcNote?: string;
  theoreticalCash: number;
  physicalCount: number;
  variance: number;
  user: string;
}

export type ViewType =
  | 'dashboard'
  | 'money-lab'
  | 'daily-ops'
  | 'staff-hub'
  | 'expenses'
  | 'settlement'
  | 'reports'
  | 'settings';
