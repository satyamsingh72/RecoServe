import { useEffect, useRef, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import { RoleGuard } from '../components/Guards';
import {
  fetchPipelineStatus,
  triggerPipeline,
  refreshData,
  type PipelineStatusResponse,
} from '../api/client';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function elapsed(started: string | null, ended: string | null): string {
  if (!started) return '—';
  const end = ended ? new Date(ended) : new Date();
  const ms = end.getTime() - new Date(started).getTime();
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
}

export default function Pipeline() {
  const [status, setStatus]         = useState<PipelineStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [running, setRunning]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState('');
  const [error, setError]           = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadStatus = async () => {
    try {
      const s = await fetchPipelineStatus();
      setStatus(s);
      // Stop polling when terminal state reached
      if (['SUCCEEDED', 'FAILED', 'STOPPED', 'IDLE'].includes(s.status)) {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    } catch { /* keep last status */ }
    finally { setLoadingStatus(false); }
  };

  useEffect(() => {
    loadStatus();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(loadStatus, 3000);
  };

  const handleRunPipeline = async () => {
    setError('');
    setRunning(true);
    try {
      const s = await triggerPipeline();
      setStatus(s);
      startPolling();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Failed to trigger pipeline');
    } finally {
      setRunning(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshMsg('');
    setRefreshing(true);
    try {
      const r = await refreshData();
      setRefreshMsg(`✅ ${r.message} — ${r.customers_loaded.toLocaleString()} customers loaded`);
    } catch {
      setRefreshMsg('❌ Data refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const pipelineRunning = status?.status === 'RUNNING';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">⚙️ Pipeline Control</h1>
        <p className="page-subtitle">Trigger SageMaker ML pipeline and manage in-memory data refresh</p>
      </div>

      {error && <div className="error-msg">{error}</div>}
      {refreshMsg && (
        <div style={{
          padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: 16,
          background: refreshMsg.startsWith('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${refreshMsg.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          color: refreshMsg.startsWith('✅') ? 'var(--success)' : 'var(--danger)',
          fontSize: 13,
        }}>
          {refreshMsg}
        </div>
      )}

      <div className="pipeline-panel">
        {/* Actions Panel */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">Actions</div>
              <div className="card-subtitle">Run pipeline or refresh data</div>
            </div>
          </div>

            <div className="action-row">
              <RoleGuard allowedRoles={["Admin"]}>
                <button
                  className="btn btn-primary"
                  onClick={handleRunPipeline}
                  disabled={running || pipelineRunning}
                  id="run-pipeline-btn"
                >
                  {running || pipelineRunning
                    ? <><Spinner size={15} /> Running…</>
                    : <>▶ Run Pipeline</>}
                </button>
              </RoleGuard>

              <RoleGuard allowedRoles={["Admin"]}>
                <button
                  className="btn btn-secondary"
                  onClick={handleRefreshData}
                  disabled={refreshing}
                  id="refresh-data-btn"
                >
                  {refreshing ? <><Spinner size={15} /> Refreshing…</> : '🔄 Refresh Data'}
                </button>
              </RoleGuard>
            </div>


          <div className="divider" />

          <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Run Pipeline</strong> triggers the SageMaker execution and polls for status automatically.<br />
            <strong style={{ color: 'var(--text-secondary)' }}>Refresh Data</strong> reloads the Parquet file from S3 and rebuilds the in-memory lookup without restarting the server.
          </p>
        </div>

        {/* Status Panel */}
        <div className="glass-card">
          <div className="card-header">
            <div>
              <div className="card-title">Pipeline Status</div>
              <div className="card-subtitle">
                {pipelineRunning ? 'Polling every 3s…' : 'Last execution details'}
              </div>
            </div>
            {pipelineRunning && <Spinner size={18} />}
          </div>

          {loadingStatus ? (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'var(--text-muted)' }}>
              <Spinner /> Loading…
            </div>
          ) : status ? (
            <div className="info-row">
              <div className="info-item">
                <span className="info-key">Status</span>
                <StatusBadge status={status.status} />
              </div>
              <div className="info-item">
                <span className="info-key">Pipeline</span>
                <span className="info-val">{status.pipeline_name}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Execution ARN</span>
                <span className="info-val mono">{status.execution_arn ?? '—'}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Started</span>
                <span className="info-val">{fmtDate(status.started_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Ended</span>
                <span className="info-val">{fmtDate(status.ended_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-key">Elapsed</span>
                <span className="info-val">{elapsed(status.started_at, status.ended_at)}</span>
              </div>
              {status.failure_reason && (
                <div className="info-item">
                  <span className="info-key">Failure Reason</span>
                  <span className="info-val" style={{ color: 'var(--danger)' }}>{status.failure_reason}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-title">No execution yet</div>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="glass-card" style={{ marginTop: 0, animationDelay: '100ms' }}>
        <div className="card-header">
          <div className="card-title">📐 Architecture — Data Flow</div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}>
          {[
            { icon: '🧠', title: 'SageMaker Pipeline', desc: 'Runs ML training and recommendation generation' },
            { icon: '🪣', title: 'S3 Storage',          desc: 'Stores recommendations.parquet as source of truth' },
            { icon: '🔄', title: 'Data Refresh API',    desc: 'POST /data/refresh reloads Parquet → memory' },
            { icon: '⚡', title: 'In-Memory Lookup',    desc: 'Dict-based O(1) lookup, sub-10ms latency' },
          ].map(step => (
            <div key={step.title} style={{
              background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
              padding: 16, border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{step.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
