export type Environment = 'dev' | 'staging' | 'prod';

export interface UsageMetric {
  type: string;
  value: number;
}

export interface Expense {
  id: string;
  timestamp: string;
  amount: number;
  serviceId: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  teamId: string;
  teamName: string;
  projectId: string;
  projectName: string;
  environment: Environment;
  tags: string[];
  usageMetrics: UsageMetric[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Service {
  id: string;
  name: string;
  categoryId: string;
}

export interface Team {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  teamId: string;
}

export interface FilterState {
  dateRange: [Date, Date];
  categories: string[];
  teams: string[];
  projects: string[];
  environments: Environment[];
  searchQuery: string;
}

export interface ThemeState {
  isDarkMode: boolean;
}

export interface ExpenseByCategory {
  categoryId: string;
  categoryName: string;
  amount: number;
  color: string;
}

export interface ExpenseByService {
  serviceId: string;
  serviceName: string;
  amount: number;
}

export interface MonthlyExpense {
  month: string;
  total: number;
  byCategory: {
    [categoryId: string]: number;
  };
}

export interface CostAllocationNode {
  id: string;
  name: string;
  value: number;
  children?: CostAllocationNode[];
}