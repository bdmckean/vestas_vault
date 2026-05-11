import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Navigation } from './components/Navigation';
import { AccountsPage } from './pages/AccountsPage';
import { AssetProjectionsPage } from './pages/AssetProjectionsPage';
import { DashboardPage } from './pages/DashboardPage';
import { OtherIncomePage } from './pages/OtherIncomePage';
import { PlannedSpendingPage } from './pages/PlannedSpendingPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { MonteCarloPage } from './pages/MonteCarloPage';
import { ScenarioModelingPage } from './pages/ScenarioModelingPage';
import { SocialSecurityPage } from './pages/SocialSecurityPage';
import { TaxPage } from './pages/TaxPage';
import { VisualizationsPage } from './pages/VisualizationsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-100">
          <Navigation />
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/social-security" element={<SocialSecurityPage />} />
            <Route path="/other-income" element={<OtherIncomePage />} />
            <Route path="/planned-spending" element={<PlannedSpendingPage />} />
            <Route path="/tax" element={<TaxPage />} />
            <Route path="/asset-projections" element={<AssetProjectionsPage />} />
            <Route path="/scenario-modeling" element={<ScenarioModelingPage />} />
            <Route path="/visualizations" element={<VisualizationsPage />} />
            <Route path="/monte-carlo" element={<MonteCarloPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
