import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

import { securityAlertsData } from './data/mockData';

export default function App() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        alertCount={securityAlertsData.length}
      />

      {/* Main Dashboard Display */}
      <Dashboard
        activeSection={activeSection}
        onSelectSection={setActiveSection}
      />
    </div>
  );
}
