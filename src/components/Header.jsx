import React from 'react';
import { Search, Calendar, AlertTriangle, Play, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';

export default function Header({
  searchQuery,
  onSearchChange,
  title = "Security Overview",
  subtitle = "Runtime API Security Monitoring",
  searchPlaceholder = "Search endpoints or alerts...",
  dataSourceMode = "DEMO",
  onToggleDataSourceMode,
  backendStatus = null,
  onRunParser = null,
  isParserRunning = false,
  onRefreshBackend = null,
  isRefreshing = false,
  lastRefreshedAt = null
}) {
  // Format current date cleanly (e.g., Oct 18, 2026)
  const today = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="header">
      {/* Title & Subtitle */}
      <div className="header-title-group">
        <h1 className="header-title">{title}</h1>
        <span className="header-subtitle">{subtitle}</span>
      </div>

      {/* Controls & Status */}
      <div className="header-controls">
        {/* Global Quick Search */}
        <div className="header-search">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Date Display */}
        <div className="header-date-badge">
          <Calendar size={14} />
          <span>{today}</span>
        </div>

        {/* Backend Actions & Live Badge (only visible in Backend mode) */}
        {dataSourceMode === 'BACKEND' && backendStatus?.state === 'connected' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              className="status-pill status-documented"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.75rem' }}
              title="FastAPI gateway connected and healthy"
            >
              <CheckCircle2 size={12} />
              <span>FastAPI Online</span>
            </span>

            {onRefreshBackend && (
              <button
                className="btn-inspect"
                onClick={onRefreshBackend}
                disabled={isRefreshing}
                title={lastRefreshedAt ? `Last refreshed: ${lastRefreshedAt}. Click to reload live data.` : "Refresh live backend data"}
                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              >
                <RefreshCw size={12} className={isRefreshing ? "spin-icon" : ""} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            )}

            {onRunParser && (
              <button
                className="btn-inspect"
                onClick={onRunParser}
                disabled={isParserRunning}
                title="Execute Python traffic parser against sample_events.json"
                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              >
                {isParserRunning ? (
                  <>
                    <RefreshCw size={12} className="spin-icon" />
                    <span>Parsing...</span>
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    <span>Run Parser</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Data Source Switcher: Demo Mode vs Live Backend */}
        <div className="datasource-toggle-group" title="Switch data provider between local synthetic dataset and live backend API.">
          <button
            className={`datasource-btn ${dataSourceMode === 'DEMO' ? 'active-demo' : ''}`}
            onClick={() => onToggleDataSourceMode && onToggleDataSourceMode('DEMO')}
          >
            <AlertTriangle size={13} />
            <span>DEMO MODE</span>
          </button>
          <button
            className={`datasource-btn ${dataSourceMode === 'BACKEND' ? 'active-backend' : ''}`}
            onClick={() => onToggleDataSourceMode && onToggleDataSourceMode('BACKEND')}
          >
            <span>BACKEND API</span>
          </button>
        </div>
      </div>
    </header>
  );
}
