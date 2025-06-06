import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns';
import { 
  CostAllocationNode, 
  Expense, 
  ExpenseByCategory, 
  ExpenseByService, 
  FilterState, 
  MonthlyExpense 
} from '../types';
import mockData from './mockData';

// Filter expenses based on filter state
export const filterExpenses = (
  expenses: Expense[],
  filters: FilterState
): Expense[] => {
  return expenses.filter(expense => {
    const expenseDate = new Date(expense.timestamp);
    const [startDate, endDate] = filters.dateRange;
    
    // Filter by date range
    if (expenseDate < startDate || expenseDate > endDate) {
      return false;
    }
    
    // Filter by categories
    if (filters.categories.length > 0 && !filters.categories.includes(expense.categoryId)) {
      return false;
    }
    
    // Filter by teams
    if (filters.teams.length > 0 && !filters.teams.includes(expense.teamId)) {
      return false;
    }
    
    // Filter by projects
    if (filters.projects.length > 0 && !filters.projects.includes(expense.projectId)) {
      return false;
    }
    
    // Filter by environments
    if (filters.environments.length > 0 && !filters.environments.includes(expense.environment)) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableFields = [
        expense.serviceName,
        expense.categoryName,
        expense.teamName,
        expense.projectName,
        ...expense.tags
      ];
      
      return searchableFields.some(field => 
        field.toLowerCase().includes(query)
      );
    }
    
    return true;
  });
};

