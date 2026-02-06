import { Link, useLocation } from 'react-router-dom';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100';
  };

  return (
    <nav className="bg-white shadow-md mb-6">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Retirement Planner
            </Link>
            <div className="flex space-x-4">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}
              >
                Dashboard
              </Link>
              <Link
                to="/accounts"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/accounts')}`}
              >
                Accounts
              </Link>
              <Link
                to="/portfolio"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/portfolio')}`}
              >
                Portfolio
              </Link>
              <Link
                to="/social-security"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/social-security')}`}
              >
                SS
              </Link>
              <Link
                to="/other-income"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/other-income')}`}
              >
                Income
              </Link>
              <Link
                to="/planned-spending"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/planned-spending')}`}
              >
                Spending
              </Link>
              <Link
                to="/tax"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/tax')}`}
              >
                Tax
              </Link>
              <Link
                to="/asset-projections"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/asset-projections')}`}
              >
                Projections
              </Link>
              <Link
                to="/scenario-modeling"
                className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/scenario-modeling')}`}
              >
                Scenarios
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
