import { Router, Route, Link } from 'wouter';
import Dashboard from './pages/Dashboard';
import Campaigns from './pages/Campaigns';
import Settings from './pages/Settings';

function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Calendar Automation</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/campaigns" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Campaigns
              </Link>
              <Link href="/settings" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Router>
          <Route path="/" component={Dashboard} />
          <Route path="/campaigns" component={Campaigns} />
          <Route path="/settings" component={Settings} />
        </Router>
      </main>
    </div>
  );
}

export default App;