// Calculate total expenses for a given period
export const calculateTotalExpenses = (
  expenses: Expense[],
  startDate: Date,
  endDate: Date
): number => {
  return expenses
    .filter(expense => {
      const date = new Date(expense.timestamp);
      return date >= startDate && date <= endDate;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
};

// Calculate month-over-month change
export const calculateMoMChange = (
  expenses: Expense[]
): { currentMonth: number; previousMonth: number; percentageChange: number } => {
  const today = new Date();
  const currentMonthStart = startOfMonth(today);
  const previousMonthStart = startOfMonth(subMonths(today, 1));
  const previousMonthEnd = subMonths(currentMonthStart, 1);
  
  const currentMonthTotal = calculateTotalExpenses(
    expenses,
    currentMonthStart,
    today
  );
  
  const previousMonthTotal = calculateTotalExpenses(
    expenses,
    previousMonthStart,
    previousMonthEnd
  );
  
  const percentageChange = previousMonthTotal !== 0
    ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
    : 0;
  
  return {
    currentMonth: parseFloat(currentMonthTotal.toFixed(2)),
    previousMonth: parseFloat(previousMonthTotal.toFixed(2)),
    percentageChange: parseFloat(percentageChange.toFixed(2))
  };
};

// Calculate expenses by category
export const calculateExpensesByCategory = (
  expenses: Expense[]
): ExpenseByCategory[] => {
  const categories = mockData.categories;
  const expensesByCategory: Record<string, number> = {};
  
  // Initialize categories with 0
  categories.forEach(category => {
    expensesByCategory[category.id] = 0;
  });
  
  // Sum expenses by category
  expenses.forEach(expense => {
    expensesByCategory[expense.categoryId] = 
      (expensesByCategory[expense.categoryId] || 0) + expense.amount;
  });
  
  // Convert to array and sort by amount (descending)
  return categories
    .map(category => ({
      categoryId: category.id,
      categoryName: category.name,
      amount: parseFloat(expensesByCategory[category.id].toFixed(2)),
      color: category.color
    }))
    .sort((a, b) => b.amount - a.amount);
};

// Calculate expenses by service
export const calculateExpensesByService = (
  expenses: Expense[],
  categoryId?: string
): ExpenseByService[] => {
  const expensesByService: Record<string, number> = {};
  
  // Filter by category if provided
  const filteredExpenses = categoryId
    ? expenses.filter(expense => expense.categoryId === categoryId)
    : expenses;
  
  // Sum expenses by service
  filteredExpenses.forEach(expense => {
    expensesByService[expense.serviceId] = 
      (expensesByService[expense.serviceId] || 0) + expense.amount;
  });
  
  // Convert to array, add service names, and sort by amount (descending)
  return Object.entries(expensesByService)
    .map(([serviceId, amount]) => {
      const service = mockData.services.find(s => s.id === serviceId);
      return {
        serviceId,
        serviceName: service?.name || 'Unknown Service',
        amount: parseFloat(amount.toFixed(2))
      };
    })
    .sort((a, b) => b.amount - a.amount);
};

// Generate monthly trend data
export const generateTrendData = (
  expenses: Expense[],
  months: number = 6
): MonthlyExpense[] => {
  const result: MonthlyExpense[] = [];
  const today = new Date();
  
  // Initialize result array with empty months
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const monthString = format(monthDate, 'MMM yyyy');
    
    result.push({
      month: monthString,
      total: 0,
      byCategory: {}
    });
  }
  
  // Group expenses by month and category
  expenses.forEach(expense => {
    const expenseDate = parseISO(expense.timestamp);
    const monthIndex = months - 1 - Math.floor(
      (today.getTime() - expenseDate.getTime()) / 
      (30 * 24 * 60 * 60 * 1000)
    );
    
    // Skip if outside our range
    if (monthIndex < 0 || monthIndex >= months) return;
    
    // Add to month total
    result[monthIndex].total += expense.amount;
    
    // Add to category within month
    result[monthIndex].byCategory[expense.categoryId] = 
      (result[monthIndex].byCategory[expense.categoryId] || 0) + 
      expense.amount;
  });
  
  // Round numbers for cleaner display
  result.forEach(month => {
    month.total = parseFloat(month.total.toFixed(2));
    Object.keys(month.byCategory).forEach(categoryId => {
      month.byCategory[categoryId] = parseFloat(
        month.byCategory[categoryId].toFixed(2)
      );
    });
  });
  
  return result;
};

// Generate treemap data for cost allocation
export const generateCostAllocationData = (
  expenses: Expense[]
): CostAllocationNode => {
  // Create root node
  const root: CostAllocationNode = {
    id: 'root',
    name: 'Total',
    value: 0,
    children: []
  };
  
  // Group by team
  const teamMap = new Map<string, CostAllocationNode>();
  
  expenses.forEach(expense => {
    root.value += expense.amount;
    
    // Add team if not exists
    if (!teamMap.has(expense.teamId)) {
      teamMap.set(expense.teamId, {
        id: expense.teamId,
        name: expense.teamName,
        value: 0,
        children: []
      });
    }
    
    const teamNode = teamMap.get(expense.teamId)!;
    teamNode.value += expense.amount;
    
    // Group by project within team
    let projectNode = teamNode.children?.find(
      child => child.id === expense.projectId
    );
    
    if (!projectNode) {
      projectNode = {
        id: expense.projectId,
        name: expense.projectName,
        value: 0,
        children: []
      };
      teamNode.children?.push(projectNode);
    }
    
    projectNode.value += expense.amount;
    
    // Group by category within project
    let categoryNode = projectNode.children?.find(
      child => child.id === expense.categoryId
    );
    
    if (!categoryNode) {
      categoryNode = {
        id: expense.categoryId,
        name: expense.categoryName,
        value: 0,
        children: []
      };
      projectNode.children?.push(categoryNode);
    }
    
    categoryNode.value += expense.amount;
    
    // Add service as leaf node
    let serviceNode = categoryNode.children?.find(
      child => child.id === expense.serviceId
    );
    
    if (!serviceNode) {
      serviceNode = {
        id: expense.serviceId,
        name: expense.serviceName,
        value: 0
      };
      categoryNode.children?.push(serviceNode);
    }
    
    serviceNode.value += expense.amount;
  });
  
  // Add team nodes to root
  root.children = Array.from(teamMap.values());
  
  // Round all values for cleaner display
  const roundValues = (node: CostAllocationNode) => {
    node.value = parseFloat(node.value.toFixed(2));
    if (node.children) {
      node.children.forEach(roundValues);
    }
  };
  
  roundValues(root);
  
  return root;
};

// Calculate unit economics (cost per usage metric)
export const calculateUnitEconomics = (expenses: Expense[]): Record<string, number> => {
  const metricTotals: Record<string, { cost: number; usage: number }> = {};
  
  expenses.forEach(expense => {
    expense.usageMetrics.forEach(metric => {
      if (!metricTotals[metric.type]) {
        metricTotals[metric.type] = { cost: 0, usage: 0 };
      }
      
      metricTotals[metric.type].cost += expense.amount;
      metricTotals[metric.type].usage += metric.value;
    });
  });
  
  const unitCosts: Record<string, number> = {};
  
  Object.entries(metricTotals).forEach(([metricType, totals]) => {
    unitCosts[metricType] = totals.usage > 0
      ? parseFloat((totals.cost / totals.usage).toFixed(6))
      : 0;
  });
  
  return unitCosts;
};