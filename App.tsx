import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Waypoints,
  AreaChart,
  Network,
  Code,
  BookOpen,
  GitBranch,
  Menu,
  X,
} from 'lucide-react';
import { ShadowRouterSimulator } from './components/ShadowRouterSimulator';
import { UserCoords } from './types';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-8 text-white">
    <h1 className="text-3xl font-bold">{title}</h1>
    <p className="mt-4 text-zinc-400">This page is under construction.</p>
  </div>
);

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // Mock userCoords and onOpenLocationModal for now
  const [userCoords] = useState<UserCoords | null>(null);
  const handleOpenLocationModal = () => alert('Open location modal');

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/router', icon: Waypoints, label: 'Live 2.5D Router' },
    { path: '/uhi-analytics', icon: AreaChart, label: 'UHI Analytics' },
    { path: '/cooling-network', icon: Network, label: 'Cooling Network' },
    { path: '/api-sdk', icon: Code, label: 'API / SDK' },
    { path: '/research', icon: BookOpen, label: 'Mission / Research' },
    { path: '/developer', icon: GitBranch, label: 'Dev Console' },
  ];

  return (
    <Router>
      <div className="flex h-screen bg-[#070709] text-zinc-300">
        {/* Sidebar */}
        <nav
          className={`bg-[#0D0D12] border-r border-zinc-800 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-64' : 'w-20'
          } flex flex-col`}
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 h-16">
            {isSidebarOpen && <span className="text-xl font-bold text-white">Splinter</span>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-zinc-800">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          <ul className="flex-1 p-2 space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-zinc-800'
                    } ${!isSidebarOpen && 'justify-center'}`
                  }
                  title={item.label}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {isSidebarOpen && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<PlaceholderPage title="Home" />} />
            <Route
              path="/router"
              element={
                <ShadowRouterSimulator userCoords={userCoords} onOpenLocationModal={handleOpenLocationModal} />
              }
            />
            <Route path="/uhi-analytics" element={<PlaceholderPage title="UHI Analytics" />} />
            <Route path="/cooling-network" element={<PlaceholderPage title="Cooling Network" />} />
            <Route path="/api-sdk" element={<PlaceholderPage title="API / SDK" />} />
            <Route path="/research" element={<PlaceholderPage title="Mission / Research" />} />
            <Route path="/developer" element={<PlaceholderPage title="Developer Handoff Console" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;