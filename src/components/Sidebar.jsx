import React from 'react';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Layers, 
  BellRing, 
  Activity, 
  BookOpen, 
  Cpu
} from 'lucide-react';

export default function Sidebar({ activeSection, onSelectSection, alertCount = 5 }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'endpoints', label: 'API Endpoints', icon: Layers },
    { id: 'alerts', label: 'Security Alerts', icon: BellRing, badge: alertCount },
    { id: 'analytics', label: 'Traffic Analytics', icon: Activity },
    { id: 'docs', label: 'Documentation', icon: BookOpen },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <ShieldAlert size={22} />
        </div>
        <div className="brand-info">
          <span className="brand-title">API-Sentinel</span>
          <span className="brand-subtitle">Runtime BOLA & Shadow API</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectSection(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Box */}
      <div className="sidebar-footer">
        <div className="system-status-box">
          <div className="status-row">
            <span className="status-dot pulse"></span>
            <strong>Engine: Simulated</strong>
          </div>
          <div className="status-label">
            <Cpu size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
            Week 2 Frontend Prototype
          </div>
        </div>
      </div>
    </aside>
  );
}
