import React from 'react';
import { Activity, Layers, EyeOff, ShieldAlert } from 'lucide-react';

const iconMap = {
  Activity: Activity,
  Layers: Layers,
  EyeOff: EyeOff,
  ShieldAlert: ShieldAlert,
};

const iconClassMap = {
  neutral: 'stat-icon-blue',
  positive: 'stat-icon-green',
  warning: 'stat-icon-amber',
  critical: 'stat-icon-red',
};

export default function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  subtext, 
  iconName = 'Activity',
  badge 
}) {
  const IconComponent = iconMap[iconName] || Activity;
  const iconThemeClass = iconClassMap[changeType] || 'stat-icon-blue';

  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">{title}</span>
        <div className={`stat-icon-wrapper ${iconThemeClass}`}>
          <IconComponent size={20} />
        </div>
      </div>

      <div className="stat-value-group">
        <span className="stat-value">{value}</span>
        {badge && (
          <span className={`stat-badge ${changeType}`}>
            {badge}
          </span>
        )}
      </div>

      <div className="stat-subtext">
        {subtext}
      </div>
    </div>
  );
}
