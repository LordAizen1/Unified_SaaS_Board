import { addDays, format, subDays, subMonths } from 'date-fns';
import { 
  Category, 
  Environment, 
  Expense, 
  Project, 
  Service, 
  Team 
} from '../types';

// Generate mock categories
export const categories: Category[] = [
  { id: 'cat-1', name: 'Cloud Infrastructure', color: '#3B82F6' },
  { id: 'cat-2', name: 'AI/ML Services', color: '#10B981' },
  { id: 'cat-3', name: 'Observability', color: '#8B5CF6' },
];

// Generate mock services
export const services: Service[] = [
  { id: 'aws', name: 'AWS', categoryId: 'cat-1' },
  { id: 'gcp', name: 'Google Cloud', categoryId: 'cat-1' },
  { id: 'anthropic', name: 'Anthropic', categoryId: 'cat-2' },
  { id: 'openai', name: 'OpenAI', categoryId: 'cat-2' },
  { id: 'datadog', name: 'Datadog', categoryId: 'cat-3' },
];

// Generate mock teams
export const teams: Team[] = [
  { id: 'team-1', name: 'Engineering' },
  { id: 'team-2', name: 'Data Science' },
  { id: 'team-3', name: 'Platform' },
];

// Generate mock projects
export const projects: Project[] = [
  { id: 'proj-1', name: 'Core Platform', teamId: 'team-1' },
  { id: 'proj-2', name: 'AI Services', teamId: 'team-2' },
  { id: 'proj-3', name: 'Infrastructure', teamId: 'team-3' },
];

// Tags pool
const tags = [
  'production', 'development', 'testing', 'internal', 'external',
  'customer-facing', 'backend', 'frontend', 'data', 'api', 'auth',
  'storage', 'compute', 'serverless', 'managed-service', 'legacy'
];

// Usage metrics types
const metricTypes = [
  'api-calls', 'storage-gb', 'compute-hours', 'requests',
  'bandwidth-gb', 'transactions', 'users', 'data-processed-gb'
];

// Environments
const environments: Environment[] = ['dev', 'staging', 'prod'];

// Helper to generate random number within range
const randomNumber = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

// Helper to select random item from array
const randomItem = <T>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

// Helper to select random items from array
const randomItems = <T>(items: T[], count: number): T[] => {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate expenses for the last 180 days
export const generateExpenses = (count: number = 500): Expense[] => {
  const expenses: Expense[] = [];
  const today = new Date();
  const startDate = subDays(today, 180);

  for (let i = 0; i < count; i++) {
    const daysAgo = randomNumber(0, 180);
    const date = subDays(today, daysAgo);
    const service = randomItem(services);
    const category = categories.find(c => c.id === service.categoryId)!;
    const team = randomItem(teams);
    const teamProjects = projects.filter(p => p.teamId === team.id);
    const project = randomItem(teamProjects);
    const environment = randomItem(environments);
    
    // Higher amounts for production, lower for dev
    const baseAmount = randomNumber(100, 1000);
    const multiplier = environment === 'prod' ? 3 : environment === 'staging' ? 1.5 : 1;
    
    const expense: Expense = {
      id: `expense-${i}`,
      timestamp: date.toISOString(),
      amount: parseFloat((baseAmount * multiplier).toFixed(2)),
      serviceId: service.id,
      serviceName: service.name,
      categoryId: category.id,
      categoryName: category.name,
      teamId: team.id,
      teamName: team.name,
      projectId: project.id,
      projectName: project.name,
      environment,
      tags: randomItems(tags, randomNumber(1, 4)),
      usageMetrics: [
        {
          type: randomItem(metricTypes),
          value: randomNumber(10, 10000)
        }
      ]
    };
    
    expenses.push(expense);
  }
  
  return expenses;
};

// Generate monthly expenses for trend analysis
export const generateMonthlyTrends = () => {
  const months = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const month = subMonths(today, i);
    const monthName = format(month, 'MMM yyyy');
    const monthExpenses = {
      month: monthName,
      total: 0,
      byCategory: {} as Record<string, number>
    };
    
    // Initialize categories
    categories.forEach(category => {
      monthExpenses.byCategory[category.id] = 0;
    });
    
    // Generate random amounts for each category
    categories.forEach(category => {
      // Simulate growing trend
      const growthFactor = 1 + (6 - i) * 0.1;
      const amount = randomNumber(1000, 5000) * growthFactor;
      monthExpenses.byCategory[category.id] = parseFloat(amount.toFixed(2));
      monthExpenses.total += amount;
    });
    
    monthExpenses.total = parseFloat(monthExpenses.total.toFixed(2));
    months.push(monthExpenses);
  }
  
  return months;
};

