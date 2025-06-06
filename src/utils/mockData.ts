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
  { id: 'cat-1', name: 'Compute', color: '#3B82F6' },
  { id: 'cat-2', name: 'Storage', color: '#10B981' },
  { id: 'cat-3', name: 'Database', color: '#8B5CF6' },
  { id: 'cat-4', name: 'Networking', color: '#F59E0B' },
  { id: 'cat-5', name: 'Analytics', color: '#EC4899' },
  { id: 'cat-6', name: 'AI/ML', color: '#06B6D4' },
];

// Generate mock services
export const services: Service[] = [
  { id: 'svc-1', name: 'EC2 Instances', categoryId: 'cat-1' },
  { id: 'svc-2', name: 'Lambda Functions', categoryId: 'cat-1' },
  { id: 'svc-3', name: 'S3 Storage', categoryId: 'cat-2' },
  { id: 'svc-4', name: 'EBS Volumes', categoryId: 'cat-2' },
  { id: 'svc-5', name: 'RDS Instances', categoryId: 'cat-3' },
  { id: 'svc-6', name: 'DynamoDB', categoryId: 'cat-3' },
  { id: 'svc-7', name: 'API Gateway', categoryId: 'cat-4' },
  { id: 'svc-8', name: 'CloudFront', categoryId: 'cat-4' },
  { id: 'svc-9', name: 'Athena', categoryId: 'cat-5' },
  { id: 'svc-10', name: 'QuickSight', categoryId: 'cat-5' },
  { id: 'svc-11', name: 'SageMaker', categoryId: 'cat-6' },
  { id: 'svc-12', name: 'Rekognition', categoryId: 'cat-6' },
  { id: 'svc-13', name: 'OpenAI API', categoryId: 'cat-6' },
  { id: 'svc-14', name: 'Cursor AI', categoryId: 'cat-6' },
];

// Generate mock teams
export const teams: Team[] = [
  { id: 'team-1', name: 'Engineering' },
  { id: 'team-2', name: 'Marketing' },
  { id: 'team-3', name: 'Sales' },
  { id: 'team-4', name: 'Finance' },
  { id: 'team-5', name: 'Product' },
];

// Generate mock projects
export const projects: Project[] = [
  { id: 'proj-1', name: 'Web Platform', teamId: 'team-1' },
  { id: 'proj-2', name: 'Mobile App', teamId: 'team-1' },
  { id: 'proj-3', name: 'Data Pipeline', teamId: 'team-1' },
  { id: 'proj-4', name: 'Campaign Analytics', teamId: 'team-2' },
  { id: 'proj-5', name: 'Lead Generation', teamId: 'team-3' },
  { id: 'proj-6', name: 'Reporting System', teamId: 'team-4' },
  { id: 'proj-7', name: 'Customer Dashboard', teamId: 'team-5' },
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
    const baseAmount = randomNumber(5, 500);
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
  expenses: generateExpenses(),
  categories,
  services,
  teams,
  projects,
  monthlyTrends: generateMonthlyTrends()
};

export default mockData;