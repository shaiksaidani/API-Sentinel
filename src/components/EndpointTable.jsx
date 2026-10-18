import React, { useState, useMemo } from 'react';
import { Search, Filter, RotateCcw, AlertCircle, CheckCircle2, ShieldCheck, EyeOff } from 'lucide-react';

export default function EndpointTable({ endpoints = [], globalSearch = '', onClearGlobalSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [docFilter, setDocFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  // Combined search term considering global header search and local table search
  const effectiveSearch = (searchTerm || globalSearch).trim().toLowerCase();

  const filteredEndpoints = useMemo(() => {
    return endpoints.filter((item) => {
      // Safe multi-field search matching
      const matchesSearch =
        !effectiveSearch ||
        item.endpoint?.toLowerCase().includes(effectiveSearch) ||
        item.method?.toLowerCase().includes(effectiveSearch) ||
        item.docStatus?.toLowerCase().includes(effectiveSearch) ||
        item.riskStatus?.toLowerCase().includes(effectiveSearch) ||
        (item.description && item.description.toLowerCase().includes(effectiveSearch));

      // Doc status filter
      const matchesDoc =
        docFilter === 'ALL' || item.docStatus === docFilter;

      // Risk status filter
      const matchesRisk =
        riskFilter === 'ALL' || item.riskStatus === riskFilter;

      // Method filter
      const matchesMethod =
        methodFilter === 'ALL' || item.method === methodFilter;

      return matchesSearch && matchesDoc && matchesRisk && matchesMethod;
    });
  }, [endpoints, effectiveSearch, docFilter, riskFilter, methodFilter]);

  const handleReset = () => {
    setSearchTerm('');
    setDocFilter('ALL');
    setRiskFilter('ALL');
    setMethodFilter('ALL');
    if (onClearGlobalSearch) {
      onClearGlobalSearch();
    }
  };

  const isFiltered = Boolean(
    searchTerm || 
    (globalSearch && globalSearch.trim()) || 
    docFilter !== 'ALL' || 
    riskFilter !== 'ALL' || 
    methodFilter !== 'ALL'
  );

  const getMethodClass = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'method-get';
      case 'POST': return 'method-post';
      case 'PUT': return 'method-put';
      case 'DELETE': return 'method-delete';
      case 'PATCH': return 'method-patch';
      default: return 'method-get';
    }
  };

  return (
    <div className="content-section" id="endpoints-section">
      <div className="section-header">
        <div className="section-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3>API Endpoint Inventory</h3>
            <span className="table-count-badge">
              {filteredEndpoints.length} of {endpoints.length} routes
            </span>
          </div>
          <p>Discovered route pathways with mock OpenAPI documentation reconciliation</p>
        </div>

        {/* Filter Controls */}
        <div className="table-controls">
          <input
            type="text"
            className="control-input"
            placeholder={globalSearch ? `Filter (${globalSearch})...` : "Search endpoints..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="control-select"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            <option value="ALL">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>

          <select
            className="control-select"
            value={docFilter}
            onChange={(e) => setDocFilter(e.target.value)}
          >
            <option value="ALL">All Doc Statuses</option>
            <option value="Documented">Documented</option>
            <option value="Undocumented Candidate">Undocumented (Shadow Candidate)</option>
          </select>

          <select
            className="control-select"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
          >
            <option value="ALL">All Risk Statuses</option>
            <option value="Normal">Normal</option>
            <option value="Review Required">Review Required</option>
          </select>

          {isFiltered && (
            <button className="btn-reset" onClick={handleReset} title="Reset filters">
              <RotateCcw size={13} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>HTTP Method</th>
              <th>Endpoint URI</th>
              <th>Request Count</th>
              <th>Documentation Status</th>
              <th>Risk Status</th>
              <th>Context / Notes</th>
            </tr>
          </thead>
          <tbody>
            {filteredEndpoints.length > 0 ? (
              filteredEndpoints.map((ep) => (
                <tr key={ep.id}>
                  <td>
                    <span className={`method-badge ${getMethodClass(ep.method)}`}>
                      {ep.method}
                    </span>
                  </td>
                  <td className="endpoint-cell">
                    {ep.endpoint}
                  </td>
                  <td>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>
                      {ep.requestCount.toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    {ep.docStatus === 'Documented' ? (
                      <span className="status-pill status-documented">
                        <CheckCircle2 size={12} />
                        Documented
                      </span>
                    ) : (
                      <span 
                        className="status-pill status-undocumented" 
                        title="Flagged because it is absent from the mock documentation catalog, not because it is inherently vulnerable."
                      >
                        <EyeOff size={12} />
                        Undocumented Candidate
                      </span>
                    )}
                  </td>
                  <td>
                    {ep.riskStatus === 'Normal' ? (
                      <span className="status-pill status-normal">
                        <ShieldCheck size={12} />
                        Normal
                      </span>
                    ) : (
                      <span className="status-pill status-review">
                        <AlertCircle size={12} />
                        Review Required
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    {ep.description}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">
                  <div className="empty-state">
                    <AlertCircle size={32} className="empty-state-icon" />
                    <h4>No Matching Endpoints Found</h4>
                    <p>Try modifying your search query or loosening your filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
