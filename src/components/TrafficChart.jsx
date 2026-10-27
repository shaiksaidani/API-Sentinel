import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Custom dark mode tooltip for Recharts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: '#172033',
        border: '1px solid #23304B',
        borderRadius: '6px',
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        fontSize: '0.8rem',
        color: '#F8FAFC'
      }}>
        <div style={{ fontWeight: 700, marginBottom: '6px', color: '#93C5FD' }}>
          Time: {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <strong style={{ fontFamily: 'var(--font-mono)' }}>{entry.value} reqs</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function TrafficChart({ 
  trafficData = [], 
  methods = [], 
  alertCategories = [] 
}) {
  const totalMethodCount = methods.reduce((acc, curr) => acc + (curr.count || 0), 0) || 1;

  return (
    <div className="analytics-grid" id="analytics-section">
      {/* Primary Traffic Volume Over Time */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3>API Request Volume Over Time</h3>
            <p>Simulated traffic trends showing documented vs. candidate pathways</p>
          </div>
        </div>

        <div className="chart-body" style={{ width: '100%', height: 280 }}>
          {trafficData && trafficData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="shadowColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="flaggedColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748B" 
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={{ stroke: '#23304B' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  axisLine={{ stroke: '#23304B' }}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: '0.78rem', paddingTop: '10px' }}
                  iconType="circle"
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Total Traffic" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#totalColor)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="shadow" 
                  name="Shadow Candidates" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#shadowColor)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="flagged" 
                  name="Flagged / Suspicious" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#flaggedColor)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              No telemetry data recorded in current mock buffer.
            </div>
          )}
        </div>
      </div>

      {/* HTTP Method Breakdown & Distribution */}
      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3>HTTP Methods</h3>
            <p>Traffic distribution by verb</p>
          </div>
        </div>

        <div className="method-distribution-list">
          {methods && methods.length > 0 ? (
            methods.map((m) => {
              const displayPct = m.percentage || `${Math.round(((m.count || 0) / totalMethodCount) * 100)}%`;
              return (
                <div key={m.method} className="method-bar-row">
                  <div className="method-bar-info">
                    <span className="method-bar-name">{m.method}</span>
                    <span className="method-bar-val">{m.count} ({displayPct})</span>
                  </div>
                  <div className="method-progress-track">
                    <div 
                      className="method-progress-fill"
                      style={{ 
                        width: displayPct, 
                        backgroundColor: m.color 
                      }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No method distribution available.
            </div>
          )}
        </div>

        {/* Security Alert Breakdown Summary */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Alert Categories (Mock)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertCategories && alertCategories.length > 0 ? (
              alertCategories.map((c) => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.name}:</span>
                  <strong style={{ color: c.color, fontFamily: 'var(--font-mono)' }}>{c.count}</strong>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No alerts registered.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
