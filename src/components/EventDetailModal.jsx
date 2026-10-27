import React, { useEffect } from 'react';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Server,
  Globe,
  Code,
  CheckCircle2,
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function EventDetailModal({ event, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const getSeverityBadgeClass = (severity) => {
    const s = severity?.toUpperCase() || 'LOW';
    if (s === 'CRITICAL') return 'severity-pill severity-critical';
    if (s === 'HIGH') return 'severity-pill severity-high';
    if (s === 'MEDIUM') return 'severity-pill severity-medium';
    return 'severity-pill severity-low';
  };

  const getMethodBadgeClass = (method) => {
    switch (method?.toUpperCase()) {
      case 'GET': return 'method-badge method-get';
      case 'POST': return 'method-badge method-post';
      case 'PUT': return 'method-badge method-put';
      case 'DELETE': return 'method-delete';
      case 'PATCH': return 'method-badge method-patch';
      default: return 'method-badge method-get';
    }
  };

  const getStatusBadgeClass = (code) => {
    if (!code) return 'status-pill status-normal';
    if (code >= 200 && code < 300) return 'status-pill status-documented';
    if (code >= 400 && code < 500) return 'status-pill status-review';
    if (code >= 500) return 'status-pill status-review';
    return 'status-pill status-normal';
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-icon-badge">
              {(event.eventType === 'BOLA Suspicion' || event.eventType === 'Potential Authorization Review Candidate') && <ShieldAlert size={20} color="var(--color-critical)" />}
              {(event.eventType === 'Shadow API Candidate' || event.eventType === 'Uncataloged Route Observation') && <AlertTriangle size={20} color="var(--color-warning)" />}
              {event.eventType === 'Unusual Access Pattern' && <Clock size={20} color="var(--primary-blue)" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 className="modal-title">{event.id}</h3>
                <span className={getSeverityBadgeClass(event.severity)}>
                  {event.severity}
                </span>
                <span className="status-pill status-normal">
                  {event.status}
                </span>
              </div>
              <p className="modal-subtitle">
                {event.eventType} • Logged at {event.timestamp}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Metadata Grid */}
          <div className="detail-meta-grid">
            <div className="detail-meta-card">
              <span className="detail-meta-label">HTTP Method & Path</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span className={getMethodBadgeClass(event.method)}>
                  {event.method || 'GET'}
                </span>
                <span className="endpoint-cell" style={{ wordBreak: 'break-all' }}>
                  {event.endpoint}
                </span>
              </div>
            </div>

            <div className="detail-meta-card">
              <span className="detail-meta-label">Client Source IP</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                <Globe size={14} color="var(--primary-blue)" />
                <span>{event.sourceIp || '127.0.0.1 (Loopback)'}</span>
              </div>
            </div>

            <div className="detail-meta-card">
              <span className="detail-meta-label">Response Status Code</span>
              <div style={{ marginTop: 4 }}>
                <span className={getStatusBadgeClass(event.statusCode)}>
                  HTTP {event.statusCode || 200}
                </span>
              </div>
            </div>

            <div className="detail-meta-card">
              <span className="detail-meta-label">Detection Classification</span>
              <div style={{ marginTop: 4, fontWeight: 600, color: 'var(--text-main)' }}>
                {event.eventType}
              </div>
            </div>
          </div>

          {/* Detection Analysis */}
          <div className="detail-section">
            <h4 className="detail-section-title">
              <ShieldCheck size={16} color="#93C5FD" />
              Detection Heuristic & Telemetry Findings
            </h4>
            <div className="detail-text-box">
              <p style={{ color: 'var(--text-main)', marginBottom: 8, fontSize: '0.85rem' }}>
                {event.details}
              </p>
              <div className="simulation-note-box">
                <strong>Simulated Heuristic Context:</strong> {event.simulationNote}
              </div>
            </div>
          </div>

          {/* Authentication & Object Ownership Context (BOLA Triage) */}
          {(event.authenticatedUserId || event.objectOwnerId) && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <Lock size={16} color="#FBBF24" />
                Object Authorization Context (BOLA Triage)
              </h4>
              <div className="detail-meta-grid" style={{ marginBottom: 8 }}>
                <div className="detail-meta-card">
                  <span className="detail-meta-label">Authenticated Caller ID</span>
                  <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
                    {event.authenticatedUserId || 'Anonymous / Unset'}
                  </div>
                </div>
                <div className="detail-meta-card">
                  <span className="detail-meta-label">Target Object Owner ID</span>
                  <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
                    {event.objectOwnerId || 'Unset'}
                  </div>
                </div>
              </div>
              <div className="simulation-note-box" style={{ background: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <strong>Authorization Advisory:</strong> A discrepancy between caller identity and object owner identity constitutes a candidate for authorization policy verification. It is not confirmed evidence of vulnerability without verified backend access control telemetry.
              </div>
            </div>
          )}

          {/* Recommended Mitigation */}
          {event.mitigation && (
            <div className="detail-section">
              <h4 className="detail-section-title">
                <CheckCircle2 size={16} color="var(--color-success)" />
                Recommended Security Remediation
              </h4>
              <div className="mitigation-box">
                {event.mitigation}
              </div>
            </div>
          )}

          {/* Sanitized Request Headers */}
          <div className="detail-section">
            <h4 className="detail-section-title">
              <Server size={16} color="#93C5FD" />
              Observed Request Headers (Sanitized)
            </h4>
            <div className="code-block-wrapper">
              <pre className="doc-code-block" style={{ margin: 0 }}>
                {event.requestHeaders
                  ? JSON.stringify(event.requestHeaders, null, 2)
                  : "{\n  \"User-Agent\": \"HTTP-Client/1.0\",\n  \"Accept\": \"*/*\"\n}"
                }
              </pre>
            </div>
          </div>

          {/* Request Payload Inspection (Guarded) */}
          <div className="detail-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h4 className="detail-section-title" style={{ margin: 0 }}>
                <Code size={16} color="#93C5FD" />
                Payload Inspection
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={12} />
                Masked by Default
              </span>
            </div>

            <div className="code-block-wrapper">
              {event.requestBody ? (
                <pre className="doc-code-block" style={{ margin: 0 }}>
                  {JSON.stringify(event.requestBody, null, 2)}
                </pre>
              ) : (
                <div style={{ padding: '12px 16px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  No request body payload observed on this transaction (standard GET query / empty body).
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            API-Sentinel Security Operations Center • Incident Telemetry
          </span>
          <button className="btn-primary" onClick={onClose}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
