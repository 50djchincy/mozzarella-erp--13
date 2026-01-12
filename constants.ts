import { ExpenseCategory } from './types';

export const defaultCategories: ExpenseCategory[] = [
    { id: 'ops', name: 'Operational', subcategories: ['Utility', 'Rent', 'Repairs'] },
    { id: 'goods', name: 'Ingredients and goods to be sold', subcategories: ['Vegetables', 'Meat', 'Dairy', 'Packaging'] },
    { id: 'staff', name: 'Staff', subcategories: ['Meals', 'Uniforms', 'Training'] },
    { id: 'marketing', name: 'Marketing', subcategories: ['Social Media', 'Flyers', 'Events'] },
];