// Generate mock data for export
export const mockData = {
  expenses: [
    {
      id: '1',
      timestamp: '2024-03-01T00:00:00Z',
      amount: 2500.00,
      serviceId: 'aws',
      serviceName: 'AWS',
      categoryId: 'cat-1',
      categoryName: 'Cloud Infrastructure',
      teamId: 'team-1',
      teamName: 'Engineering',
      projectId: 'proj-1',
      projectName: 'Core Platform',
      environment: 'prod' as Environment,
      tags: ['production', 'compute', 'storage'],
      usageMetrics: [
        { type: 'compute-hours', value: 720, unit: 'hours' },
        { type: 'storage-gb', value: 500, unit: 'GB' }
      ]
    },
    {
      id: '2',
      timestamp: '2024-03-01T00:00:00Z',
      amount: 1800.00,
      serviceId: 'gcp',
      serviceName: 'Google Cloud',
      categoryId: 'cat-1',
      categoryName: 'Cloud Infrastructure',
      teamId: 'team-1',
      teamName: 'Engineering',
      projectId: 'proj-1',
      projectName: 'Core Platform',
      environment: 'prod' as Environment,
      tags: ['production', 'compute', 'storage'],
      usageMetrics: [
        { type: 'compute-hours', value: 600, unit: 'hours' },
        { type: 'storage-gb', value: 300, unit: 'GB' }
      ]
    },
    {
      id: '3',
      timestamp: '2024-03-01T00:00:00Z',
      amount: 1200.00,
      serviceId: 'anthropic',
      serviceName: 'Anthropic',
      categoryId: 'cat-2',
      categoryName: 'AI/ML Services',
      teamId: 'team-2',
      teamName: 'Data Science',
      projectId: 'proj-2',
      projectName: 'AI Services',
      environment: 'prod' as Environment,
      tags: ['production', 'ai', 'ml'],
      usageMetrics: [
        { type: 'api-calls', value: 50000, unit: 'calls' },
        { type: 'tokens', value: 1000000, unit: 'tokens' }
      ]
    },
    {
      id: '4',
      timestamp: '2024-03-01T00:00:00Z',
      amount: 1500.00,
      serviceId: 'openai',
      serviceName: 'OpenAI',
      categoryId: 'cat-2',
      categoryName: 'AI/ML Services',
      teamId: 'team-2',
      teamName: 'Data Science',
      projectId: 'proj-2',
      projectName: 'AI Services',
      environment: 'prod' as Environment,
      tags: ['production', 'ai', 'ml'],
      usageMetrics: [
        { type: 'api-calls', value: 75000, unit: 'calls' },
        { type: 'tokens', value: 1500000, unit: 'tokens' }
      ]
    },
    {
      id: '5',
      timestamp: '2024-03-01T00:00:00Z',
      amount: 800.00,
      serviceId: 'datadog',
      serviceName: 'Datadog',
      categoryId: 'cat-3',
      categoryName: 'Observability',
      teamId: 'team-3',
      teamName: 'Platform',
      projectId: 'proj-3',
      projectName: 'Infrastructure',
      environment: 'prod' as Environment,
      tags: ['production', 'monitoring', 'observability'],
      usageMetrics: [
        { type: 'hosts-monitored', value: 50, unit: 'hosts' },
        { type: 'custom-metrics', value: 1000, unit: 'metrics' }
      ]
    }
  ],
  categories,
  services,
  teams,
  projects,
  monthlyTrends: generateMonthlyTrends()
};

export default mockData;