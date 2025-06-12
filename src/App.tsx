import React from 'react';
import DashboardLayout from './components/layout/DashboardLayout';
import SpendOverview from './components/dashboard/SpendOverview';
import ServiceBreakdown from './components/dashboard/ServiceBreakdown';
import TrendAnalysis from './components/dashboard/TrendAnalysis';
import CostAllocation from './components/dashboard/CostAllocation';
import UsageMetrics from './components/dashboard/UsageMetrics';
import { OpenAIUsage } from './components/services/OpenAIUsage';
import { AWSCostUsage } from './components/services/AWSCostUsage';
import { VercelCostUsage } from './components/services/VercelCostUsage';
import { AnthropicUsage } from './components/services/AnthropicUsage';
import { CohereUsage } from './components/services/CohereUsage';
import { GeminiUsage } from './components/services/GeminiUsage';
import { FilterProvider } from './context/FilterContext';
import { ThemeProvider } from './context/ThemeContext';
import { OpenAIProvider } from './context/OpenAIContext';
import { VercelCostProvider } from './context/VercelCostContext';
import { AnthropicCostProvider } from './context/AnthropicCostContext';
import { CohereCostProvider } from './context/CohereCostContext';
import { GeminiCostProvider } from './context/GeminiCostContext';

function App() {
  return (
    <ThemeProvider>
      <FilterProvider>
        <OpenAIProvider>
          <VercelCostProvider>
            <AnthropicCostProvider>
              <CohereCostProvider>
                <GeminiCostProvider>
                  <DashboardLayout>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <SpendOverview />
                      <ServiceBreakdown />
                    </div>
                    
                    <TrendAnalysis />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <CostAllocation />
                      <UsageMetrics />
                    </div>

                    <div className="mt-8">
                      <h2 className="text-2xl font-bold mb-6">Service Usage & Costs</h2>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <OpenAIUsage />
                        <AWSCostUsage />
                        <VercelCostUsage />
                        <AnthropicUsage />
                        <CohereUsage />
                        <GeminiUsage />
                      </div>
                    </div>
                  </DashboardLayout>
                </GeminiCostProvider>
              </CohereCostProvider>
            </AnthropicCostProvider>
          </VercelCostProvider>
        </OpenAIProvider>
      </FilterProvider>
    </ThemeProvider>
  );
}

export default App;